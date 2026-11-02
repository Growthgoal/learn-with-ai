// Screenshot a page in headless Chrome (a dev tool, not part of the app).
// usage: node tools/shot.mjs <url> <width> <height> <out.png> [click-selector | text:<h2 text to scroll to>] [full]
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const [url, width, height, out, action, full] = process.argv.slice(2)
const port = 9300 + Math.floor(Math.random() * 500)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page') } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pending = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: 1.5, mobile: +width < 768 })
await send('Page.enable'); await send('Page.navigate', { url }); await sleep(6000)
if (action && action.startsWith('text:')) { await send('Runtime.evaluate', { expression: `(() => { const h=[...document.querySelectorAll('h1,h2')].find(e=>e.textContent.includes(${JSON.stringify(action.slice(5))})); if (h) window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 90) })()` }); await sleep(2500) }
else if (action) { await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(action)})?.click()` }); await sleep(1000) }
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full })
fs.writeFileSync(out, Buffer.from(shot.data, 'base64')); console.log('saved', out)
ws.close(); chrome.kill(); await sleep(300); fs.rmSync(dir, { recursive: true, force: true })
