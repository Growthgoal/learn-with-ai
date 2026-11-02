import fs from 'node:fs'
import QRCode from 'qrcode'
import puppeteer from 'puppeteer-core'
import { Skill } from '../catalog/skills.js'
import { Task, Workbook } from './schema.js'
import { Learner } from './write.js'

/** Where a printed workbook sends its learner: the online copy, prompts and submission. */
export const SITE = process.env.SITE_URL?.replace(/\/$/, '') || 'https://learn.growthgoal.in'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** The workbook's own words, in the learner's language. */
const WORDS = {
  en: {
    howTo: 'How to use this workbook', plan: (m: number) => `Your plan · about ${m} minutes in all`, day: 'Day', what: 'What', minutes: 'Minutes',
    chapter: 'Chapter', final: 'Final task', together: 'Put it all together', example: 'Worked example', hint: 'Hint',
    stuck: (id: string) => `Stuck? Open task ${id} online and copy the ready prompt into ChatGPT, Gemini, Claude or our AI teacher.`,
    check: 'Check yourself', madeFor: 'Made for', online: 'Your workbook online, prompts for every task, and where to hand it in:',
    hello: 'Hello', earn: 'Earn your badge', handIn: 'When you have done every task, hand in your work at', canDo: 'Once it passes, your profile shows that you can:',
    fixUp: 'Not there yet? You get a short fix-up workbook for just the parts that need more practice, at no extra cost.',
  },
  hi: {
    howTo: 'इस कॉपी को कैसे इस्तेमाल करें', plan: (m: number) => `आपकी योजना · कुल लगभग ${m} मिनट`, day: 'दिन', what: 'क्या', minutes: 'मिनट',
    chapter: 'अध्याय', final: 'आख़िरी काम', together: 'सब कुछ एक साथ', example: 'हल किया हुआ उदाहरण', hint: 'संकेत',
    stuck: (id: string) => `अटक गए? काम ${id} ऑनलाइन खोलें और तैयार सवाल ChatGPT, Gemini, Claude या हमारे AI टीचर से पूछें।`,
    check: 'ख़ुद जाँचें', madeFor: 'किसके लिए', online: 'आपकी कॉपी ऑनलाइन, हर काम के लिए सवाल, और काम जमा करने की जगह:',
    hello: 'नमस्ते', earn: 'अपना बैज पाएँ', handIn: 'सारे काम पूरे होने पर अपना काम यहाँ जमा करें:', canDo: 'पास होने पर आपकी प्रोफ़ाइल में दिखेगा कि आप:',
    fixUp: 'अभी पूरा नहीं हुआ? जिन हिस्सों में और अभ्यास चाहिए, उनके लिए एक छोटी कॉपी मुफ़्त मिलेगी।',
  },
}
const words = (l: Learner) => (l.language === 'Hindi' ? WORDS.hi : WORDS.en)

/** Small children write bigger, and older eyes read better big: wider lines, larger type. */
const young = (l: Learner) => l.age < 8 || l.age >= 60

function lines(n: number, l: Learner) {
  return `<div class="lines" style="--n:${Math.max(1, n)}"></div>`
}

/**
 * Letters to trace, drawn as the font's own outline in a dotted stroke, so
 * the dots sit on the true letter shape (the same idea as GrowthGoal's
 * printed handwriting books). SVG text, so Hindi is shaped correctly.
 */
function trace(text: string, l: Learner) {
  const hindi = /[ऀ-ॿ]/.test(text)
  const h = young(l) ? 30 : 22
  const size = young(l) ? 20 : 15
  const row = (opacity: number) => `<svg class="trace" viewBox="0 0 180 ${h}" preserveAspectRatio="xMinYMid meet">
      <line x1="0" x2="180" y1="${h * 0.22}" y2="${h * 0.22}" class="rule soft"/>
      <line x1="0" x2="180" y1="${h * 0.5}" y2="${h * 0.5}" class="rule mid"/>
      <line x1="0" x2="180" y1="${h * 0.78}" y2="${h * 0.78}" class="rule base"/>
      <text x="2" y="${h * 0.78}" font-size="${size}" class="${hindi ? 'deva' : 'latin'}" style="opacity:${opacity}">${esc(text)}</text>
    </svg>`
  return row(1) + row(0.45)
}

function space(t: Task, l: Learner) {
  const n = t.spaceSize || 0
  if (t.kind === 'trace' && t.trace) return trace(t.trace, l) + (n ? lines(Math.min(n, 4), l) : '')
  if (t.space === 'lines') return lines(n, l)
  if (t.space === 'box') return `<div class="box" style="--n:${Math.max(2, n)}"></div>`
  if (t.space === 'grid') return `<div class="grid" style="--n:${Math.max(3, n)}"></div>`
  return ''
}

