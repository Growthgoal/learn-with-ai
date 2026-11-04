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
export type Size = 'starter' | 'standard' | 'pro'
export interface Skill {
  id: string; group: string; name: string; ages: Age[]; proof: Proof; handIn: string; weSell: boolean
  band: 'kids' | 'life' | 'career'
  /** Basic, Advanced, Pro. */
  prices: { price: number; ai: number }[]
  /** Whether a sample workbook exists for Basic, Advanced, Pro. */
  samples: boolean[]
  /** How many "Look inside" page pictures each sample has. */
  samplePages: number[]
  /** Whether Muse Image has drawn this skill's listing picture. */
  cover: boolean
  /** A Fluent Emoji name; the file is in /learn/icons. */
  icon: string
  /** What people type when they look for it, Hinglish and Hindi too. */
  keywords: string[]
  /** A skill a learner asked for that we do not list. */
  custom?: boolean
}
export interface Level { n: number; name: string; size: Size; about: string }
export interface Catalogue {
  skills: Skill[]
  /** The shelves in order, each with its icon. */
  groups: { name: string; icon: string }[]
  levels: Level[]
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
  /** Printed as a page to keep; older workbooks have none. */
  quickReference?: string[]
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
  /** Pages in the PDF, once it is ready: a printed copy is priced by them. */
  pages: number | null
  /** Whether a printed copy can be ordered from the shop yet. */
  print: boolean
  /** Skill points the badge earned, once there is one. */
  badgePoints: number | null
}
export interface Guide { slug: string; title: string; titleHi: string; en: boolean; hi: boolean; cover: boolean }
export interface Badge { id: string; code: string; learnerName: string; skillId: string; skillName: string; level: number; name: string; canDo: string[]; percent: number; at: string; points: number }
export interface BoardRow { rank: number; name: string; ageBand: Age; points: number; badges: number; you: boolean }
export interface Board { rows: BoardRow[]; mine: BoardRow[]; total: number }

export const iconUrl = (name: string) => `${BASE}icons/${name}.svg`

/** This workbook's own review, as its learner sees it. */
export interface MyReview { stars: number; text: string; status: 'pending' | 'approved' | 'hidden' }

/** An approved review on the testimonials page: first name and age group only. */
export interface Testimonial { name: string; ageBand: Age; by: 'learner' | 'parent'; skillId: string; skillName: string; level: string; stars: number; text: string; at: string; badge: boolean }

export const AGE_LABEL: Record<Age, string> = { 'kids-3-7': 'Kids 3–7', 'kids-8-12': 'Kids 8–12', teens: 'Teens', college: 'College', working: 'Working', seniors: 'Seniors' }
export const PROOF_LABEL: Record<Proof, string> = { pages: 'Photo of your pages', file: 'Upload a file', result: 'Photo of what you made', typed: 'Type your answers', voice: 'Record your voice' }
