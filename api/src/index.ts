import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { z } from 'zod'
import { ROOT } from './env.js'
import { LEVELS, SKILLS, sizeForLevel, skillById } from './catalog/skills.js'
import { priceOf, QUESTIONS } from './catalog/prices.js'
import { GUIDES } from './catalog/guides.js'
import { Learner, Size, SIZES, writeWorkbook } from './workbook/write.js'
import { image } from './meta.js'
import { workbookPdf } from './workbook/render.js'
import { Task, Workbook } from './workbook/schema.js'
import { intakeTurn } from './teach/intake.js'
import { teacherReply } from './teach/teacher.js'
import { gather, typedAnswers } from './check/evidence.js'
import { mark } from './check/mark.js'
import { badges, catalog, checks, newCode, WorkbookRecord, workbooks } from './store.js'

const app = express()
// Traefik sits in front on the server, so the visitor's address is one hop back.
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '1mb' }))
/** Everything lives under growthgoal.in/learn: a page of the shop, not a site of its own. */
export const BASE = '/learn'
const r = express.Router()
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

/**
 * While workbooks are free (the hackathon), a cap keeps one visitor, or a
 * bot, from spending the AI credit: per address per day, and in all.
 */
const LIMITS = { workbook: { perIp: 6, total: 300 }, check: { perIp: 40, total: 1500 }, intake: { perIp: 120, total: 6000 } }
const used = new Map<string, number>()
let usedDay = ''
function allow(kind: keyof typeof LIMITS, ip: string) {
  const day = new Date().toISOString().slice(0, 10)
  if (day !== usedDay) {
    used.clear()
    usedDay = day
  }
  const mine = `${kind}:${ip}`
  const all = `${kind}:*`
  if ((used.get(mine) ?? 0) >= LIMITS[kind].perIp || (used.get(all) ?? 0) >= LIMITS[kind].total) return false
  used.set(mine, (used.get(mine) ?? 0) + 1)
  used.set(all, (used.get(all) ?? 0) + 1)
  return true
}
const TOO_MANY = { error: 'That is the limit for today while Learn with AI is free. Come back tomorrow.' }

/** Every task with the answer key removed: what a learner's browser may see. */
function forLearner(w: Workbook) {
  const strip = (t: Task) => ({ ...t, answer: undefined })
  return { ...w, chapters: w.chapters.map((c) => ({ ...c, tasks: c.tasks.map(strip) })), finalTask: strip(w.finalTask) }
}
const allTasks = (w: Workbook) => [...w.chapters.flatMap((c) => c.tasks), w.finalTask]

// ---------------------------------------------------------------- catalogue

r.get('/api/skills', (_req, res) => {
  res.json({
    skills: SKILLS.map((s) => ({
      ...s,
      prices: LEVELS.map((l) => priceOf(s, l.n)),
      samples: LEVELS.map((l) => fs.existsSync(catalog.samplePath(s.id, l.n))),
      cover: fs.existsSync(catalog.coverPath(s.id)),
    })),
    levels: LEVELS,
    questions: QUESTIONS,
    payments: process.env.PAYMENTS === 'on',
  })
})

// ------------------------------------------------------------------ intake

