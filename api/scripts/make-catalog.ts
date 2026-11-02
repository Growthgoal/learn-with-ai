// Fills the shop window: a picture for every skill (Muse Image) and a sample
// Basic, Advanced and Pro workbook for each, written for a typical learner.
// Skips anything already made, so it can be stopped and run again.
// usage: tsx scripts/make-catalog.ts [concurrency] [skill-id ...]
import fs from 'node:fs'
import { Age, LEVELS, Skill, SKILLS, sizeForLevel } from '../src/catalog/skills.js'
import { image } from '../src/meta.js'
import { catalog } from '../src/store.js'
import { Learner, Size, writeWorkbook } from '../src/workbook/write.js'
import { SITE, workbookPdf } from '../src/workbook/render.js'

const [conc = '4', ...only] = process.argv.slice(2)
const HINDI = /hindi|sanskrit|hanuman|naam-jaap|aartis/

/** The learner a sample is written for: typical of who takes the skill. */
function sampleLearner(skill: Skill): Learner {
  const has = (a: Age) => skill.ages.includes(a)
  const language: Learner['language'] = HINDI.test(skill.id) ? 'Hindi' : 'English'
  const base = { language, goal: `Get good at ${skill.name.toLowerCase()}`, startingPoint: 'New to it, eager to learn', interests: ['cricket', 'music', 'food'] }
  if (skill.ages.every((a) => a === 'kids-3-7')) return { ...base, name: 'Riya', age: 6, minutesPerDay: 10, readBy: 'parent' }
  if (skill.ages.every((a) => a === 'kids-3-7' || a === 'kids-8-12')) return { ...base, name: 'Kabir', age: 9, minutesPerDay: 15, readBy: 'learner' }
  if (skill.ages.every((a) => a === 'seniors')) return { ...base, name: 'Kamla ji', age: 63, minutesPerDay: 15, readBy: 'learner' }
  if (has('working')) return { ...base, name: 'Priya', age: 27, minutesPerDay: 25, readBy: 'learner' }
  if (has('college')) return { ...base, name: 'Rahul', age: 20, minutesPerDay: 25, readBy: 'learner' }
  if (has('teens')) return { ...base, name: 'Ananya', age: 15, minutesPerDay: 20, readBy: 'learner' }
  return { ...base, name: 'Kabir', age: 10, minutesPerDay: 15, readBy: 'learner' }
}

async function cover(skill: Skill) {
  const file = catalog.coverPath(skill.id)
  if (fs.existsSync(file)) return fs.readFileSync(file)
  const art = await image(
    `A warm, cheerful flat illustration for learning "${skill.name}" in India: the tools and objects of this skill arranged on a desk or table, with a sense of progress. Simple bold shapes, soft lime green and sunny yellow tones, cream background, plenty of space. No words, no letters, no numbers, no logos, no faces.`,
    { task: 'catalog-cover', ref: `catalog-${skill.id}`, size: '1024x1024' },
  )
  fs.writeFileSync(file, art)
  return art
}

async function sample(skill: Skill, level: number, art: Buffer | null) {
  const pdf = catalog.samplePath(skill.id, level)
  if (fs.existsSync(pdf)) return 'kept'
  const learner = sampleLearner(skill)
  const { workbook } = await writeWorkbook(skill, level, learner, sizeForLevel(level) as Size, { ref: `catalog-${skill.id}-${level}` })
  fs.writeFileSync(catalog.sampleJsonPath(skill.id, level), JSON.stringify({ learner, workbook }, null, 2))
  const out = await workbookPdf({
    workbook,
    skill,
    level,
    learner,
    code: `sample-${skill.id}-${level}`,
    cover: art ? 'data:image/jpeg;base64,' + art.toString('base64') : undefined,
    sample: { url: `${SITE}/skill/${skill.id}` },
  })
  fs.writeFileSync(pdf, out.pdf)
  return 'made'
}

const jobs: (() => Promise<void>)[] = []
for (const skill of SKILLS.filter((s) => !only.length || only.includes(s.id))) {
  jobs.push(async () => {
    let art: Buffer | null = null
    try {
      art = await cover(skill)
    } catch (e) {
      console.error('cover', skill.id, (e as Error).message)
    }
    for (const l of LEVELS) {
      try {
        const r = await sample(skill, l.n, art)
        console.log(r, skill.id, l.name)
      } catch (e) {
        console.error('sample', skill.id, l.name, (e as Error).message)
      }
    }
  })
}
let next = 0
await Promise.all(Array.from({ length: Number(conc) }, async () => { while (next < jobs.length) await jobs[next++]() }))
console.log('done')
