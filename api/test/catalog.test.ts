import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS, SKILLS } from '../src/catalog/skills.js'
import { formFor } from '../src/catalog/forms.js'
import { priceOf } from '../src/catalog/prices.js'
import { tagsFor } from '../src/catalog/tags.js'
import { search } from '../../web/src/search.js'

test('309 skills, each with its own id', () => {
  assert.equal(SKILLS.length, 309)
  assert.equal(new Set(SKILLS.map((s) => s.id)).size, SKILLS.length)
})

test('every skill has its own form, and every follow-up hangs on a real question', () => {
  for (const s of SKILLS) {
    const f = formFor(s.id)
    assert.ok(f, `${s.id} has no form`)
    assert.ok(f.questions.length >= 3 && f.questions.length <= 8, `${s.id}: ${f.questions.length} questions`)
    const ids = new Set(f.questions.map((q) => q.id))
    for (const q of f.questions) if (q.showIf) assert.ok(ids.has(q.showIf.id), `${s.id}/${q.id} follows a missing question`)
  }
})

test('the Seniors shelf has no children\'s handwriting', () => {
  const seniors = SKILLS.filter((s) => s.ages.includes('seniors'))
  assert.ok(seniors.length > 40)
  assert.deepEqual(seniors.filter((s) => s.group === 'Handwriting' || s.group === 'Early learning').map((s) => s.id), [])
})

test('five levels, each costing more than the one before', () => {
  assert.deepEqual(LEVELS.map((l) => l.name), ['Basic', 'Advanced', 'Pro', 'Expert', 'Master'])
  for (const s of SKILLS) {
    const p = LEVELS.map((l) => priceOf(s, l.n).price)
    assert.ok(p.every((x, i) => i === 0 || x > p[i - 1]), `${s.id}: ${p.join(' / ')}`)
  }
})

test('Expert and Master are each ₹75 more than the level before', () => {
  const career = SKILLS.find((s) => s.band === 'career')!
  const kids = SKILLS.find((s) => s.band === 'kids')!
  assert.deepEqual(LEVELS.map((l) => priceOf(career, l.n).price), [99, 149, 199, 274, 349])
  assert.deepEqual(LEVELS.map((l) => priceOf(kids, l.n).price), [69, 99, 129, 204, 279])
})

test('search forgives typos, Hinglish and Hindi', () => {
  const listed = SKILLS.map((s) => ({ ...s, ...tagsFor(s.id, s.group) })) as unknown as Parameters<typeof search>[0]
  const first = (q: string) => search(listed, q)[0]?.name ?? '(nothing)'
  assert.match(first('exel'), /Excel/i)
  assert.match(first('public speking'), /Public speaking/i)
  assert.ok(search(listed, 'angrezi bolna').some((s) => /English/.test(s.name)), 'angrezi bolna finds English')
  assert.ok(search(listed, 'पैसे').length > 0, 'Hindi finds money skills')
})
