// Re-renders a saved workbook's PDF without calling the AI again.
// usage: tsx scripts/rerender.ts <code> <sample>
import fs from 'node:fs'
import path from 'node:path'
import { OUTPUT } from '../src/env.js'
import { skillById } from '../src/catalog/skills.js'
import { workbookPdf } from '../src/workbook/render.js'

const [code, skillId, learnerJson] = process.argv.slice(2)
const dir = path.join(OUTPUT, 'samples')
const workbook = JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf8'))
const learner = JSON.parse(learnerJson)
const { pdf } = await workbookPdf({ workbook, skill: skillById(skillId)!, level: 1, learner, code })
fs.writeFileSync(path.join(dir, `${code}.pdf`), pdf)
console.log('rendered', code)
