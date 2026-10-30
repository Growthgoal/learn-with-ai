// Writes one real workbook end to end and reports what it cost.
// usage: tsx scripts/try-workbook.ts <sample> [size] [effort]
import fs from 'node:fs'
import path from 'node:path'
import { OUTPUT } from '../src/env.js'
import { skillById } from '../src/catalog/skills.js'
import { Learner, Size, writeWorkbook } from '../src/workbook/write.js'
import { workbookPdf } from '../src/workbook/render.js'
import type { Effort } from '../src/meta.js'

const SAMPLES: Record<string, { skill: string; level: number; learner: Learner }> = {
  'kid-handwriting': {
    skill: 'english-handwriting-print',
    level: 1,
    learner: { name: 'Aarav', age: 6, language: 'English', goal: 'Write capital and small letters neatly on the line', startingPoint: 'Knows all letters, but letters float above the line and b/d get mixed up', minutesPerDay: 10, interests: ['cricket', 'dinosaurs'], readBy: 'parent' },
  },
  'hindi-sulekh': {
    skill: 'hindi-sulekh-varnamala-matra-barakhadi',
    level: 1,
    learner: { name: 'Myra', age: 7, language: 'Hindi', goal: 'स्वर और व्यंजन साफ़ और सही आकार में लिखना', startingPoint: 'Reads most letters, writing is uneven and shirorekha is often missing', minutesPerDay: 10, interests: ['drawing', 'cats'], readBy: 'parent' },
  },
  'adult-excel': {
    skill: 'excel',
    level: 1,
    learner: { name: 'Neha', age: 27, language: 'English', goal: 'Handle the daily sales sheet at my shop job without asking anyone', startingPoint: 'Can type into cells, never used a formula', minutesPerDay: 30, interests: ['her family clothing shop', 'cricket'], readBy: 'learner' },
  },
  'spoken-english': {
    skill: 'spoken-english',
    level: 1,
    learner: { name: 'Rohit', age: 19, language: 'Hinglish', goal: 'Speak in English without fear in college and interviews', startingPoint: 'Understands English, freezes when speaking, thinks in Hindi first', minutesPerDay: 20, interests: ['bikes', 'YouTube'], readBy: 'learner' },
  },
  'senior-upi': {
    skill: 'smartphone-and-upi-safety',
    level: 1,
    learner: { name: 'Kamla ji', age: 64, language: 'Hindi', goal: 'UPI से पैसे भेजना और धोखाधड़ी वाले कॉल और मैसेज पहचानना', startingPoint: 'Uses WhatsApp, has never made a UPI payment, afraid of being cheated', minutesPerDay: 15, interests: ['bhajans', 'grandchildren'], readBy: 'learner' },
  },
}

const [sampleName = 'kid-handwriting', size = 'starter', effort = 'low'] = process.argv.slice(2)
const sample = SAMPLES[sampleName]
const skill = skillById(sample.skill)!
const code = `${sampleName}-${Date.now().toString(36)}`
const started = Date.now()
const { workbook, usage } = await writeWorkbook(skill, sample.level, sample.learner, size as Size, { effort: effort as Effort, ref: code })
const wrote = (Date.now() - started) / 1000
const dir = path.join(OUTPUT, 'samples')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, `${code}.json`), JSON.stringify(workbook, null, 2))
const { pdf, html } = await workbookPdf({ workbook, skill, level: sample.level, learner: sample.learner, code })
fs.writeFileSync(path.join(dir, `${code}.pdf`), pdf)
fs.writeFileSync(path.join(dir, `${code}.html`), html)
const tasks = workbook.chapters.reduce((n, c) => n + c.tasks.length, 0) + 1
console.log(JSON.stringify({ code, size, effort, seconds: wrote, chapters: workbook.chapters.length, tasks, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, reasoningTokens: usage.reasoningTokens, costUsd: +usage.costUsd.toFixed(4), costInr: +(usage.costUsd * 88).toFixed(2), pdf: path.join(dir, `${code}.pdf`) }))
