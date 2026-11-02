import { chatJson, Effort } from '../meta.js'
import { LEVELS, Skill } from '../catalog/skills.js'
import { Workbook, workbookSchema } from './schema.js'

/** What the intake chat learns about a person before their workbook is written. */
export interface Learner {
  name: string
  /** Years. */
  age: number
  language: 'English' | 'Hindi' | 'Hinglish'
  goal: string
  /** Where they are now, in their own words or the intake's summary. */
  startingPoint: string
  minutesPerDay: number
  /** Things they like, so examples feel like theirs. */
  interests: string[]
  /** Who reads the instructions: the learner, or a parent beside a small child. */
  readBy: 'learner' | 'parent'
  /** The skill's own form, question by question, as the learner answered it. */
  answers?: { question: string; answer: string }[]
  /** Anything else they wanted to say, and their replies to the AI's few questions. */
  notes?: string
}

/** How big a workbook is. The price follows the size. */
export const SIZES = {
  starter: { chapters: 4, tasksPerChapter: 3, label: 'Starter' },
  standard: { chapters: 6, tasksPerChapter: 4, label: 'Standard' },
  pro: { chapters: 8, tasksPerChapter: 5, label: 'Pro' },
  /** After a check that did not pass: just the gaps, free. */
  fixup: { chapters: 2, tasksPerChapter: 3, label: 'Fix-up' },
} as const
export type Size = keyof typeof SIZES

const PROOF_RULES: Record<Skill['proof'], string> = {
  pages:
    'The learner works on paper, in this printed workbook. Every task must be doable in the space printed under it, and checkable from a phone photo of that page. Use "write" for written answers, "draw" for drawing, "solve" for working out.',
  file: 'The learner works on a computer or phone app. Each task says exactly what to make and what to save or share at the end (file type and file name). Use "file" tasks with space "none". Give sample data inline when a task needs data.',
  result:
    'The learner makes or does something real and photographs it. Each task says what to make and how to photograph it so the result can be judged from the photo. Use "make" tasks; keep a small "box" space for notes.',
  typed: 'The learner types answers into the app. Use "type" tasks with space "none". Questions must have answers that can be judged from text alone.',
  voice:
    'The learner records themselves speaking on a phone. Each "speak" task gives what to say or talk about and how long (in seconds), and is judged from the transcript and from how complete and fluent it is. Keep a small "lines" space for a written outline when it helps.',
}

function brief(skill: Skill, level: number, learner: Learner, size: Size, focus?: string) {
  const s = SIZES[size]
  const levelName = LEVELS.find((l) => l.n === level)?.name ?? 'Starter'
  return `Write a personal workbook.

SKILL: ${skill.name} (group: ${skill.group}). Level ${level}, ${levelName}.
HOW WORK IS HANDED IN: ${skill.proof}. ${PROOF_RULES[skill.proof]}
${
  skill.writing
    ? 'Writing is part of this skill: use "trace" tasks (with the exact text in "trace") for letters, words and lines to write over, then "write" tasks to write them freely.'
    : 'Writing is NOT this skill. Never set handwriting, tracing or copying practice ("write this line neatly", "trace the words"). Written answers are fine only where they are the skill\'s own work (a budget, a plan, a solved problem).'
}

LEARNER
- Name: ${learner.name}, age ${learner.age}
- Writes and reads in: ${learner.language}${
    learner.language === 'Hindi'
      ? '. Write EVERY word of the workbook in Hindi, in Devanagari script (हिंदी), even if the details below are typed in Roman letters. English words people use daily (UPI, OTP, Excel) may stay, written in Devanagari or as they are.'
      : learner.language === 'Hinglish'
        ? ' (Hindi words in Roman script, mixed with simple English)'
        : ''
  }
- Instructions are read by: ${learner.readBy === 'parent' ? 'a parent, sitting with the child; address the parent in the instructions and the child in the tasks' : 'the learner'}
- Goal: ${learner.goal}
- Starting point: ${learner.startingPoint}
- Time: ${learner.minutesPerDay} minutes a day
- Likes: ${learner.interests.join(', ') || 'not given'}${
    learner.answers?.length ? `\n\nWHAT THEY TOLD US ABOUT THIS SKILL\n${learner.answers.map((a) => `- ${a.question} ${a.answer}`).join('\n')}` : ''
  }${learner.notes ? `\n\nIN THEIR OWN WORDS\n${learner.notes}` : ''}

SIZE: exactly ${s.chapters} chapters, ${s.tasksPerChapter} tasks in each, plus one final task that uses everything.${
    focus
      ? `

THIS IS A FIX-UP WORKBOOK. The learner handed in their workbook and these parts need more practice. Teach only these, more slowly and with a fresh example each, and make the final task repeat the original task they missed:
${focus}`
      : ''
  }`
}

