import type { Skill } from './api'

/**
 * The shop's search: forgiving like a big store's. Matches the start of
 * words, the search words each skill carries (Hinglish and Hindi too) and
 * small typos, and ranks names above everything else.
 */
const STOP = new Set('a an and the of to for in on with my me i want how learn learning course class classes sikhna seekhna sikho sikhe kaise kese hai he ka ki ke ko mujhe chahiye me mein se aur'.split(' '))

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean)
export const queryWords = (q: string) => {
  const all = words(q)
  const kept = all.filter((w) => !STOP.has(w))
  return kept.length ? kept : all
}

/** Edits needed to turn a into b, giving up once it passes max. */
function near(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    if (Math.min(...cur) > max) return false
    prev = cur
  }
  return prev[b.length] <= max
}

interface Indexed { skill: Skill; name: string[]; keys: string[]; rest: string[]; phrase: string }
const cache = new WeakMap<Skill[], Indexed[]>()
function index(skills: Skill[]) {
  let ix = cache.get(skills)
  if (!ix) {
    ix = skills.map((s) => ({
      skill: s,
      name: words(s.name),
      keys: (s.keywords ?? []).flatMap(words),
      rest: words(`${s.group} ${s.handIn}`),
      phrase: `${s.name} ${(s.keywords ?? []).join(' ')}`.toLowerCase(),
    }))
    cache.set(skills, ix)
  }
  return ix
}

function scoreWord(t: string, x: Indexed) {
  if (x.name.includes(t)) return 8
  if (x.name.some((w) => w.startsWith(t))) return 6
  if (x.keys.includes(t)) return 5
  if (x.keys.some((w) => w.startsWith(t))) return 4
  if (x.name.some((w) => w.includes(t)) || x.keys.some((w) => w.includes(t))) return 3
  if (x.rest.some((w) => w.startsWith(t))) return 1
  if (t.length >= 4) {
    const max = t.length >= 7 ? 2 : 1
    if ([...x.name, ...x.keys].some((w) => near(t, w.slice(0, t.length + max), max) || near(t, w, max))) return 2
  }
  return 0
}

/**
 * Skills matching the query, best first. Every word must match; when nothing
 * does, skills matching all but one word are shown instead.
 */
export function search(skills: Skill[], q: string) {
  const ts = queryWords(q)
  if (!ts.length) return skills
  const phrase = q.trim().toLowerCase()
  const scored = index(skills)
    .map((x) => {
      let score = 0
      let misses = 0
      for (const t of ts) {
        const s = scoreWord(t, x)
        if (!s) misses++
        score += s
      }
      if (x.phrase.includes(phrase)) score += 5
      return { skill: x.skill, score, misses }
    })
    .filter((r) => r.score > 0)
  const best = scored.some((r) => r.misses === 0) ? 0 : ts.length >= 2 ? 1 : -1
  return scored
    .filter((r) => r.misses <= best)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.skill)
}
