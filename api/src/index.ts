import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { z } from 'zod'
import { ROOT } from './env.js'
import { LEVELS, SKILLS, skillById } from './catalog/skills.js'
import { PRICES, QUESTIONS } from './catalog/prices.js'
import { Learner, Size, SIZES, writeWorkbook } from './workbook/write.js'
import { workbookPdf } from './workbook/render.js'
import { Task, Workbook } from './workbook/schema.js'
import { intakeTurn } from './teach/intake.js'
import { teacherReply } from './teach/teacher.js'
import { gather, typedAnswers } from './check/evidence.js'
import { mark } from './check/mark.js'
import { badges, checks, newCode, WorkbookRecord, workbooks } from './store.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 40, fileSize: 25 * 1024 * 1024 } })

const message = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })
const learnerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(3).max(100),
  language: z.enum(['English', 'Hindi', 'Hinglish']),
  goal: z.string().max(500),
  startingPoint: z.string().max(500),
  minutesPerDay: z.number().int().min(5).max(240),
  interests: z.array(z.string().max(60)).max(6),
  readBy: z.enum(['learner', 'parent']),
})

/** Every task with the answer key removed: what a learner's browser may see. */
function forLearner(w: Workbook) {
  const strip = (t: Task) => ({ ...t, answer: undefined })
  return { ...w, chapters: w.chapters.map((c) => ({ ...c, tasks: c.tasks.map(strip) })), finalTask: strip(w.finalTask) }
}
const allTasks = (w: Workbook) => [...w.chapters.flatMap((c) => c.tasks), w.finalTask]

// ---------------------------------------------------------------- catalogue

app.get('/api/skills', (_req, res) => {
  res.json({ skills: SKILLS, levels: LEVELS, prices: PRICES, questions: QUESTIONS, payments: process.env.PAYMENTS === 'on' })
})

// ------------------------------------------------------------------ intake

