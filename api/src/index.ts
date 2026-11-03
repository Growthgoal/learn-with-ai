import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { z } from 'zod'
import { ROOT } from './env.js'
import { GROUPS, LEVELS, Skill, SKILLS, sizeForLevel, skillById } from './catalog/skills.js'
import { customSkills, findSkill, makeCustomSkill } from './catalog/custom.js'
import { GROUP_ICONS, tagsFor } from './catalog/tags.js'
import { priceOf, QUESTIONS } from './catalog/prices.js'
import { GUIDES } from './catalog/guides.js'
import { Learner, Size, SIZES, writeWorkbook } from './workbook/write.js'
import { image } from './meta.js'
import { SITE, workbookPdf } from './workbook/render.js'
import { Task, Workbook } from './workbook/schema.js'
import { followUps } from './teach/followups.js'
import { formFor } from './catalog/forms.js'
import { teacherReply } from './teach/teacher.js'
import { gather, typedAnswers } from './check/evidence.js'
import { mark } from './check/mark.js'
import { badges, catalog, checks, newCode, WorkbookRecord, workbooks } from './store.js'
import { ageBand, BoardFilter, firstName, leaderboard, learnerIdOf, pointsFor } from './points.js'
import type { Age } from './catalog/skills.js'

const app = express()
// Traefik sits in front on the server, so the visitor's address is one hop back.
app.set('trust proxy', 1)
app.use(cors())
// Only our own code runs on these pages: no script, frame or plugin from anywhere else.
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
  )
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})
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
  answers: z.array(z.object({ question: z.string().max(300), answer: z.string().max(600) })).max(20).optional(),
  notes: z.string().max(3000).optional(),
})

/**
 * While workbooks are free (the hackathon), a cap keeps one visitor, or a
 * bot, from spending the AI credit: per address per day, and in all.
 */
const LIMITS = { workbook: { perIp: 6, total: 300 }, check: { perIp: 40, total: 1500 }, intake: { perIp: 120, total: 6000 }, custom: { perIp: 8, total: 400 } }
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

/**
 * Levels are steps, not separate products: Advanced opens with the Basic badge
 * in the same skill, Pro with the Advanced badge. The badge is the proof, and
 * the workbook it was earned on is what the next level is built from.
 */
function unlockedBy(skillId: string, level: number, fromBadge: string | undefined) {
  if (level === 1) return { ok: true as const, badge: null }
  const b = fromBadge ? badges.get(fromBadge) : null
  const need = LEVELS.find((l) => l.n === level - 1)?.name ?? 'the level before'
  const want = LEVELS.find((l) => l.n === level)?.name ?? 'This level'
  if (!b || b.skillId !== skillId || b.level !== level - 1) {
    return { ok: false as const, error: `${want} opens once you have the ${need} badge in this skill. Finish ${need}, hand it in, and it unlocks.` }
  }
  return { ok: true as const, badge: b }
}
const fromBadge = z.string().regex(/^[a-z0-9]{6,20}$/).optional()

/** Every task with the answer key removed: what a learner's browser may see. */
function forLearner(w: Workbook) {
  const strip = (t: Task) => ({ ...t, answer: undefined })
  return { ...w, chapters: w.chapters.map((c) => ({ ...c, tasks: c.tasks.map(strip) })), finalTask: strip(w.finalTask) }
}
const allTasks = (w: Workbook) => [...w.chapters.flatMap((c) => c.tasks), w.finalTask]

/**
 * Printed copies are sold through the GrowthGoal shop's checkout. The button
 * stays hidden until the shop that takes the order is live: PRINT_ORDERS=on.
 */
const PRINT_ON = process.env.PRINT_ORDERS === 'on'

