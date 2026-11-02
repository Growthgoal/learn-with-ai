/** The app's own address on growthgoal.in, "/learn/". */
export const BASE = import.meta.env.BASE_URL

/** Talks to the Learn with AI API; errors carry the server's own message. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(BASE + 'api' + path, {
    ...init,
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  return data as T
}

export type Age = 'kids-3-7' | 'kids-8-12' | 'teens' | 'college' | 'working' | 'seniors'
export type Proof = 'pages' | 'file' | 'result' | 'typed' | 'voice'
export interface Skill { id: string; group: string; name: string; ages: Age[]; proof: Proof; handIn: string; weSell: boolean }
export type Size = 'starter' | 'standard' | 'pro'
export interface Catalogue {
  skills: Skill[]
  levels: { n: number; name: string }[]
  prices: Record<Size, { ai: number; price: number }>
  questions: Record<Size | 'fixup', number>
  payments: boolean
}
export interface Learner { name: string; age: number; language: 'English' | 'Hindi' | 'Hinglish'; goal: string; startingPoint: string; minutesPerDay: number; interests: string[]; readBy: 'learner' | 'parent' }
export interface Task { id: string; instruction: string; kind: string; trace: string | null; space: string; spaceSize: number; hint: string; stuckPrompt: string; rubric: string[]; points: number }
export interface Workbook {
  title: string; subtitle: string; welcome: string; howToUse: string[]
  plan: { day: number; chapter: number; minutes: number }[]
  chapters: { number: number; title: string; goal: string; lesson: string[]; example: { title: string; steps: string[] }; tasks: Task[]; checkpoint: string }[]
  finalTask: Task
  badge: { name: string; canDo: string[] }
}
export interface TaskMark { id: string; found: boolean; criteria: { criterion: string; met: boolean }[]; score: number; feedback: string }
export interface Check {
  id: string; code: string; at: string; fixUpCode?: string
  result: { readable: boolean; unreadableReason: string | null; tasks: TaskMark[]; integrity: { ok: boolean; note: string }; strengths: string[]; toImprove: string[]; summary: string; score: number; max: number; percent: number; passed: boolean; scope: 'badge' | 'page' }
}
export interface WorkbookView {
  code: string; status: 'writing' | 'ready' | 'failed'; skill: Skill; level: number; size: Size | 'fixup'; sizeLabel: string
  learner: Pick<Learner, 'name' | 'age' | 'language' | 'readBy'>
  workbook: Workbook | null; questionsLeft: number; checks: Check[]; badgeId: string | null; fixUpOf: string | null
}
export interface Badge { id: string; code: string; learnerName: string; skillId: string; skillName: string; level: number; name: string; canDo: string[]; percent: number; at: string }

export const AGE_LABEL: Record<Age, string> = { 'kids-3-7': 'Kids 3–7', 'kids-8-12': 'Kids 8–12', teens: 'Teens', college: 'College', working: 'Working', seniors: 'Seniors' }
export const PROOF_LABEL: Record<Proof, string> = { pages: 'Photo of your pages', file: 'Upload a file', result: 'Photo of what you made', typed: 'Type your answers', voice: 'Record your voice' }
