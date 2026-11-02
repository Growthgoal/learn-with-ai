// Checks stand-in work against a saved workbook and prints the result and its cost.
import fs from 'node:fs'
import path from 'node:path'
import { OUTPUT } from '../src/env.js'
import { skillById } from '../src/catalog/skills.js'
import { gather, Upload } from '../src/check/evidence.js'
import { mark } from '../src/check/mark.js'

const [code, skillId, learnerJson, taskIds, ...files] = process.argv.slice(2)
const workbook = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'samples', `${code}.json`), 'utf8'))
const learner = JSON.parse(learnerJson)
const skill = skillById(skillId)!
const ref = `check-${code}-${Date.now().toString(36)}`
const uploads: Upload[] = files.map((f) => ({ name: path.basename(f), mime: f.endsWith('.jpg') ? 'image/jpeg' : '', data: fs.readFileSync(f), taskId: /\.(xlsx|wav|m4a)$/.test(f) ? taskIds.split(',')[0] : undefined }))
const t = Date.now()
const evidence = await gather(uploads, { handwriting: skill.group === 'Handwriting and writing', ref, languages: ['English', 'Hindi'] })
const result = await mark({ workbook, skill, learner, evidence, scope: 'page', taskIds: taskIds.split(','), ref })
const cost = fs.readFileSync(path.join(OUTPUT, 'usage.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((u) => u.ref === ref).reduce((n, u) => n + u.costUsd, 0)
console.log(JSON.stringify({ seconds: (Date.now() - t) / 1000, costUsd: +cost.toFixed(4), costInr: +(cost * 88).toFixed(2), evidence: evidence.notes, result }, null, 2))