const run = promisify(execFile)
/** Pages in a workbook's PDF, read once and kept on the record: a printed copy is priced by them. */
async function pagesOf(rec: WorkbookRecord) {
  if (rec.pages) return rec.pages
  const file = workbooks.pdfPath(rec.code)
  if (rec.status !== 'ready' || !fs.existsSync(file)) return null
  try {
    const { stdout } = await run('pdfinfo', [file])
    const pages = Number(/^Pages:\s+(\d+)/m.exec(stdout)?.[1]) || null
    if (pages) workbooks.put({ ...rec, pages })
    return pages
  } catch (e) {
    console.error('pdfinfo', rec.code, e)
    return null
  }
}

// ---------------------------------------------------------------- catalogue

/** A skill as the shop shows it: prices, samples, picture and search words. */
const listing = (s: Skill) => ({
  ...s,
  ...tagsFor(s.id, s.group),
  prices: LEVELS.map((l) => priceOf(s, l.n)),
  samples: LEVELS.map((l) => fs.existsSync(catalog.samplePath(s.id, l.n))),
  samplePages: LEVELS.map((l) => [1, 2, 3, 4, 5].filter((p) => fs.existsSync(catalog.samplePagePath(s.id, l.n, p))).length),
  cover: fs.existsSync(catalog.coverPath(s.id)),
})

r.get('/api/skills', (_req, res) => {
  res.json({
    skills: SKILLS.map(listing),
    groups: GROUPS.map((name) => ({ name, icon: GROUP_ICONS[name] })),
    levels: LEVELS,
    questions: QUESTIONS,
    payments: process.env.PAYMENTS === 'on',
  })
})

// ------------------------------------------------------------------ intake

/** One skill, listed or a learner's own. */
r.get('/api/skills/:id', (req, res) => {
  const skill = findSkill(req.params.id)
  if (!skill) return res.status(404).json({ error: 'We do not teach that skill yet.' })
  res.json(listing(skill))
})

/** The skill's own form; filling it costs nothing. */
r.get('/api/skills/:id/form', (req, res) => {
  const form = formFor(req.params.id) ?? customSkills.get(req.params.id)?.form
  if (!form) return res.status(404).json({ error: 'No form for this skill yet.' })
  res.json(form)
})

/** A skill we do not list: one AI call checks it is safe and writes its form. */
r.post('/api/custom-skills', async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80), want: z.string().trim().max(400).default('') }).safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: 'Write the skill in a few words.' })
  if (!allow('custom', req.ip ?? '')) return res.status(429).json(TOO_MANY)
  try {
    const out = await makeCustomSkill(body.data.name, body.data.want)
    if (!out.ok) return res.status(422).json({ error: out.reason })
    res.json({ id: out.skill.id, name: out.skill.name })
  } catch (e) {
    console.error('custom skill', e)
    res.status(502).json({ error: 'The AI could not set this up just now. Try again in a moment.' })
  }
})

