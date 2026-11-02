import { chatJson } from '../meta.js'
import { LEVELS, Skill } from '../catalog/skills.js'
import { Learner } from '../workbook/write.js'

/**
 * After the form, before writing: the AI reads everything once and asks only
 * what it still needs, at most a handful of questions in one go. One call,
 * not a conversation, so it costs a fraction of a rupee.
 */
export interface FollowUps {
  intro: string
  questions: string[]
}

const SCHEMA = {
  name: 'FollowUps',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['intro', 'questions'],
    properties: { intro: { type: 'string' }, questions: { type: 'array', items: { type: 'string' } } },
  },
}

export async function followUps(skill: Skill, level: number, l: Learner, ref?: string) {
  const answers = (l.answers ?? []).map((a) => `- ${a.question} ${a.answer}`).join('\n')
  const { value } = await chatJson<FollowUps>(
    [
      {
        role: 'system',
        content: `You are GrowthGoal's AI teacher, about to write a personal ${LEVELS[level - 1]?.name ?? 'Basic'} workbook for "${skill.name}". You have the learner's form below.
Ask only what you still need to make the workbook right for this person: up to 5 short questions, never more than 7, and none if the form already tells you enough. One thing per question, answerable in a sentence. Do not ask again what the form answers. Never ask for a phone number, address, school, email or photo.
"intro": one friendly sentence before the questions (or, if there are none, saying you have everything you need).
Write in ${l.language === 'Hindi' ? 'Hindi (Devanagari)' : l.language === 'Hinglish' ? 'Hinglish (Hindi in Roman letters with simple English)' : 'simple English'}.${l.readBy === 'parent' ? ' A parent is filling this in for a young child; address the parent.' : ''}`,
      },
      {
        role: 'user',
        content: `Name: ${l.name}, age ${l.age}. Workbook language: ${l.language}. Goal: ${l.goal}. Minutes a day: ${l.minutesPerDay}. Loves: ${l.interests.join(', ') || 'not given'}.
${answers}
${l.notes ? `Anything else: ${l.notes}` : ''}`,
      },
    ],
    { task: 'followups', ref, effort: 'minimal', maxTokens: 2500, schema: SCHEMA },
  )
  return { intro: value.intro, questions: value.questions.slice(0, 7) }
}
