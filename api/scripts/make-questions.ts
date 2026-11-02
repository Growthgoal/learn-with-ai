// Writes each skill's own intake form once, so no learner's form ever costs
// AI credit: a few goals to pick from, and 3 to 5 questions a teacher of that
// skill would ask. Saved to src/catalog/questions.json.
// usage: tsx scripts/make-questions.ts [concurrency]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatJson } from '../src/meta.js'
import { SKILLS } from '../src/catalog/skills.js'
import type { SkillForm } from '../src/catalog/forms.js'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/catalog/questions.json')
const done: Record<string, SkillForm> = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}

const SCHEMA = {
  name: 'SkillForm',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['goals', 'questions'],
    properties: {
      goals: { type: 'array', items: { type: 'string' } },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'label', 'type', 'options'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['single', 'multi', 'text'] },
            options: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
}

const todo = SKILLS.filter((s) => !done[s.id])
let next = 0
async function worker() {
  while (next < todo.length) {
    const s = todo[next++]
    const { value } = await chatJson<SkillForm>(
      [
        {
          role: 'system',
          content: `You design the short form a new learner fills on GrowthGoal before an AI writes their personal workbook. The form already asks their name, age, language, minutes a day, what they love, and has an "anything else" box at the end. Do not ask those again.
Write, in simple English a 10-year-old or a grandparent understands:
- "goals": 4 to 6 short options for what people usually want from this skill (under 8 words each).
- "questions": 3 to 5 questions a good teacher of this skill needs to plan the right workbook: where the learner is now, what goes wrong, what they have to practise with, and what they will use it for. Each answerable in seconds: prefer "single" or "multi" with 3 to 6 short options; use "text" (options empty) at most once. ids are short snake_case.
Never ask for a phone number, address, school, email, photo or anything private.`,
        },
        { role: 'user', content: `Skill: ${s.name}. Group: ${s.group}. For: ${s.ages.join(', ')}. Work is handed in as: ${s.proof} (${s.handIn}).` },
      ],
      { task: 'make-form', ref: `form-${s.id}`, effort: 'minimal', maxTokens: 4000, schema: SCHEMA },
    )
    done[s.id] = value
    fs.writeFileSync(FILE, JSON.stringify(done, null, 1))
    console.log('form', s.id, value.questions.length)
  }
}
await Promise.all(Array.from({ length: Number(process.argv[2] ?? 8) }, worker))
console.log('done', Object.keys(done).length)