/** One AI call after the form: the few questions it still needs, if any. */
r.post('/api/followups', async (req, res) => {
  const body = z.object({ skillId: z.string(), level: z.number().int().min(1).max(3), learner: learnerSchema, fromBadge }).safeParse(req.body)
  const skill = body.success ? findSkill(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Something in the form is missing. Go back and check it.' })
  const gate = unlockedBy(skill.id, body.data.level, body.data.fromBadge)
  if (!gate.ok) return res.status(403).json({ error: gate.error })
  if (!allow('intake', req.ip ?? '')) return res.status(429).json(TOO_MANY)
  try {
    res.json(await followUps(skill, body.data.level, body.data.learner as Learner))
  } catch (e) {
    console.error(e)
    // Questions are a nicety; without them the workbook can still be written.
    res.json({ intro: '', questions: [] })
  }
})

// --------------------------------------------------------------- workbooks

/** Writes and prints a workbook in the background; the page polls for it. */
async function build(rec: WorkbookRecord, focus?: string) {
  try {
    const skill = findSkill(rec.skillId)!
    const prev = rec.builtOn ? workbooks.get(rec.builtOn) : null
    // The check that earned the badge says what to polish before going further.
    const passed = prev?.checks
      .map((id) => checks.get(id))
      .filter((c) => c?.result.scope === 'badge' && c.result.passed)
      .at(-1)?.result
    const before = prev?.workbook
      ? {
          level: prev.level,
          chapters: prev.workbook.chapters.map((c) => c.title),
          strengths: passed?.strengths ?? [],
          needs: [...(passed?.toImprove ?? []), ...(passed?.tasks.filter((t) => t.score < 1 || t.criteria.some((c) => !c.met)).map((t) => `${t.id}: ${t.feedback}`) ?? [])].slice(0, 8),
          percent: passed?.percent,
        }
      : undefined
    const { workbook } = await writeWorkbook(skill, rec.level, rec.learner, rec.size, { ref: rec.code, focus, before })
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
    .object({ skillId: z.string(), level: z.number().int().min(1).max(3), learner: learnerSchema, device: z.string().regex(/^[a-z0-9]{12,40}$/).optional(), fromBadge })
    .safeParse(req.body)
  const skill = body.success ? findSkill(body.data.skillId) : undefined
  if (!body.success || !skill) return res.status(400).json({ error: 'Something is missing about the learner. Go back and finish the form.' })
  const gate = unlockedBy(skill.id, body.data.level, body.data.fromBadge)
  if (!gate.ok) return res.status(403).json({ error: gate.error })
  if (!allow('workbook', req.ip ?? '')) return res.status(429).json(TOO_MANY)
  // Payment happens on growthgoal.in before this point; during the hackathon it is free.
  const rec: WorkbookRecord = {
    code: newCode(),
    skillId: skill.id,
    level: body.data.level,
    // The level decides the size: Basic is the short book, Pro the long one.
    size: sizeForLevel(body.data.level) as Size,
    learner: body.data.learner as Learner,
    device: body.data.device,
    // The workbook the badge was earned on: this level is written from it and its check.
    builtOn: gate.badge?.code,
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

r.get('/api/workbooks/:code', async (req, res) => {
  const rec = workbooks.get(req.params.code)
  if (!rec) return res.status(404).json({ error: 'No workbook at this address. Check the code printed on your workbook.' })
  const pages = await pagesOf(rec)
  const skill = findSkill(rec.skillId)!
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
    badgePoints: rec.badgeId ? badges.get(rec.badgeId)?.points ?? null : null,
    fixUpOf: rec.fixUpOf ?? null,
    pages,
    print: PRINT_ON,
  })
})

/**
 * What the GrowthGoal shop needs to sell a printed copy: it asks here, from
 * its own server, so the page count it charges by is ours and never the buyer's.
 */
r.get('/api/workbooks/:code/print', async (req, res) => {
  const rec = workbooks.get(req.params.code)
  const pages = rec && (await pagesOf(rec))
  if (!rec?.workbook || !pages) return res.status(404).json({ error: 'This workbook is not ready to print yet.' })
  res.json({
    code: rec.code,
    title: rec.workbook.title,
    skillName: findSkill(rec.skillId)?.name ?? rec.skillId,
    learnerName: rec.learner.name,
    levelLabel: rec.size === 'fixup' ? 'Fix-up' : LEVELS.find((l) => l.n === rec.level)?.name ?? '',
    pages,
    pdfUrl: `${SITE}/api/workbooks/${rec.code}/pdf`,
    coverUrl: fs.existsSync(workbooks.coverPath(rec.code)) ? `${SITE}/api/workbooks/${rec.code}/cover` : null,
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

r.get('/api/samples/:skill/:level/p:page.jpg', (req, res) => {
  const skill = skillById(req.params.skill)
  const file = skill && catalog.samplePagePath(skill.id, Number(req.params.level), Number(req.params.page))
  if (!skill || !file || !fs.existsSync(file)) return res.status(404).end()
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.type('jpeg').sendFile(file)
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
    const reply = await teacherReply(findSkill(rec.skillId)!, rec.learner, task, body.data.messages, rec.code)
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
  const skill = findSkill(rec.skillId)!
  const id = newCode()
  try {
    const evidence = await gather(
      files.map((f) => ({ name: f.originalname, mime: f.mimetype, data: f.buffer, taskId: forTask })),
      { handwriting: skill.group === 'Handwriting' || skill.id === 'pencil-control-and-tracing', ref: rec.code, languages: ['English', 'Hindi'] },
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
        points: pointsFor(rec.level, result.percent),
        learnerId: learnerIdOf(rec.device, rec.learner.name, rec.code),
        ageBand: ageBand(rec.learner.age),
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
      const fix: WorkbookRecord = { ...rec, code: newCode(), size: 'fixup', status: 'writing', workbook: null, createdAt: check.at, fixUpOf: rec.code, builtOn: undefined, questions: 0, checks: [], badgeId: undefined }
      workbooks.put(fix)
      void build(fix, focus)
      check.fixUpCode = fix.code
    }
    checks.put(check)
    workbooks.put({ ...rec, checks: [...rec.checks, id], badgeId })
    res.json({ ...check, badgeId: badgeId ?? null, points: badgeId ? badges.get(badgeId)?.points ?? null : null })
  } catch (e) {
    console.error('check', rec.code, e)
    res.status(502).json({ error: 'Checking did not finish. Try again in a moment; your work was not saved anywhere.' })
  }
})

r.get('/api/badges/:id', (req, res) => {
  const b = badges.get(req.params.id)
  if (!b) return res.status(404).json({ error: 'No badge with this number.' })
  res.json({ ...b, points: b.points ?? pointsFor(b.level, b.percent) })
})

/** The badges earned in this browser, by skill and level: which levels are open to whom. */
r.get('/api/progress', (req, res) => {
  const device = typeof req.query.device === 'string' && /^[a-z0-9]{12,40}$/.test(req.query.device) ? req.query.device : ''
  if (!device) return res.json({ badges: [] })
  const earned = workbooks
    .byDevice(device)
    .map((w) => (w.badgeId ? badges.get(w.badgeId) : null))
    .filter((b): b is NonNullable<typeof b> => !!b)
    .map((b) => ({ skillId: b.skillId, level: b.level, badgeId: b.id, name: firstName(b.learnerName) }))
  res.json({ badges: earned })
})

// ------------------------------------------------------------- leaderboard

const AGE_BANDS: Age[] = ['kids-3-7', 'kids-8-12', 'teens', 'college', 'working', 'seniors']

/**
 * Skill points, best first: everyone, an age group, a shelf or one skill, this
 * month or all time. With ?device= it also says where this browser's own
 * learners stand, even when they are not in the top 50.
 */
r.get('/api/leaderboard', (req, res) => {
  const q = (k: string) => (typeof req.query[k] === 'string' ? (req.query[k] as string) : '')
  const f: BoardFilter = {}
  if (AGE_BANDS.includes(q('age') as Age)) f.age = q('age') as Age
  if (q('skill') && findSkill(q('skill'))) f.skillIds = new Set([q('skill')])
  else if (q('group') && GROUPS.includes(q('group'))) f.skillIds = new Set(SKILLS.filter((s) => s.group === q('group')).map((s) => s.id))
  if (q('period') === 'month') {
    const now = new Date()
    f.since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  }
  const rows = leaderboard(badges.all(), f)
  const device = /^[a-z0-9]{12,40}$/.test(q('device')) ? q('device') : ''
  const mine = device ? rows.filter((r) => r.learnerId === learnerIdOf(device, r.name, '')) : []
  const strip = ({ learnerId, ...r }: (typeof rows)[number]) => ({ ...r, you: mine.some((m) => m.learnerId === learnerId) })
  res.json({ rows: rows.slice(0, 50).map(strip), mine: mine.map(strip), total: rows.length })
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
