// Picks each skill's icon and the words people search for it with, once,
// so the shop's search understands "angrezi bolna" or "kanoon" for free.
// Icons come from Microsoft's Fluent Emoji (MIT), via the npm package
// @iconify-json/fluent-emoji-flat; pass the path to its icons.json.
// usage: tsx scripts/make-tags.ts <icons.json> [concurrency]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatJson } from '../src/meta.js'
import { SKILLS } from '../src/catalog/skills.js'
import { GROUP_ICONS, Tags } from '../src/catalog/tags.js'

const [source, conc = '4'] = process.argv.slice(2)
if (!source) throw new Error('Pass the path to @iconify-json/fluent-emoji-flat/icons.json')
const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/catalog/tags.json')
const done: Record<string, Tags> = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
// Skin-tone copies of the same picture only make the list longer.
const icons = Object.keys(JSON.parse(fs.readFileSync(source, 'utf8')).icons).filter(
  (n) => !/-(light|medium-light|medium|medium-dark|dark)$/.test(n),
)
const known = new Set(icons)

const SCHEMA = {
  name: 'SkillTags',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['skills'],
    properties: {
      skills: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'icon', 'keywords'],
          properties: { id: { type: 'string' }, icon: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } } },
        },
      },
    },
  },
}

const todo = SKILLS.filter((s) => !done[s.id])
const batches: (typeof todo)[] = []
for (let i = 0; i < todo.length; i += 25) batches.push(todo.slice(i, i + 25))
let next = 0
async function worker() {
  while (next < batches.length) {
    const batch = batches[next++]
    const { value } = await chatJson<{ skills: ({ id: string } & Tags)[] }>(
      [
        {
          role: 'system',
          content: `For each skill on an Indian learning site, give:
- "icon": the one emoji from the list below that best shows the skill at a glance, written exactly as listed. Prefer an object or activity over a face.
- "keywords": 8 to 14 words or short phrases people in India type when looking for this skill: English synonyms and tools, common misspellings, Hinglish in Roman letters (e.g. "angrezi bolna", "paise bachana"), and 2 or 3 Hindi words in Devanagari. Lowercase. Do not repeat the skill's own name.

Emoji list: ${icons.join(' ')}`,
        },
        { role: 'user', content: batch.map((s) => `${s.id}: ${s.name} (${s.group})`).join('\n') },
      ],
      { task: 'make-tags', ref: 'tags', effort: 'minimal', maxTokens: 8000, schema: SCHEMA },
    )
    for (const s of batch) {
      const t = value.skills.find((x) => x.id === s.id)
      if (!t) continue
      done[s.id] = { icon: known.has(t.icon) ? t.icon : GROUP_ICONS[s.group], keywords: t.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean).slice(0, 16) }
    }
    fs.writeFileSync(FILE, JSON.stringify(done, null, 1))
    console.log('tags', Object.keys(done).length, '/', SKILLS.length)
  }
}
await Promise.all(Array.from({ length: Number(conc) }, worker))
console.log('done', Object.keys(done).length)
