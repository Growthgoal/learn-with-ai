/**
 * Free guides: the basics of learning itself, for everyone, without AI at
 * the learner's end. Written once (by Muse Spark, then printed), given away
 * on growthgoal.in, and the first step into every other skill.
 */
export interface Guide {
  slug: string
  title: string
  titleHi: string
  /** What the guide must teach, for the writer. */
  covers: string
}

export const GUIDES: Guide[] = [
  { slug: 'how-to-memorize', title: 'How to Memorize', titleHi: 'याद कैसे करें', covers: 'active recall, spaced repetition with a simple schedule, linking new facts to known ones, memory pictures and stories, teaching it to someone, sleep and breaks' },
  { slug: 'how-to-learn-a-new-skill', title: 'How to Learn a New Skill', titleHi: 'नई स्किल कैसे सीखें', covers: 'breaking a skill into small parts, deliberate practice, getting feedback, learning from mistakes, the first 20 hours, measuring progress' },
  { slug: 'how-to-be-consistent', title: 'How to Be Consistent', titleHi: 'रोज़ लगातार कैसे करें', covers: 'tiny daily habits, a fixed time and place, habit tracker, never miss twice, making it easy to start, rewards, restarting without guilt' },
  { slug: 'how-to-find-your-goal', title: 'How to Find Your Goal', titleHi: 'अपना लक्ष्य कैसे खोजें', covers: 'noticing what you enjoy and are good at, trying small experiments, writing a clear goal, breaking it into steps, checking in every month' },
  { slug: 'how-to-write', title: 'How to Write Clearly', titleHi: 'साफ़ कैसे लिखें', covers: 'knowing your reader, one idea per paragraph, short sentences, plain words, a simple structure (point, reason, example), editing your own writing' },
  { slug: 'how-to-talk-professionally', title: 'How to Talk Professionally', titleHi: 'प्रोफ़ेशनल तरीके से कैसे बात करें', covers: 'greeting and introducing yourself, clear and polite requests, listening and asking questions, phone and video calls, messages and emails, handling disagreement calmly' },
  { slug: 'how-to-take-notes', title: 'How to Take Notes', titleHi: 'नोट्स कैसे बनाएँ', covers: 'writing in your own words, headings and bullet points, the Cornell method, mind maps, reviewing notes within 24 hours' },
  { slug: 'how-to-manage-your-time', title: 'How to Manage Your Time', titleHi: 'समय का सही इस्तेमाल कैसे करें', covers: 'seeing where time goes, a simple daily plan, doing the most important task first, the 25-minute focus block, reducing phone distraction, rest' },
  { slug: 'how-to-learn-with-ai', title: 'How to Learn with AI', titleHi: 'AI से कैसे सीखें', covers: 'asking AI to explain instead of answer, asking for examples and quizzes, checking AI answers, never copying homework, writing good questions (prompts), staying safe with personal information' },
]
