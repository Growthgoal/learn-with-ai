// Writes each skill's own intake form once, so no learner's form ever costs
// AI credit: a few goals to pick from, and the questions a teacher of that
// skill would ask, including the learner's own situation in their own words
// and follow-ups that appear only when an answer calls for them.
// Saved to src/catalog/questions.json. --redo rewrites every form.
// usage: tsx scripts/make-questions.ts [concurrency] [--redo] [skill-id ...]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatJson } from '../src/meta.js'
import { SKILLS } from '../src/catalog/skills.js'
import { cleanForm, FORM_RULES, QUESTION_SCHEMA, SkillForm } from '../src/catalog/forms.js'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/catalog/questions.json')
const done: Record<string, SkillForm> = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
const args = process.argv.slice(2)
const conc = Number(args.find((a) => /^\d+$/.test(a)) ?? 8)
const redo = args.includes('--redo')
const only = args.filter((a) => !/^\d+$/.test(a) && a !== '--redo')

const SCHEMA = {
  name: 'SkillForm',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['goals', 'questions'],
    properties: { goals: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: QUESTION_SCHEMA } },
  },
}

const todo = SKILLS.filter((s) => (only.length ? only.includes(s.id) : redo || !done[s.id]))
let next = 0
async function worker() {
  while (next < todo.length) {
    const s = todo[next++]
    try {
      const { value } = await chatJson<SkillForm>(
        [
          {
            role: 'system',
            content: `You design the short form a new learner fills on GrowthGoal before an AI writes their personal workbook for one skill.\n${FORM_RULES}`,
          },
          { role: 'user', content: `Skill: ${s.name}. Shelf: ${s.group}. For: ${s.ages.join(', ')}. Work is handed in as: ${s.proof} (${s.handIn}).` },
        ],
        { task: 'make-form', ref: `form-${s.id}`, effort: 'minimal', maxTokens: 5000, schema: SCHEMA },
      )
      done[s.id] = cleanForm(value)
      fs.writeFileSync(FILE, JSON.stringify(done, null, 1))
      const qs = done[s.id].questions
      console.log('form', s.id, qs.length, 'text', qs.filter((q) => q.type === 'text').length, 'followups', qs.filter((q) => q.showIf).length)
    } catch (e) {
      console.error('form failed', s.id, (e as Error).message)
    }
  }
}
await Promise.all(Array.from({ length: conc }, worker))
console.log('done', Object.keys(done).length)
