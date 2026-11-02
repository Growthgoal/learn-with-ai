import fs from 'node:fs'
import path from 'node:path'
import { OUTPUT } from '../src/env.js'
import { segment, transcribe } from '../src/meta.js'

const dir = path.join(OUTPUT, 'fixtures')
const img = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, 'kid-page.jpg')).toString('base64')
for (const prompt of ['handwritten letter', 'letter']) {
  const t = Date.now()
  const boxes = await segment(img, prompt, { task: 'test-sam' })
  console.log(prompt, '→', boxes.length, 'boxes in', (Date.now() - t) / 1000, 's', JSON.stringify(boxes.slice(0, 14)))
}
const wav = fs.readFileSync(path.join(dir, 'speak.wav'))
const seconds = (wav.length - 44) / (24000 * 2)
const t = Date.now()
console.log('transcript (', seconds.toFixed(1), 's audio, took', ')', await transcribe(wav, seconds, { task: 'test-voice', languages: ['English', 'Hindi'] }), (Date.now() - t) / 1000)
