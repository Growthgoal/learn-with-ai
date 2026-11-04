import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { OUTPUT } from './env.js'
import type { Workbook } from './workbook/schema.js'
import type { Learner, Size } from './workbook/write.js'
import type { CheckResult } from './check/mark.js'
import type { Age } from './catalog/skills.js'

/**
 * Learner records as JSON files, one per workbook, check and badge.
 * Enough for the hackathon; it moves into GrowthGoal's Postgres when
 * Learn with AI joins the shop.
 */
const DATA = path.join(OUTPUT, 'data')
const dir = (kind: string) => {
  const d = path.join(DATA, kind)
  fs.mkdirSync(d, { recursive: true })
  return d
}

export interface WorkbookRecord {
  code: string
  skillId: string
  level: number
  size: Size
  learner: Learner
  /** Writing takes up to a minute or two; the page waits on this. */
  status: 'writing' | 'ready' | 'failed'
  workbook: Workbook | null
  createdAt: string
  /** Set on a fix-up workbook: the one whose check it follows. */
  fixUpOf?: string
  /** Pages in the PDF: what a printed copy is priced by. */
  pages?: number
  /** The browser it was made in, random: with the first name, who the learner is on the leaderboard. */
  device?: string
  /** The same learner's earlier level in this skill, which this one builds on. */
  builtOn?: string
  /** Questions asked to our AI teacher so far; the price includes a fixed number. */
  questions: number
  checks: string[]
  badgeId?: string
}

export interface CheckRecord {
  id: string
  code: string
  at: string
  result: CheckResult
  fixUpCode?: string
}

export interface BadgeRecord {
  id: string
  code: string
  learnerName: string
  skillId: string
  skillName: string
  level: number
  name: string
  canDo: string[]
  percent: number
  at: string
  /** Skill points it is worth (see points.ts), and whose they are. */
  points?: number
  learnerId?: string
  ageBand?: Age
}

/** Short, unambiguous, hard to guess: what goes in a printed URL. */
export const newCode = () => {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from(crypto.randomBytes(8), (b) => abc[b % abc.length]).join('')
}

function save(kind: string, id: string, value: unknown) {
  const file = path.join(dir(kind), `${id}.json`)
  fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2))
  fs.renameSync(file + '.tmp', file)
}
function load<T>(kind: string, id: string): T | null {
  if (!/^[a-z0-9-]+$/i.test(id)) return null
  const file = path.join(dir(kind), `${id}.json`)
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : null
}

export const workbooks = {
  get: (code: string) => load<WorkbookRecord>('workbooks', code),
  /** Every workbook made in one browser: few enough to read each time. */
  byDevice: (device: string) =>
    fs
      .readdirSync(dir('workbooks'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir('workbooks'), f), 'utf8')) as WorkbookRecord)
      .filter((w) => w.device === device),
  put: (w: WorkbookRecord) => save('workbooks', w.code, w),
  pdfPath: (code: string) => path.join(dir('pdf'), `${code}.pdf`),
  coverPath: (code: string) => path.join(dir('img'), `${code}.jpg`),
}
export const checks = {
  get: (id: string) => load<CheckRecord>('checks', id),
  put: (c: CheckRecord) => save('checks', c.id, c),
}
/** The shop window: one sample workbook per skill and level, and each skill's picture. */
export const catalog = {
  samplePath: (skillId: string, level: number) => path.join(dir(`catalog/samples/${skillId}`), `${level}.pdf`),
  sampleJsonPath: (skillId: string, level: number) => path.join(dir(`catalog/samples/${skillId}`), `${level}.json`),
  /** "Look inside": pictures of a sample's first pages, made by tools/make-look-inside.sh. */
  samplePagePath: (skillId: string, level: number, page: number) => path.join(dir(`catalog/samples/${skillId}`), `${level}-p${page}.jpg`),
  coverPath: (skillId: string) => path.join(dir('catalog/covers'), `${skillId}.jpg`),
  guidePath: (slug: string, lang: string) => path.join(dir('catalog/guides'), `${slug}-${lang}.pdf`),
  guideCoverPath: (slug: string) => path.join(dir('catalog/guides'), `${slug}.jpg`),
}

/**
 * A learner's word on their workbook, one per workbook. It goes on the
 * testimonials page only once the GrowthGoal admin, which reads and writes
 * this folder, sets it to approved.
 */
export interface ReviewRecord {
  code: string
  skillId: string
  level: number
  size: Size
  /** First name only; with `by: 'parent'` it is the child's. */
  name: string
  ageBand: Age
  by: 'learner' | 'parent'
  stars: number
  text: string
  at: string
  status: 'pending' | 'approved' | 'hidden'
}

export const reviews = {
  get: (code: string) => load<ReviewRecord>('reviews', code),
  put: (r: ReviewRecord) => save('reviews', r.code, r),
  all: (): ReviewRecord[] => {
    const d = dir('reviews')
    return fs
      .readdirSync(d)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => {
        try {
          return [JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) as ReviewRecord]
        } catch {
          return []
        }
      })
  },
}

let allBadges: { at: number; list: BadgeRecord[] } | null = null
export const badges = {
  get: (id: string) => load<BadgeRecord>('badges', id),
  put: (b: BadgeRecord) => {
    save('badges', b.id, b)
    allBadges = null
  },
  /** Every badge, for the leaderboard; read from disk at most every half minute. */
  all: (): BadgeRecord[] => {
    if (allBadges && Date.now() - allBadges.at < 30_000) return allBadges.list
    const d = dir('badges')
    const list = fs
      .readdirSync(d)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) as BadgeRecord)
    allBadges = { at: Date.now(), list }
    return list
  },
}