const HANDED_IN: Record<Skill['proof'], string> = {
  pages: 'Photograph each finished page in good light, flat, with the whole page in view.',
  file: 'Save the file as the task says; you will upload it.',
  result: 'Photograph what you made in daylight, from the front, filling the frame.',
  typed: 'Type your answers in the online copy of this workbook.',
  voice: 'Record yourself in a quiet room, phone about a hand-span away.',
}

function taskBlock(t: Task, l: Learner) {
  const w = words(l)
  return `<div class="task">
    <div class="thead"><span class="tid">${esc(t.id === 'final' ? w.final : t.id)}</span><p class="instr">${esc(t.instruction)}</p></div>
    ${space(t, l)}
    <p class="hint"><b>${w.hint}:</b> ${esc(t.hint)}</p>
    <p class="stuck">${esc(w.stuck(t.id))}</p>
  </div>`
}

export interface RenderInput {
  workbook: Workbook
  skill: Skill
  level: number
  learner: Learner
  /** The workbook's short code, in its online address. */
  code: string
  /** The cover picture Muse Image drew for this learner, as a data URL. */
  cover?: string
}

export async function workbookHtml({ workbook: w, skill, level, learner: l, code, cover }: RenderInput) {
  const url = `${SITE}/w/${code}`
  const qr = await QRCode.toDataURL(url, { margin: 0, width: 240, color: { dark: '#233306', light: '#ffffff' } })
  const totalMin = w.plan.reduce((n, d) => n + d.minutes, 0)
  const t = words(l)
  // A day whose chapter number is not a real chapter is the final task's day.
  const dayWhat = (n: number) => {
    const c = w.chapters.find((x) => x.number === n)
    return c ? `${t.chapter} ${c.number}: ${esc(c.title)}` : t.final
  }
  return `<!doctype html><html lang="${l.language === 'Hindi' ? 'hi' : 'en'}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Quicksand:wght@500;600;700&family=Mukta:wght@400;600&family=Andika&display=swap">
<style>
  @page { size: A4; margin: 14mm 14mm 18mm; }
  :root { --ink:#233306; --soft:#5E6B45; --line:#C9D3B0; --lime:#4D7C0F; --limebg:#F1F8DF; --sun:#FACC15; --sunbg:#FEF7D1; --row:${young(l) ? '11mm' : '8.5mm'}; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Quicksand, Mukta, sans-serif; font-size: ${young(l) ? '13pt' : '10.5pt'}; color: var(--ink); line-height: 1.5; }
  h1,h2,h3 { font-family: "Baloo 2", Mukta, sans-serif; line-height: 1.1; margin: 0; }
  .cover { height: 250mm; display:flex; flex-direction:column; justify-content:space-between; page-break-after: always; }
  .cover .brand { font-family:"Baloo 2"; font-weight:800; font-size:16pt; color: var(--lime); }
  .cover h1 { font-size: 34pt; font-weight:800; }
  .cover .sub { font-size: 14pt; color: var(--soft); margin-top: 6mm; }
  .cover .who { border-top: 3px solid var(--sun); padding-top: 6mm; display:grid; grid-template-columns: 1fr auto; gap: 8mm; align-items:end; }
  .cover .who b { font-family:"Baloo 2"; font-size: 18pt; }
  .cover .who img { width: 32mm; height: 32mm; }
  .cover .art { display:block; width: 100%; max-height: 105mm; object-fit: cover; border-radius: 5mm; margin-top: 8mm; }
  .pill { display:inline-block; background: var(--limebg); color: var(--lime); border-radius: 99px; padding: 1mm 4mm; font-weight:700; font-size: 10pt; margin-right: 2mm; }
  .intro { page-break-after: always; }
  .intro h2, .chapter h2 { font-size: 20pt; margin-bottom: 4mm; }
  ul { padding-left: 5mm; margin: 2mm 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 3mm; font-size: 10pt; }
  td, th { border-bottom: 1px solid var(--line); padding: 1.5mm 2mm; text-align:left; }
  .chapter { page-break-before: always; }
  .goal { background: var(--sunbg); border-radius: 3mm; padding: 3mm 4mm; margin: 2mm 0 4mm; font-weight:600; }
  .lesson p { margin: 0 0 2.5mm; }
  .example { border: 1.5px solid var(--lime); border-radius: 3mm; padding: 3mm 4mm; margin: 4mm 0 6mm; page-break-inside: avoid; }
  .example h3 { font-size: 12pt; color: var(--lime); margin-bottom: 2mm; }
  .example ol { margin: 0; padding-left: 5mm; }
  .task { page-break-inside: avoid; margin: 0 0 7mm; }
  .thead { display:flex; gap: 3mm; align-items: flex-start; }
  .tid { flex-shrink:0; font-family:"Baloo 2"; font-weight:800; background: var(--sun); border-radius: 2mm; padding: 0 2.5mm; font-size: 11pt; }
  .instr { margin: 0; font-weight: 600; }
  .hint { margin: 2mm 0 0; font-size: 9pt; color: var(--soft); }
  .stuck { margin: 0.5mm 0 0; font-size: 8.5pt; color: var(--soft); }
  .lines { height: calc(var(--row) * var(--n)); background: repeating-linear-gradient(transparent 0 calc(var(--row) - 1px), var(--line) calc(var(--row) - 1px) var(--row)); margin-top: 2mm; }
  .box { height: calc(var(--row) * var(--n)); border: 1.5px solid var(--line); border-radius: 2mm; margin-top: 2mm; }
  .grid { height: calc(5mm * var(--n) * 2); border: 1.5px solid var(--line); margin-top: 2mm; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 5mm 5mm; }
  .trace { width: 100%; height: auto; display:block; margin-top: 2mm; }
  .trace .rule { stroke: var(--line); stroke-width: .35; }
  .trace .mid { stroke-dasharray: 1.2 1.2; }
  .trace .base { stroke: #9AA77F; stroke-width: .5; }
  .trace text { fill: none; stroke: #6B7A4E; stroke-width: .35; stroke-dasharray: .55 .65; stroke-linecap: round; }
  .trace .latin { font-family: Andika, Quicksand, sans-serif; }
  .trace .deva { font-family: Mukta, sans-serif; font-weight: 600; }
  .check { margin-top: 2mm; font-size: 10pt; border-left: 3px solid var(--sun); padding-left: 3mm; }
  .end { page-break-before: always; }
  .badge { border: 2px dashed var(--lime); border-radius: 4mm; padding: 6mm; margin-top: 6mm; }
</style></head><body>

<section class="cover">
  <div class="brand">GrowthGoal · Learn with AI</div>
  <div>
    <span class="pill">${esc(skill.name)}</span><span class="pill">Level ${level}</span>
    <h1 style="margin-top:6mm">${esc(w.title)}</h1>
    <p class="sub">${esc(w.subtitle)}</p>
    ${cover ? `<img class="art" src="${cover}" alt="">` : ''}
  </div>
  <div class="who">
    <div><p style="margin:0">${t.madeFor}</p><b>${esc(l.name)}</b><p style="margin:2mm 0 0;font-size:10pt">${t.online}<br><b>${esc(url.replace(/^https?:\/\//, ''))}</b></p></div>
    <img src="${qr}" alt="">
  </div>
</section>

<section class="intro">
  <h2>${t.hello} ${esc(l.name)}</h2>
  <p>${esc(w.welcome)}</p>
  <h3 style="margin-top:5mm">${t.howTo}</h3>
  <ul>${w.howToUse.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <h3 style="margin-top:5mm">${t.plan(totalMin)}</h3>
  <table><tr><th>${t.day}</th><th>${t.what}</th><th>${t.minutes}</th></tr>
  ${w.plan.map((d) => `<tr><td>${d.day}</td><td>${dayWhat(d.chapter)}</td><td>${d.minutes}</td></tr>`).join('')}
  </table>
</section>

${w.chapters
  .map(
    (c) => `<section class="chapter">
  <p class="pill">${t.chapter} ${c.number}</p>
  <h2 style="margin-top:2mm">${esc(c.title)}</h2>
  <div class="goal">${esc(c.goal)}</div>
  <div class="lesson">${c.lesson.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="example"><h3>${t.example}: ${esc(c.example.title)}</h3><ol>${c.example.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
  ${c.tasks.map((t) => taskBlock(t, l)).join('')}
  <p class="check"><b>${t.check}:</b> ${esc(c.checkpoint)}</p>
</section>`,
  )
  .join('')}

<section class="end">
  <p class="pill">${t.final}</p>
  <h2 style="margin:2mm 0 4mm">${t.together}</h2>
  ${taskBlock(w.finalTask, l)}
  <div class="badge">
    <h3>${t.earn}: ${esc(w.badge.name)}</h3>
    <p>${t.handIn} <b>${esc(url.replace(/^https?:\/\//, ''))}</b>. ${esc(HANDED_IN[skill.proof])}</p>
    <p style="margin-bottom:1mm">${t.canDo}</p>
    <ul>${w.badge.canDo.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <p style="font-size:9pt;color:var(--soft)">${t.fixUp}</p>
  </div>
</section>
</body></html>`
}

/** Chrome on this Mac, or the server's Chromium. */
function chromePath() {
  const candidates = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean) as string[]
  const found = candidates.find((p) => fs.existsSync(p))
  if (!found) throw new Error('No Chrome found. Set CHROME_PATH.')
  return found
}

export async function workbookPdf(input: RenderInput) {
  const html = await workbookHtml(input)
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
    await page.evaluateHandle('document.fonts.ready')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-size:8px;color:#5E6B45;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>${esc(input.learner.name)} · ${esc(input.skill.name)} · Level ${input.level} · ${esc(input.code)}</span><span>growthgoal.in · page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      margin: { top: '14mm', bottom: '18mm', left: '14mm', right: '14mm' },
    })
    return { html, pdf: Buffer.from(pdf) }
  } finally {
    await browser.close()
  }
}
