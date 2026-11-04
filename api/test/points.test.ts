import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ageBand, firstName, leaderboard, learnerIdOf, pointsFor } from '../src/points.js'
import type { BadgeRecord } from '../src/store.js'

test('a badge is worth its level times the score', () => {
  assert.equal(pointsFor(1, 85), 85)
  assert.equal(pointsFor(2, 80), 200)
  assert.equal(pointsFor(3, 100), 500)
  assert.equal(pointsFor(1, 140), 100, 'a score never counts above 100%')
  assert.equal(pointsFor(1, -5), 0)
})

test('age groups match the shelves', () => {
  assert.equal(ageBand(3), 'kids-3-7')
  assert.equal(ageBand(7), 'kids-3-7')
  assert.equal(ageBand(8), 'kids-8-12')
  assert.equal(ageBand(12), 'kids-8-12')
  assert.equal(ageBand(13), 'teens')
  assert.equal(ageBand(22), 'college')
  assert.equal(ageBand(59), 'working')
  assert.equal(ageBand(60), 'seniors')
})

test('the board shows a first name only', () => {
  assert.equal(firstName('  priya sharma '), 'Priya')
  assert.equal(firstName('rohit!! 😀'), 'Rohit')
  assert.equal(firstName(''), 'Learner')
})

test('one browser, two children: two learners', () => {
  assert.notEqual(learnerIdOf('device1234567', 'Aarav', 'a'), learnerIdOf('device1234567', 'Meera', 'b'))
  assert.equal(learnerIdOf('device1234567', 'Aarav', 'a'), learnerIdOf('device1234567', 'aarav K', 'c'))
})

const badge = (o: Partial<BadgeRecord>): BadgeRecord => ({
  id: 'x',
  code: 'c',
  learnerName: 'Priya',
  skillId: 'excel',
  skillName: 'Excel',
  level: 1,
  name: 'Badge',
  canDo: [],
  percent: 80,
  at: '2026-11-04T10:00:00.000Z',
  learnerId: 'p',
  ageBand: 'working',
  ...o,
})

test('each skill and level counts once, at its best score', () => {
  const rows = leaderboard([
    badge({ id: '1', percent: 70, points: 70 }),
    badge({ id: '2', percent: 90, points: 90 }),
    badge({ id: '3', level: 2, percent: 80, points: 200 }),
  ])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].points, 290)
  assert.equal(rows[0].badges, 2)
})

test('equal points share a rank, and the age filter holds', () => {
  const rows = leaderboard([
    badge({ id: '1', learnerId: 'a', learnerName: 'Asha', points: 90 }),
    badge({ id: '2', learnerId: 'b', learnerName: 'Bina', points: 90 }),
    badge({ id: '3', learnerId: 'c', learnerName: 'Chetan', points: 50, ageBand: 'teens' }),
  ])
  assert.deepEqual(rows.map((r) => r.rank), [1, 1, 3])
  assert.deepEqual(leaderboard([badge({ ageBand: 'teens', points: 10 })], { age: 'seniors' }), [])
})
