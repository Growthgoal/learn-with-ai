import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { OUTPUT } from './env.js'
import type { Workbook } from './workbook/schema.js'
import type { Learner, Size } from './workbook/write.js'
import type { CheckResult } from './check/mark.js'

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
  put: (w: WorkbookRecord) => save('workbooks', w.code, w),
  pdfPath: (code: string) => path.join(dir('pdf'), `${code}.pdf`),
  coverPath: (code: string) => path.join(dir('img'), `${code}.jpg`),
}
export const checks = {
  get: (id: string) => load<CheckRecord>('checks', id),
  put: (c: CheckRecord) => save('checks', c.id, c),
}
export const badges = {
  get: (id: string) => load<BadgeRecord>('badges', id),
  put: (b: BadgeRecord) => save('badges', b.id, b),
}