app.post('/api/intake', async (req, res) => {
  const body = z.object({ skillId: z.string(), messages: z.array(message).max(30) }).safeParse(req.body)
  const skill = body.success ? skillById(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Pick a skill and say hello.' })
  try {
    res.json(await intakeTurn(skill, body.data.messages))
  } catch (e) {
    console.error(e)
    res.status(502).json({ error: 'The AI teacher could not answer just now. Try again in a moment.' })
  }
})

// --------------------------------------------------------------- workbooks

/** Writes and prints a workbook in the background; the page polls for it. */
async function build(rec: WorkbookRecord, focus?: string) {
  try {
    const skill = skillById(rec.skillId)!
    const { workbook } = await writeWorkbook(skill, rec.level, rec.learner, rec.size, { ref: rec.code, focus })
    const { pdf } = await workbookPdf({ workbook, skill, level: rec.level, learner: rec.learner, code: rec.code })
    fs.writeFileSync(workbooks.pdfPath(rec.code), pdf)
    workbooks.put({ ...rec, workbook, status: 'ready' })
  } catch (e) {
    console.error('workbook', rec.code, e)
    workbooks.put({ ...rec, status: 'failed' })
  }
}

app.post('/api/workbooks', (req, res) => {
  const body = z
    .object({ skillId: z.string(), level: z.number().int().min(1).max(3), size: z.enum(['starter', 'standard', 'pro']), learner: learnerSchema })
    .safeParse(req.body)
  const skill = body.success ? skillById(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Something is missing about the learner. Go back to the chat and finish it.' })
  // Payment happens on growthgoal.in before this point; during the hackathon it is free.
  const rec: WorkbookRecord = {
    code: newCode(),
    skillId: skill.id,
    level: body.data.level,
    size: body.data.size as Size,
    learner: body.data.learner as Learner,
    status: 'writing',
    workbook: null,
    createdAt: new Date().toISOString(),
    questions: 0,
    checks: [],
  }
  workbooks.put(rec)
  void build(rec)
  res.status(202).json({ code: rec.code })
})

app.get('/api/workbooks/:code', (req, res) => {
  const rec = workbooks.get(req.params.code)
  if (!rec) return res.status(404).json({ error: 'No workbook at this address. Check the code printed on your workbook.' })
  const skill = skillById(rec.skillId)!
  res.json({
    code: rec.code,
    status: rec.status,
    skill,
    level: rec.level,
    size: rec.size,
    sizeLabel: SIZES[rec.size].label,
    learner: { name: rec.learner.name, age: rec.learner.age, language: rec.learner.language, readBy: rec.learner.readBy },
    workbook: rec.workbook ? forLearner(rec.workbook) : null,
    questionsLeft: Math.max(0, QUESTIONS[rec.size] - rec.questions),
    checks: rec.checks.map((id) => checks.get(id)).filter(Boolean),
    badgeId: rec.badgeId ?? null,
    fixUpOf: rec.fixUpOf ?? null,
  })
})

app.get('/api/workbooks/:code/pdf', (req, res) => {
  const rec = workbooks.get(req.params.code)
  const file = rec && workbooks.pdfPath(rec.code)
  if (!rec || !file || !fs.existsSync(file)) return res.status(404).json({ error: 'The PDF is not ready yet.' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${rec.learner.name.replace(/[^\w]+/g, '-')}-${rec.skillId}-level-${rec.level}.pdf"`)
  res.sendFile(file)
})

// ----------------------------------------------------------------- teacher

app.post('/api/workbooks/:code/ask', async (req, res) => {
  const rec = workbooks.get(req.params.code)
  const body = z.object({ taskId: z.string(), messages: z.array(message).min(1).max(30) }).safeParse(req.body)
  if (!rec?.workbook || !body.success) return res.status(400).json({ error: 'Ask about a task in a workbook that is ready.' })
  const task = allTasks(rec.workbook).find((t) => t.id === body.data.taskId)
  if (!task) return res.status(400).json({ error: 'That task is not in this workbook.' })
  if (rec.questions >= QUESTIONS[rec.size]) {
    return res.status(402).json({ error: 'You have used the questions included with this workbook. Copy the task prompt into ChatGPT, Gemini or Claude for as much help as you want.' })
  }
  try {
    const reply = await teacherReply(skillById(rec.skillId)!, rec.learner, task, body.data.messages, rec.code)
    workbooks.put({ ...rec, questions: rec.questions + 1 })
    res.json({ reply, questionsLeft: QUESTIONS[rec.size] - rec.questions - 1 })
  } catch (e) {
    console.error(e)
    res.status(502).json({ error: 'The AI teacher could not answer just now. Try again in a moment.' })
  }
})

// ------------------------------------------------------------------ checks

app.post('/api/workbooks/:code/check', upload.array('files', 40), async (req, res) => {
  const rec = workbooks.get(req.params.code)
  if (!rec?.workbook) return res.status(404).json({ error: 'No workbook here to check.' })
  const scope = req.body.scope === 'badge' ? 'badge' : 'page'
  const taskIds = typeof req.body.taskIds === 'string' && req.body.taskIds ? req.body.taskIds.split(',') : undefined
  let answers: Record<string, string> = {}
  try {
    answers = req.body.answers ? JSON.parse(req.body.answers) : {}
  } catch {
    return res.status(400).json({ error: 'Typed answers could not be read.' })
  }
  const files = (req.files as Express.Multer.File[]) ?? []
  const forTask = typeof req.body.forTask === 'string' ? req.body.forTask : undefined
  if (!files.length && !Object.keys(answers).length) return res.status(400).json({ error: 'Add a photo, a file, a recording or your typed answers first.' })
  const skill = skillById(rec.skillId)!
  const id = newCode()
  try {
    const evidence = await gather(
      files.map((f) => ({ name: f.originalname, mime: f.mimetype, data: f.buffer, taskId: forTask })),
      { handwriting: skill.group === 'Handwriting and writing' || skill.id === 'pencil-control-and-tracing', ref: rec.code, languages: ['English', 'Hindi'] },
    )
    evidence.notes.push(...typedAnswers(answers))
    const result = await mark({ workbook: rec.workbook, skill, learner: rec.learner, evidence, scope, taskIds: taskIds ?? (forTask ? [forTask] : undefined), ref: rec.code })
    const check = { id, code: rec.code, at: new Date().toISOString(), result } as Parameters<typeof checks.put>[0]
    let badgeId = rec.badgeId
    if (result.passed && !badgeId) {
      badgeId = newCode()
      badges.put({
        id: badgeId,
        code: rec.code,
        learnerName: rec.learner.name,
        skillId: skill.id,
        skillName: skill.name,
        level: rec.level,
        name: rec.workbook.badge.name,
        canDo: rec.workbook.badge.canDo,
        percent: result.percent,
        at: check.at,
      })
    }
    // A badge check that did not pass gets a free fix-up workbook for just the gaps.
    if (scope === 'badge' && !result.passed && result.readable) {
      const weak = result.tasks.filter((t) => t.score < (allTasks(rec.workbook!).find((x) => x.id === t.id)?.points ?? 1))
      const focus = [
        ...weak.map((t) => `- Task ${t.id}: ${allTasks(rec.workbook!).find((x) => x.id === t.id)?.instruction} — ${t.feedback}`),
        ...result.toImprove.map((x) => `- ${x}`),
      ].join('\n')
      const fix: WorkbookRecord = { ...rec, code: newCode(), size: 'fixup', status: 'writing', workbook: null, createdAt: check.at, fixUpOf: rec.code, questions: 0, checks: [], badgeId: undefined }
      workbooks.put(fix)
      void build(fix, focus)
      check.fixUpCode = fix.code
    }
    checks.put(check)
    workbooks.put({ ...rec, checks: [...rec.checks, id], badgeId })
    res.json({ ...check, badgeId: badgeId ?? null })
  } catch (e) {
    console.error('check', rec.code, e)
    res.status(502).json({ error: 'Checking did not finish. Try again in a moment; your work was not saved anywhere.' })
  }
})

app.get('/api/badges/:id', (req, res) => {
  const b = badges.get(req.params.id)
  if (!b) return res.status(404).json({ error: 'No badge with this number.' })
  res.json(b)
})

// --------------------------------------------------------------- web app

const web = path.join(ROOT, 'web', 'dist')
if (fs.existsSync(web)) {
  app.use(express.static(web, { index: false, maxAge: '1h' }))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(web, 'index.html')))
}

const port = Number(process.env.PORT) || 4300
app.listen(port, () => console.log(`Learn with AI on :${port}`))
