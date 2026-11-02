// Makes stand-in "finished work" to test the checker before real learners
// send theirs: a handwritten-looking page photo, a spoken answer, an Excel file.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'
import ExcelJS from 'exceljs'
import { OUTPUT } from '../src/env.js'

const dir = path.join(OUTPUT, 'fixtures')
fs.mkdirSync(dir, { recursive: true })

// 1. A page of a child's print letters on ruled lines, some floating above
//    the line and one reversed b/d, photographed slightly crooked.
const html = `<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"><style>
body{margin:0;background:#e9e4d8;font-family:'Patrick Hand',cursive}
.page{width:760px;padding:40px 50px;background:#fdfcf7;margin:30px;transform:rotate(-1.2deg);box-shadow:0 6px 18px rgba(0,0,0,.25)}
.tid{display:inline-block;background:#FACC15;padding:0 8px;border-radius:4px;font-family:sans-serif;font-weight:700;margin-right:8px}
.row{position:relative;height:70px;border-bottom:2px solid #9aa77f;margin:14px 0 26px}
.row span{position:absolute;bottom:0;font-size:58px;color:#2a3a55}
</style></head><body><div class="page">
<p style="font-family:sans-serif"><span class="tid">1.1</span>Trace the big letters A B C sitting on the line.</p>
<div class="row"><span style="left:10px">A</span><span style="left:70px;bottom:14px">B</span><span style="left:130px">C</span><span style="left:200px">A</span><span style="left:262px;bottom:9px">B</span><span style="left:322px">C</span></div>
<p style="font-family:sans-serif"><span class="tid">3.1</span>Trace b b d d sitting on the line.</p>
<div class="row"><span style="left:10px">b</span><span style="left:60px">b</span><span style="left:110px">b</span><span style="left:160px">d</span><span style="left:210px;bottom:-6px">d</span></div>
</div></body></html>`
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 520 })
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.screenshot({ path: path.join(dir, 'kid-page.jpg'), type: 'jpeg', quality: 85 })
await browser.close()

// 2. A spoken answer, as a phone would record it.
const aiff = path.join(dir, 'speak.aiff')
execFileSync('say', ['-v', 'Rishi', '-o', aiff, 'Hello, my name is Rohit. Um, I am studying B.Com in Jaipur. In my free time I, I like riding bikes and making YouTube videos about bikes. My goal is to speak English confidently in my college and in interviews.'])
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', path.join(dir, 'speak.wav')])
fs.rmSync(aiff)

// 3. Neha's task 2.1: Total = Price x Qty with a formula, one row typed by hand.
const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('Sheet1')
ws.addRow(['Item', 'Price Rs', 'Qty', 'Total Rs'])
ws.addRow(['Kurta', 799, 2, { formula: 'B2*C2', result: 1598 }])
ws.addRow(['Saree', 1299, 1, { formula: 'B3*C3', result: 1299 }])
ws.addRow(['T-shirt', 499, 4, 1996])
await wb.xlsx.writeFile(path.join(dir, 'neha_2_1_total.xlsx'))
console.log('fixtures in', dir, fs.readdirSync(dir))
