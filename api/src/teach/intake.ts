import { chatJson, Message } from '../meta.js'
import { Skill } from '../catalog/skills.js'
import { Learner, Size } from '../workbook/write.js'

/**
 * The first conversation: the AI teacher gets to know the learner, a
 * question at a time, then hands over what the workbook writer needs.
 */
export interface IntakeTurn {
  reply: string
  done: boolean
  learner: Learner | null
  level: number
  size: Size
}

const SCHEMA = {
  name: 'IntakeTurn',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['reply', 'done', 'learner', 'level', 'size'],
    properties: {
      reply: { type: 'string' },
      done: { type: 'boolean' },
      learner: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'age', 'language', 'goal', 'startingPoint', 'minutesPerDay', 'interests', 'readBy'],
            properties: {
              name: { type: 'string' },
              age: { type: 'integer' },
              language: { type: 'string', enum: ['English', 'Hindi', 'Hinglish'] },
              goal: { type: 'string' },
              startingPoint: { type: 'string' },
              minutesPerDay: { type: 'integer' },
              interests: { type: 'array', items: { type: 'string' } },
              readBy: { type: 'string', enum: ['learner', 'parent'] },
            },
          },
        ],
      },
      level: { type: 'integer', enum: [1, 2, 3] },
      size: { type: 'string', enum: ['starter', 'standard', 'pro'] },
    },
  },
}

const rules = (skill: Skill) => `You are GrowthGoal's AI teacher meeting a new learner for "${skill.name}" (${skill.group}). Work is handed in as: ${skill.proof} (${skill.handIn}).

Find out, one short question at a time, in a warm and simple way:
1. Who is learning: their name and age. If it is a child under 10, you are talking to a parent; ask about the child.
2. Which language the workbook should be in: English, Hindi, or Hinglish (Hindi in Roman letters with English).
3. Their goal: what they want to be able to do.
4. Where they are now: what they can already do, and what goes wrong.
5. How many minutes a day they can give.
6. One or two things they love, so examples feel like theirs.

Rules: one question per reply, never a list of questions. Reply in the language the person is writing in. Keep each reply under 40 words. Never ask for a phone number, address, school name, email or photo. Do not teach yet.
When you know all six, set done=true, fill "learner", pick level (1 if new to it, 2 if they know the basics, 3 if confident), and size: "starter" for children under 9 or a first small step, "pro" for career or tech skills with big goals, otherwise "standard". In that last reply, say in one sentence what their workbook will help them do. Until then, learner=null, level=1, size="standard".`

export async function intakeTurn(skill: Skill, messages: Message[], ref?: string) {
  const { value } = await chatJson<IntakeTurn>([{ role: 'system', content: rules(skill) }, ...messages], {
    task: 'intake',
    ref,
    effort: 'minimal',
    maxTokens: 4000,
    schema: SCHEMA,
  })
  return value
}
