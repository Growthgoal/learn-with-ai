import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { segment, transcribe } from '../meta.js'
import { describe, measure } from './handwriting.js'

/** One thing a learner hands in, as uploaded. */
export interface Upload {
  /** The task it answers, when the learner said; photos of pages usually cover several. */
  taskId?: string
  name: string
  mime: string
  data: Buffer
}

/** Everything the marking model is shown: pictures, and text it can read. */
export interface Evidence {
  images: string[]
  notes: string[]
}

const isImage = (u: Upload) => /^image\//.test(u.mime) || /\.(jpe?g|png|webp|heic)$/i.test(u.name)
const isAudio = (u: Upload) => /^audio\//.test(u.mime) || /\.(wav|m4a|mp3|aac|ogg|webm|opus|aiff?)$/i.test(u.name)
const isSheet = (u: Upload) => /\.(xlsx|xlsm)$/i.test(u.name)
const isText = (u: Upload) => /^text\//.test(u.mime) || /\.(csv|txt|md|py|js|ts|html|css|sql|json)$/i.test(u.name)

/** Phone photos are big; the model needs about 1600px on the long side to read handwriting. */
function shrink(u: Upload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwa-'))
  const src = path.join(dir, 'in' + (path.extname(u.name) || '.jpg'))
  const out = path.join(dir, 'out.jpg')
  fs.writeFileSync(src, u.data)
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', "scale='if(gt(iw,ih),min(1600,iw),-2)':'if(gt(iw,ih),-2,min(1600,ih))'", '-q:v', '4', out])
    return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64')
  } catch {
    return `data:${u.mime || 'image/jpeg'};base64,` + u.data.toString('base64')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/** Any phone recording to the 24 kHz mono WAV Muse Voice Transcribe takes. */
function toWav(u: Upload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lwa-'))
  const src = path.join(dir, 'in' + (path.extname(u.name) || '.m4a'))
  const out = path.join(dir, 'out.wav')
  fs.writeFileSync(src, u.data)
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-t', '600', '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', '-map_metadata', '-1', out])
    const wav = fs.readFileSync(out)
    return { wav, seconds: (wav.length - 44) / 48000 }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

const FILLERS = /\b(um+|uh+|hmm+|like|you know|matlab|basically|actually)\b/gi

async function sheetText(u: Upload) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(u.data as unknown as ArrayBuffer)
  const lines: string[] = []
  wb.eachSheet((ws) => {
    lines.push(`Sheet "${ws.name}":`)
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        const v = cell.value as unknown
        if (v && typeof v === 'object' && 'formula' in (v as object)) {
          const f = v as { formula: string; result?: unknown }
          lines.push(`  ${cell.address} = ${f.formula}  (shows ${JSON.stringify(f.result ?? '')})`)
        } else lines.push(`  ${cell.address}: ${JSON.stringify(v)}${cell.numFmt && cell.numFmt !== 'General' ? ` [format ${cell.numFmt}]` : ''}${cell.font?.bold ? ' [bold]' : ''}`)
      })
    })
  })
  return lines.slice(0, 1500).join('\n')
}

/**
 * Turns uploads into evidence. Handwriting pages also go through SAM 3.1,
 * whose letter boxes give exact measurements to quote back to the learner.
 */
export async function gather(uploads: Upload[], o: { handwriting: boolean; ref?: string; languages?: string[] }): Promise<Evidence> {
  const ev: Evidence = { images: [], notes: [] }
  let page = 0
  for (const u of uploads) {
    const tag = u.taskId ? `for task ${u.taskId}` : ''
    if (isImage(u)) {
      page++
      const img = shrink(u)
      ev.images.push(img)
      ev.notes.push(`Image ${page}: "${u.name}" ${tag}`.trim())
      if (o.handwriting) {
        const boxes = await segment(img, 'letter', { task: 'check-segment', ref: o.ref })
        ev.notes.push('Segmentation measurements (SAM 3.1): ' + describe(page, measure(boxes)))
      }
    } else if (isAudio(u)) {
      const { wav, seconds } = toWav(u)
      const text = await transcribe(wav, seconds, { task: 'check-transcribe', ref: o.ref, languages: o.languages })
      const wordCount = text.split(/\s+/).filter(Boolean).length
      const fillers = (text.match(FILLERS) ?? []).length
      ev.notes.push(
        `Recording "${u.name}" ${tag}: ${seconds.toFixed(0)} seconds, ${wordCount} words (${Math.round((wordCount / Math.max(seconds, 1)) * 60)} words a minute), ${fillers} filler words.\nTranscript: ${text}`,
      )
    } else if (isSheet(u)) {
      ev.notes.push(`Spreadsheet "${u.name}" ${tag}, every filled cell with its formula or value:\n${await sheetText(u)}`)
    } else if (isText(u)) {
      ev.notes.push(`File "${u.name}" ${tag}:\n${u.data.toString('utf8').slice(0, 20000)}`)
    } else {
      ev.notes.push(`File "${u.name}" ${tag} could not be read (type ${u.mime}). Ask for a photo, a screenshot or an .xlsx/.txt export.`)
    }
  }
  return ev
}

/** Typed answers, per task. */
export function typedAnswers(answers: Record<string, string>): string[] {
  return Object.entries(answers).map(([id, text]) => `Typed answer for task ${id}:\n${text.slice(0, 6000)}`)
}
