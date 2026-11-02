import { chatJson, Part } from '../meta.js'
import { Skill } from '../catalog/skills.js'
import { Task, Workbook } from '../workbook/schema.js'
import { Learner } from '../workbook/write.js'
import { Evidence } from './evidence.js'

export interface TaskMark {
  id: string
  found: boolean
  criteria: { criterion: string; met: boolean }[]
  score: number
  feedback: string
}

export interface Marking {
  readable: boolean
  unreadableReason: string | null
  tasks: TaskMark[]
  integrity: { ok: boolean; note: string }
  strengths: string[]
  toImprove: string[]
  summary: string
}

/** The result a learner sees, worked out from the marking by rule, not by the model. */
export interface CheckResult extends Marking {
  score: number
  max: number
  percent: number
  passed: boolean
  /** Badge checks look at the whole workbook; page checks only at the tasks handed in. */
  scope: 'badge' | 'page'
}

const MARKING_SCHEMA = {
  name: 'Marking',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['readable', 'unreadableReason', 'tasks', 'integrity', 'strengths', 'toImprove', 'summary'],
    properties: {
      readable: { type: 'boolean' },
      unreadableReason: { type: ['string', 'null'] },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'found', 'criteria', 'score', 'feedback'],
          properties: {
            id: { type: 'string' },
            found: { type: 'boolean' },
            criteria: {
              type: 'array',
              items: { type: 'object', additionalProperties: false, required: ['criterion', 'met'], properties: { criterion: { type: 'string' }, met: { type: 'boolean' } } },
            },
            score: { type: 'integer' },
            feedback: { type: 'string' },
          },
        },
      },
      integrity: { type: 'object', additionalProperties: false, required: ['ok', 'note'], properties: { ok: { type: 'boolean' }, note: { type: 'string' } } },
      strengths: { type: 'array', items: { type: 'string' } },
      toImprove: { type: 'array', items: { type: 'string' } },
      summary: { type: 'string' },
    },
  },
}

const RULES = `You are GrowthGoal's checker. You mark a learner's finished workbook tasks fairly and kindly, the way a good teacher would, and you only judge what you can actually see or read.

- Mark each task listed under TASKS TO MARK, in that order, using its rubric. A criterion is met only if the evidence shows it.
- If a task's work is not in the evidence, set found=false, score=0, and say in feedback what to hand in.
- Score each task from 0 to its points. Full points when every criterion is met.
- Where an exact answer is given, compare with it. Accept the same answer written differently.
- Segmentation measurements (from SAM 3.1) are exact; use them for size, spacing and "on the line" judgements and mention specific letters.
- Transcripts are what the learner said; judge content, completeness and fluency from them and the words-a-minute and filler-word counts.
- Feedback: one or two sentences per task, specific ("your B floats above the line; start it on the line"), never vague, never harsh. Write it in the learner's language. For a child, write to the parent and include one line of praise to read aloud.
- integrity.ok is false only if the work looks printed, copied from a key, or clearly done by different people across pages; explain in note. Otherwise ok=true and note is "".
- readable=false only if the photos are too blurry, dark or cut off to judge; say what to retake.
- strengths and toImprove: up to 3 each, short. summary: two warm sentences.`

function taskLine(t: Task) {
  return `- Task ${t.id} (${t.points} points, ${t.kind}): ${t.instruction}${t.trace ? ` [trace: ${t.trace}]` : ''}\n  Rubric: ${t.rubric.join(' | ')}${t.answer ? `\n  Correct answer: ${t.answer}` : ''}`
}

export async function mark(
  input: { workbook: Workbook; skill: Skill; learner: Learner; evidence: Evidence; scope: 'badge' | 'page'; taskIds?: string[]; ref?: string },
): Promise<CheckResult> {
  const all = [...input.workbook.chapters.flatMap((c) => c.tasks), input.workbook.finalTask]
  const tasks = input.scope === 'page' && input.taskIds?.length ? all.filter((t) => input.taskIds!.includes(t.id)) : all
  const l = input.learner
  const text = `SKILL: ${input.skill.name}. Work is handed in as: ${input.skill.proof}.
LEARNER: ${l.name}, age ${l.age}, language ${l.language}${l.readBy === 'parent' ? ', a parent reads the feedback' : ''}.

TASKS TO MARK
${tasks.map(taskLine).join('\n')}

EVIDENCE
${input.evidence.notes.join('\n\n') || '(no text evidence)'}
${input.evidence.images.length ? `\n${input.evidence.images.length} image(s) follow.` : ''}`

  const content: Part[] = [{ type: 'text', text }, ...input.evidence.images.map((url) => ({ type: 'image_url' as const, image_url: { url } }))]
  const { value } = await chatJson<Marking>(
    [
      { role: 'system', content: RULES },
      { role: 'user', content },
    ],
    { task: 'check-mark', ref: input.ref, effort: 'low', maxTokens: 24000, schema: MARKING_SCHEMA },
  )

  // Points come from the workbook, not from the model: clamp, and count only listed tasks.
  const byId = new Map(tasks.map((t) => [t.id, t]))
  // Partial credit by rubric: each criterion met earns its share of the task's points.
  const scoreOf = (m: TaskMark) => {
    const points = byId.get(m.id)!.points
    if (!m.found) return 0
    if (!m.criteria.length) return Math.max(0, Math.min(points, m.score))
    return Math.round((points * m.criteria.filter((c) => c.met).length) / m.criteria.length)
  }
  const marked = value.tasks.filter((m) => byId.has(m.id)).map((m) => ({ ...m, score: scoreOf(m) }))
  for (const t of tasks) if (!marked.some((m) => m.id === t.id)) marked.push({ id: t.id, found: false, criteria: [], score: 0, feedback: 'Not found in what was handed in.' })
  const max = tasks.reduce((n, t) => n + t.points, 0)
  const score = marked.reduce((n, m) => n + m.score, 0)
  const percent = max ? Math.round((score / max) * 100) : 0
  const final = marked.find((m) => m.id === 'final')
  const passed =
    input.scope === 'badge' &&
    value.readable &&
    value.integrity.ok &&
    percent >= 70 &&
    !!final?.found &&
    final.score >= input.workbook.finalTask.points / 2
  return { ...value, tasks: marked, score, max, percent, passed, scope: input.scope }
}
