import crypto from 'node:crypto'
import type { Age } from './catalog/skills.js'
import type { BadgeRecord } from './store.js'

/**
 * Skill points and the leaderboard they add up to.
 *
 * A badge is worth its level's points times the score on the final check:
 * Basic 100, Advanced 250, Pro 500, Expert 750, Master 1000, so 85% on Basic
 * is 85 points. Each skill
 * and level counts once per learner, at its best score, so doing the same
 * workbook again never climbs the board.
 *
 * There are no accounts yet, so a learner is this browser plus their first
 * name: two children on one phone stay two learners. When Learn with AI
 * joins GrowthGoal accounts, these move onto the child's profile.
 */
export const LEVEL_POINTS: Record<number, number> = { 1: 100, 2: 250, 3: 500, 4: 750, 5: 1000 }

export const pointsFor = (level: number, percent: number) => Math.round(((LEVEL_POINTS[level] ?? 100) * Math.max(0, Math.min(100, percent))) / 100)

export const ageBand = (age: number): Age =>
  age <= 7 ? 'kids-3-7' : age <= 12 ? 'kids-8-12' : age <= 17 ? 'teens' : age <= 22 ? 'college' : age < 60 ? 'working' : 'seniors'

/** What the board shows of a learner: their first name only, never more. */
export function firstName(name: string) {
  const first = name.trim().split(/\s+/)[0]?.replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 20) ?? ''
  return first ? first[0].toUpperCase() + first.slice(1) : 'Learner'
}

export const learnerIdOf = (device: string | undefined, name: string, code: string) =>
  device ? crypto.createHash('sha256').update(`${device}:${firstName(name).toLowerCase()}`).digest('hex').slice(0, 16) : `w-${code}`

export interface BoardRow {
  rank: number
  learnerId: string
  name: string
  ageBand: Age
  points: number
  badges: number
}

export interface BoardFilter {
  age?: Age
  /** Only badges in skills on this shelf, or in this one skill. */
  skillIds?: Set<string>
  since?: Date
}

/** Everyone's points under a filter, best first; ties share a rank. */
export function leaderboard(all: BadgeRecord[], f: BoardFilter = {}): BoardRow[] {
  const people = new Map<string, { name: string; ageBand: Age; at: string; best: Map<string, number> }>()
  for (const b of all) {
    if (f.since && new Date(b.at) < f.since) continue
    if (f.skillIds && !f.skillIds.has(b.skillId)) continue
    const id = b.learnerId ?? `w-${b.code}`
    const p = people.get(id) ?? { name: firstName(b.learnerName), ageBand: b.ageBand ?? 'working', at: b.at, best: new Map() }
    // The latest badge says how old they are now.
    if (b.at >= p.at) Object.assign(p, { name: firstName(b.learnerName), ageBand: b.ageBand ?? p.ageBand, at: b.at })
    const key = `${b.skillId}:${b.level}`
    p.best.set(key, Math.max(p.best.get(key) ?? 0, b.points ?? pointsFor(b.level, b.percent)))
    people.set(id, p)
  }
  const rows = [...people.entries()]
    .map(([learnerId, p]) => ({ learnerId, name: p.name, ageBand: p.ageBand, points: [...p.best.values()].reduce((a, b) => a + b, 0), badges: p.best.size }))
    .filter((r) => !f.age || r.ageBand === f.age)
    .sort((a, b) => b.points - a.points || b.badges - a.badges || a.name.localeCompare(b.name))
  let rank = 0
  return rows.map((r, i) => ({ ...r, rank: i > 0 && rows[i - 1].points === r.points ? rank : (rank = i + 1) }))
}