r.post('/api/intake', async (req, res) => {
  const body = z.object({ skillId: z.string(), messages: z.array(message).max(30) }).safeParse(req.body)
  const skill = body.success ? skillById(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Pick a skill and say hello.' })
  if (!allow('intake', req.ip ?? '')) return res.status(429).json(TOO_MANY)
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
    // A cover picture drawn for this learner. A workbook without one is still a workbook.
    let cover: string | undefined
    try {
      const art = await image(
        `A warm, cheerful flat illustration for the cover of a learning workbook called "${workbook.title}" about ${skill.name}, made for a ${rec.learner.age}-year-old in India who loves ${rec.learner.interests.join(' and ') || 'learning'}. Simple bold shapes, soft lime green and sunny yellow tones, plenty of white space. No words, no letters, no numbers, no logos, no real people's faces.`,
        { task: 'cover-image', ref: rec.code, size: '1536x1024' },
      )
      fs.writeFileSync(workbooks.coverPath(rec.code), art)
      cover = 'data:image/jpeg;base64,' + art.toString('base64')
    } catch (e) {
      console.error('cover', rec.code, e)
    }
    const { pdf } = await workbookPdf({ workbook, skill, level: rec.level, learner: rec.learner, code: rec.code, cover })
    fs.writeFileSync(workbooks.pdfPath(rec.code), pdf)
    workbooks.put({ ...rec, workbook, status: 'ready' })
  } catch (e) {
    console.error('workbook', rec.code, e)
    workbooks.put({ ...rec, status: 'failed' })
  }
}

r.post('/api/workbooks', (req, res) => {
  const body = z
    .object({ skillId: z.string(), level: z.number().int().min(1).max(3), learner: learnerSchema })
    .safeParse(req.body)
  const skill = body.success ? skillById(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Something is missing about the learner. Go back to the chat and finish it.' })
  if (!allow('workbook', req.ip ?? '')) return res.status(429).json(TOO_MANY)
  // Payment happens on growthgoal.in before this point; during the hackathon it is free.
  const rec: WorkbookRecord = {
    code: newCode(),
    skillId: skill.id,
    level: body.data.level,
    // The level decides the size: Basic is the short book, Pro the long one.
    size: sizeForLevel(body.data.level) as Size,
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

r.get('/api/workbooks/:code', (req, res) => {
  const rec = workbooks.get(req.params.code)
  if (!rec) return res.status(404).json({ error: 'No workbook at this address. Check the code printed on your workbook.' })
  const skill = skillById(rec.skillId)!
  res.json({
    code: rec.code,
    status: rec.status,
    skill,
    level: rec.level,
    size: rec.size,
    sizeLabel: rec.size === 'fixup' ? 'Fix-up' : LEVELS.find((l) => l.n === rec.level)?.name ?? SIZES[rec.size].label,
    learner: { name: rec.learner.name, age: rec.learner.age, language: rec.learner.language, readBy: rec.learner.readBy },
    workbook: rec.workbook ? forLearner(rec.workbook) : null,
    questionsLeft: Math.max(0, QUESTIONS[rec.size] - rec.questions),
    checks: rec.checks.map((id) => checks.get(id)).filter(Boolean),
    badgeId: rec.badgeId ?? null,
    fixUpOf: rec.fixUpOf ?? null,
  })
})

r.get('/api/samples/:skill/:level.pdf', (req, res) => {
  const skill = skillById(req.params.skill)
  const file = skill && catalog.samplePath(skill.id, Number(req.params.level))
  if (!skill || !file || !fs.existsSync(file)) return res.status(404).json({ error: 'No sample for this level yet.' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="sample-${skill.id}-${LEVELS[Number(req.params.level) - 1]?.name.toLowerCase()}.pdf"`)
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.sendFile(file)
})

// ------------------------------------------------------------ free guides

r.get('/api/guides', (_req, res) => {
  res.json(
    GUIDES.map((g) => ({
      slug: g.slug,
      title: g.title,
      titleHi: g.titleHi,
      en: fs.existsSync(catalog.guidePath(g.slug, 'en')),
      hi: fs.existsSync(catalog.guidePath(g.slug, 'hi')),
      cover: fs.existsSync(catalog.guideCoverPath(g.slug)),
    })),
  )
})

r.get('/api/guides/:slug/cover', (req, res) => {
  const g = GUIDES.find((x) => x.slug === req.params.slug)
  const file = g && catalog.guideCoverPath(g.slug)
  if (!g || !file || !fs.existsSync(file)) return res.status(404).end()
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.type('jpeg').sendFile(file)
})

r.get('/api/guides/:slug/:lang.pdf', (req, res) => {
  const g = GUIDES.find((x) => x.slug === req.params.slug)
  const lang = req.params.lang === 'hi' ? 'hi' : 'en'
  const file = g && catalog.guidePath(g.slug, lang)
  if (!g || !file || !fs.existsSync(file)) return res.status(404).json({ error: 'This guide is not ready yet.' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="growthgoal-${g.slug}-${lang}.pdf"`)
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.sendFile(file)
})

r.get('/api/skills/:id/cover', (req, res) => {
  const skill = skillById(req.params.id)
  const file = skill && catalog.coverPath(skill.id)
  if (!skill || !file || !fs.existsSync(file)) return res.status(404).end()
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.type('jpeg').sendFile(file)
})

r.get('/api/workbooks/:code/cover', (req, res) => {
  const rec = workbooks.get(req.params.code)
  const file = rec && workbooks.coverPath(rec.code)
  if (!rec || !file || !fs.existsSync(file)) return res.status(404).end()
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.type('jpeg').sendFile(file)
})

r.get('/api/workbooks/:code/pdf', (req, res) => {
  const rec = workbooks.get(req.params.code)
  const file = rec && workbooks.pdfPath(rec.code)
  if (!rec || !file || !fs.existsSync(file)) return res.status(404).json({ error: 'The PDF is not ready yet.' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${rec.learner.name.replace(/[^\w]+/g, '-')}-${rec.skillId}-level-${rec.level}.pdf"`)
  res.sendFile(file)
})

// ----------------------------------------------------------------- teacher

r.post('/api/workbooks/:code/ask', async (req, res) => {
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

r.post('/api/workbooks/:code/check', upload.array('files', 40), async (req, res) => {
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
  if (!allow('check', req.ip ?? '')) return res.status(429).json(TOO_MANY)
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
    // Only when most of the work came in: a missing hand-in needs the work, not a new workbook.
    const handedIn = result.tasks.filter((t) => t.found).length / Math.max(1, result.tasks.length)
    if (scope === 'badge' && !result.passed && result.readable && handedIn >= 0.5) {
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

r.get('/api/badges/:id', (req, res) => {
  const b = badges.get(req.params.id)
  if (!b) return res.status(404).json({ error: 'No badge with this number.' })
  res.json(b)
})

// --------------------------------------------------------------- web app

const web = path.join(ROOT, 'web', 'dist')
if (fs.existsSync(web)) {
  r.use(express.static(web, { index: false, maxAge: '1h' }))
  r.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(web, 'index.html')))
}
app.use(BASE, r)
app.get('/', (_req, res) => res.redirect(BASE + '/'))

const port = Number(process.env.PORT) || 4300
app.listen(port, () => console.log(`Learn with AI on :${port}`))
