// Renders the five "how it works" listing pictures from web/listing-src/listing.html.
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { ROOT } from '../src/env.js'

const src = path.join(ROOT, 'web', 'listing-src', 'listing.html')
const out = path.join(ROOT, 'web', 'public', 'listing')
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1080, height: 1080 })
await page.goto('file://' + src, { waitUntil: 'networkidle0' })
await page.evaluateHandle('document.fonts.ready')
for (const id of ['how-it-works', 'step-workbook', 'step-stuck', 'step-hand-in', 'step-badge']) {
  const el = await page.$('#' + id)
  await el!.screenshot({ path: path.join(out, `${id}.png`) as `${string}.png` })
  console.log('saved', id)
}
await browser.close()
