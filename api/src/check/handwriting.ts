import { Box } from '../meta.js'

/**
 * Measurements of handwriting from SAM 3.1's letter boxes: the numbers a
 * handwriting teacher judges by eye, made objective so the checker's
 * feedback can point at a specific letter.
 */
export interface Row {
  letters: number
  /** Each letter's bottom edge relative to the row's line, as a share of letter height. Positive = above the line. */
  lift: number[]
  /** Spread of letter heights in the row, as a share of the median (0 = all equal). */
  heightSpread: number
  /** Spread of the gaps between letters, as a share of the median gap. */
  gapSpread: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}
const spread = (xs: number[]) => {
  const m = median(xs)
  if (!m || xs.length < 2) return 0
  return median(xs.map((x) => Math.abs(x - m))) / m
}

/** Groups letters into written rows, left to right, then measures each row. */
export function measure(boxes: Box[]): Row[] {
  if (!boxes.length) return []
  const h = median(boxes.map((b) => b.y2 - b.y1))
  const byY = [...boxes].sort((a, b) => (a.y1 + a.y2) / 2 - (b.y1 + b.y2) / 2)
  const rows: Box[][] = []
  for (const b of byY) {
    const last = rows[rows.length - 1]
    const centre = (b.y1 + b.y2) / 2
    if (last && Math.abs(centre - median(last.map((x) => (x.y1 + x.y2) / 2))) < h * 0.9) last.push(b)
    else rows.push([b])
  }
  return rows.map((row) => {
    const r = row.sort((a, b) => a.x1 - b.x1)
    const heights = r.map((b) => b.y2 - b.y1)
    // The line the row sits on: the lowest common bottom edge. Letters that
    // end well above it are floating.
    const line = Math.max(...r.map((b) => b.y2).filter((y, _, all) => y >= median(all) - h * 0.15))
    const gaps = r.slice(1).map((b, i) => b.x1 - r[i].x2)
    return {
      letters: r.length,
      lift: r.map((b) => +((line - b.y2) / median(heights)).toFixed(2)),
      heightSpread: +spread(heights).toFixed(2),
      gapSpread: +spread(gaps).toFixed(2),
    }
  })
}

/** The measurements as lines the marking model reads alongside the photo. */
export function describe(page: number, rows: Row[]) {
  if (!rows.length) return `Page ${page}: no handwritten letters found by segmentation.`
  return rows
    .map((r, i) => {
      const floating = r.lift.map((l, j) => (l > 0.2 ? `letter ${j + 1} sits ${Math.round(l * 100)}% of a letter height above the line` : null)).filter(Boolean)
      return `Page ${page}, written row ${i + 1}: ${r.letters} letters (left to right). Height spread ${Math.round(r.heightSpread * 100)}%, spacing spread ${Math.round(r.gapSpread * 100)}%. ${floating.length ? floating.join('; ') + '.' : 'All letters sit on the line.'}`
    })
    .join('\n')
}
