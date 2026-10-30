/**
 * The shape of a workbook, shared by the writer (as a JSON schema the model
 * must follow) and by everything that renders or checks it.
 */

export type TaskKind = 'write' | 'trace' | 'draw' | 'solve' | 'speak' | 'make' | 'type' | 'file'
export type Space = 'lines' | 'box' | 'grid' | 'none'

export interface Task {
  /** "2.3": chapter 2, task 3. Printed on the page, so a photo can be matched to it. */
  id: string
  instruction: string
  kind: TaskKind
  /** For trace tasks: the exact letters or words to trace. */
  trace: string | null
  space: Space
  /** Lines to write on, or the box height in lines. */
  spaceSize: number
  hint: string
  /** Ready to paste into any AI assistant: explains, never answers. */
  stuckPrompt: string
  /** What the checker looks for, each one visible in the work handed in. */
  rubric: string[]
  /** The right answer where there is exactly one; never printed. */
  answer: string | null
  points: number
}

export interface Chapter {
  number: number
  title: string
  goal: string
  lesson: string[]
  example: { title: string; steps: string[] }
  tasks: Task[]
  checkpoint: string
}

export interface Workbook {
  title: string
  subtitle: string
  welcome: string
  howToUse: string[]
  plan: { day: number; chapter: number; minutes: number }[]
  chapters: Chapter[]
  finalTask: Task
  badge: { name: string; canDo: string[] }
}

const str = { type: 'string' }
const int = { type: 'integer' }
const strList = { type: 'array', items: str }

const task = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'instruction', 'kind', 'trace', 'space', 'spaceSize', 'hint', 'stuckPrompt', 'rubric', 'answer', 'points'],
  properties: {
    id: str,
    instruction: str,
    kind: { type: 'string', enum: ['write', 'trace', 'draw', 'solve', 'speak', 'make', 'type', 'file'] },
    trace: { type: ['string', 'null'] },
    space: { type: 'string', enum: ['lines', 'box', 'grid', 'none'] },
    spaceSize: int,
    hint: str,
    stuckPrompt: str,
    rubric: strList,
    answer: { type: ['string', 'null'] },
    points: int,
  },
}

export const WORKBOOK_SCHEMA = {
  name: 'Workbook',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'subtitle', 'welcome', 'howToUse', 'plan', 'chapters', 'finalTask', 'badge'],
    properties: {
      title: str,
      subtitle: str,
      welcome: str,
      howToUse: strList,
      plan: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['day', 'chapter', 'minutes'],
          properties: { day: int, chapter: int, minutes: int },
        },
      },
      chapters: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['number', 'title', 'goal', 'lesson', 'example', 'tasks', 'checkpoint'],
          properties: {
            number: int,
            title: str,
            goal: str,
            lesson: strList,
            example: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'steps'],
              properties: { title: str, steps: strList },
            },
            tasks: { type: 'array', items: task },
            checkpoint: str,
          },
        },
      },
      finalTask: task,
      badge: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'canDo'],
        properties: { name: str, canDo: strList },
      },
    },
  },
}
