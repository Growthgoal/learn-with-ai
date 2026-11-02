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
}
export interface SkillForm {
  goals: string[]
  questions: FormQuestion[]
}

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'questions.json')
let forms: Record<string, SkillForm> | null = null
export function formFor(skillId: string): SkillForm | null {
  if (!forms) forms = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
  return forms![skillId] ?? null
}
