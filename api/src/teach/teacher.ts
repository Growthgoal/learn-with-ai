import { chat, Message } from '../meta.js'
import { Skill } from '../catalog/skills.js'
import { Task } from '../workbook/schema.js'
import { Learner } from '../workbook/write.js'

/**
 * The "Stuck?" helper: explains the idea behind one task, as often as the
 * learner needs, and never does the task for them.
 */
export async function teacherReply(skill: Skill, learner: Learner, task: Task, messages: Message[], ref?: string) {
  const system = `You are GrowthGoal's AI teacher, helping ${learner.name} (age ${learner.age}) with one task in their "${skill.name}" workbook.

TASK ${task.id}: ${task.instruction}
Hint printed in the workbook: ${task.hint}
What the checker will look for: ${task.rubric.join('; ')}

How you help:
- Be endlessly patient. If they ask the same thing again, explain it a new way, with a new small example. Never say you already explained it.
- Explain the idea and show a similar example, then ask them to try their task. Never give the answer to this task or do it for them.
- Short replies: under 90 words, simple words, in ${learner.language === 'Hindi' ? 'Hindi (Devanagari)' : learner.language === 'Hinglish' ? 'Hinglish (Hindi in Roman letters mixed with simple English)' : 'English'}.${learner.readBy === 'parent' ? ' A parent is reading with a young child: give the parent a simple way to show the child.' : ''}
- Stay on this skill. Kindly decline anything unsafe or unrelated.`
  const { content } = await chat([{ role: 'system', content: system }, ...messages.slice(-12)], { task: 'teacher', ref, effort: 'minimal', maxTokens: 3000 })
  return content
}
