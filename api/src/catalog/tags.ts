import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * What the shop needs to find and show a skill: an icon (a Fluent Emoji, MIT,
 * saved under web/public/icons) and the words people type when they look for
 * it, in English, Hinglish and Hindi. Made once by scripts/make-tags.ts.
 */
export interface Tags {
  icon: string
  keywords: string[]
}

/** Each shelf's icon; also the icon of a learner's own skill on that shelf. */
export const GROUP_ICONS: Record<string, string> = {
  'Tech and AI': 'robot',
  'Work and career': 'briefcase',
  'Business and freelancing': 'shopping-bags',
  Money: 'money-bag',
  English: 'speech-balloon',
  'Talking and people skills': 'speaking-head',
  Languages: 'globe-showing-asia-australia',
  'Content and creators': 'video-camera',
  'School subjects': 'books',
  Exams: 'graduation-cap',
  'Early learning': 'teddy-bear',
  Handwriting: 'pencil',
  Writing: 'memo',
  'Maths and thinking': 'abacus',
  'Games, puzzles and quizzes': 'puzzle-piece',
  'Art and creativity': 'artist-palette',
  'Music, dance and acting': 'musical-notes',
  'Sports and fitness': 'cricket-game',
  'Health and wellbeing': 'person-in-lotus-position',
  'Life skills': 'house-with-garden',
  'Parenting and family': 'baby-bottle',
  Travel: 'airplane',
  'Law, rights and civics': 'balance-scale',
  'Leadership and public life': 'classical-building',
  'For teachers, trainers and coaches': 'teacher',
  'Culture and spirituality': 'diya-lamp',
}
export const DEFAULT_ICON = 'sparkles'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tags.json')
let tags: Record<string, Tags> | null = null
export function tagsFor(id: string, group?: string): Tags {
  if (!tags) tags = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
  return tags![id] ?? { icon: (group && GROUP_ICONS[group]) || DEFAULT_ICON, keywords: [] }
}
