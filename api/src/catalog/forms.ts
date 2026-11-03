import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Each skill's own intake form, written once by scripts/make-questions.ts so
 * that filling it never costs AI credit. The questions every form shares
 * (name, age, language, minutes a day, interests, anything else) are asked
 * by the web app itself.
 */
export interface FormQuestion {
  id: string
  label: string
  type: 'single' | 'multi' | 'text'
  options: string[]
  /** The workbook cannot be written without it. */
  required: boolean
  /** Asked only when an earlier answer opens it: running a business, so what do you sell. */
  showIf: { id: string; anyOf: string[] } | null
}
export interface SkillForm {
  goals: string[]
  questions: FormQuestion[]
}

/** The shape the AI writes a form in, for listed skills and learner-named ones alike. */
export const QUESTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'label', 'type', 'options', 'required', 'showIf'],
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    type: { type: 'string', enum: ['single', 'multi', 'text'] },
    options: { type: 'array', items: { type: 'string' } },
    required: { type: 'boolean' },
    showIf: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['id', 'anyOf'],
      properties: { id: { type: 'string' }, anyOf: { type: 'array', items: { type: 'string' } } },
    },
  },
}

/** What makes a form good enough to write a personal workbook from. */
export const FORM_RULES = `- "goals": 4 to 6 short options for what people usually want from this skill (under 8 words each).
- "questions": 4 to 7 questions a good teacher of this skill asks before planning lessons for one person.
  - The workbook is built around the learner's own real situation, so ask for it in their own words: 1 or 2 "text" questions about the specific thing the workbook will practise on: their business and what it sells, their job, their exam and date, their instrument, the language they already speak, the sport and position they play, their child's age and problem. Put a short example in the label, like "What is your business or idea? (e.g. home-made pickles, a mobile repair shop)". Mark the one the workbook cannot be written without "required": true.
  - The rest answerable in seconds: "single" or "multi" with 3 to 6 short options (options empty for "text"): where they are now, what goes wrong, what they have to practise with, what they will use it for.
  - Follow up where an answer opens a new need: "showIf" names an earlier question's id and the exact options that make this question appear, e.g. monthly sales and best-selling product only for those already selling. Otherwise "showIf" is null. A showIf question is never "required".
  - ids are short snake_case and unique.
- Never ask for a phone number, address, school name, email or photo. The form already asks name, age, language, minutes a day and interests, and ends with an "anything else" box: do not ask those again.
Write in simple English a 10-year-old or a grandparent understands.`

/** Drops anything the AI got wrong rather than showing it: a follow-up must point back at an earlier question and its real options. */
export function cleanForm(f: SkillForm): SkillForm {
  const seen: FormQuestion[] = []
  for (const q of f.questions.slice(0, 7)) {
    if (!q.id || !q.label || seen.some((x) => x.id === q.id)) continue
    const options = q.type === 'text' ? [] : q.options.filter(Boolean).slice(0, 8)
    if (q.type !== 'text' && options.length < 2) continue
    const parent = q.showIf && seen.find((x) => x.id === q.showIf!.id && x.type !== 'text')
    const anyOf = parent ? q.showIf!.anyOf.filter((o) => parent.options.includes(o)) : []
    const showIf = parent && anyOf.length ? { id: parent.id, anyOf } : null
    seen.push({ id: q.id, label: q.label, type: q.type, options, required: !!q.required && !showIf, showIf })
  }
  return { goals: f.goals.filter(Boolean).slice(0, 6), questions: seen }
}

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'questions.json')
let forms: Record<string, SkillForm> | null = null
export function formFor(skillId: string): SkillForm | null {
  if (!forms) forms = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
  return forms![skillId] ?? null
}