const RULES = `You are GrowthGoal's AI teacher. You write workbooks that a learner finishes on their own and comes out able to do something new. You are patient and warm, and you never make anyone feel slow.

How to write:
- Teach only the skill named, and every task practises that skill itself. No warm-ups, extras or practice from other skills.
- For learners aged 60 and over: respectful and practical, one small step at a time, never school-style drills, and never handwriting practice unless writing is the skill.
- One idea per chapter. Order chapters so each needs only what came before.
- Lessons are short: 2 to 4 brief paragraphs a learner of this age reads in two minutes. No jargon without a plain explanation.
- Every chapter has one worked example, step by step, before any task.
- Tasks go from easy to harder inside a chapter. The last task in each chapter uses the learner's own life, goal or interests.
- Use Indian settings and names, rupees, Indian festivals, food and places, unless the skill itself is about somewhere else.
- Instructions are one or two short sentences. For children under 8, a few words.
- Task ids are "<chapter>.<task>", e.g. "3.2". The final task's id is "final".
- "hint": one sentence that nudges without giving the answer.
- "stuckPrompt": a complete message the learner can paste into ChatGPT, Gemini, Claude or any AI assistant. It names the skill, the level, the task in full, says what the learner has tried, and asks the assistant to explain the idea simply with a different small example and to NOT give the answer to this task. Write it in the learner's language.
- "rubric": 2 to 4 things a checker can actually see in what is handed in (a photo of the page, the file, the photo of the result, the typed text or the transcript). Concrete, never vague like "good effort".
- "answer": the correct answer when there is exactly one (maths, grammar, facts); otherwise null. It is never printed.
- "points": 1 to 5 by difficulty; the final task 10.
- "spaceSize": lines to write on, or the box height in lines (2 to 14). Use 0 when space is "none".
- "trace" is only for trace tasks; otherwise null.
- "plan": spread the chapters over days so each day fits the learner's minutes; the final task gets its own day.
- "badge": a name for what they earn, and 3 to 5 things they can do once they finish ("can write all 26 capital letters on the line").
- Safe for every age. Law, health and money skills teach general knowledge: what the law says, how a system works, and when to see a lawyer, doctor or adviser. Never advice on the learner's own case, never a diagnosis or a medicine dose, never what to buy or invest in.
- Physical skills (sport, fitness, yoga, self-defence, first aid, repairs) put safety first: warm up, stop if it hurts, and do anything risky only with a trained adult.`

export interface WriteOptions {
  effort?: Effort
  ref?: string
  /** For a fix-up workbook: what the check said needs more practice. */
  focus?: string
}

export async function writeWorkbook(skill: Skill, level: number, learner: Learner, size: Size, o: WriteOptions = {}) {
  const { value, usage } = await chatJson<Workbook>(
    [
      { role: 'system', content: RULES },
      { role: 'user', content: brief(skill, level, learner, size, o.focus) },
    ],
    { task: 'write-workbook', ref: o.ref, effort: o.effort ?? 'low', maxTokens: 48000, schema: workbookSchema(skill.writing) },
  )
  return { workbook: value, usage }
}
