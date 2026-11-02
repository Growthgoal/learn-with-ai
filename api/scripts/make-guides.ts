// Writes and prints the free guides, English and Hindi, with one cover each.
// Skips anything already made. usage: tsx scripts/make-guides.ts [concurrency]
import fs from 'node:fs'
import { GUIDES } from '../src/catalog/guides.js'
import { Skill } from '../src/catalog/skills.js'
import { image } from '../src/meta.js'
import { catalog } from '../src/store.js'
import { Learner, writeWorkbook } from '../src/workbook/write.js'
import { SITE, workbookPdf } from '../src/workbook/render.js'

const jobs: (() => Promise<void>)[] = []
for (const g of GUIDES) {
  jobs.push(async () => {
    let art: Buffer | null = null
    try {
      const file = catalog.guideCoverPath(g.slug)
      art = fs.existsSync(file)
        ? fs.readFileSync(file)
        : await image(`A warm, cheerful flat illustration for a free guide called "${g.title}": a symbolic scene about ${g.covers.split(',')[0]}, for learners of every age in India. Simple bold shapes, soft lime green and sunny yellow tones, cream background. No words, no letters, no numbers, no logos, no faces.`, { task: 'guide-cover', ref: `guide-${g.slug}`, size: '1024x1024' })
      fs.writeFileSync(file, art)
    } catch (e) {
      console.error('cover', g.slug, (e as Error).message)
    }
    for (const lang of ['en', 'hi'] as const) {
      const pdf = catalog.guidePath(g.slug, lang)
      if (fs.existsSync(pdf)) { console.log('kept', g.slug, lang); continue }
      // A guide is a workbook too, so it is written by the same engine, for everyone.
      const skill: Skill = { id: g.slug, group: 'Free guides', name: lang === 'hi' ? g.titleHi : g.title, ages: ['teens', 'college', 'working', 'seniors'], proof: 'pages', handIn: 'Nothing; this guide is yours to keep', weSell: false, band: 'life', writing: false }
      const learner: Learner = {
        name: lang === 'hi' ? 'आप' : 'You',
        age: 16,
        language: lang === 'hi' ? 'Hindi' : 'English',
        goal: `Learn the basics of: ${g.covers}`,
        startingPoint: 'Anyone, from a school student to a grandparent. Keep every example everyday and Indian.',
        minutesPerDay: 15,
        interests: ['everyday life in India'],
        readBy: 'learner',
      }
      try {
        const { workbook } = await writeWorkbook(skill, 1, learner, 'starter', { ref: `guide-${g.slug}-${lang}` })
        fs.writeFileSync(pdf.replace(/\.pdf$/, '.json'), JSON.stringify({ learner, workbook }, null, 2))
        const out = await workbookPdf({
          workbook, skill, level: 1, learner, code: `free-${g.slug}`,
          cover: art ? 'data:image/jpeg;base64,' + art.toString('base64') : undefined,
          sample: { url: `${SITE}/`, label: lang === 'hi' ? 'मुफ़्त गाइड' : 'Free guide' },
          free: true,
        })
        fs.writeFileSync(pdf, out.pdf)
        console.log('made', g.slug, lang)
      } catch (e) {
        console.error('guide', g.slug, lang, (e as Error).message)
      }
    }
  })
}
const conc = Number(process.argv[2] ?? 3)
let next = 0
await Promise.all(Array.from({ length: conc }, async () => { while (next < jobs.length) await jobs[next++]() }))
console.log('done')
