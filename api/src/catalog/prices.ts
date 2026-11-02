import { Size } from '../workbook/write.js'

/**
 * What a workbook level costs the learner: the AI credit it uses, plus ₹39
 * for everything else (server, team, payment fee), rounded up to end in 9.
 *
 * AI credit per size is measured from real runs (output/usage.jsonl), in
 * rupees, before the 30% safety margin: intake chat, writing, our AI
 * teacher's included answers, checking every page, and a fix-up workbook.
 */
export const OUR_SHARE = 39
const MARGIN = 1.3
const AI_RUPEES: Record<Exclude<Size, 'fixup'>, number> = {
  starter: 0.5 + 8 + 10 * 0.3 + 5 + 2,
  standard: 0.5 + 10 + 20 * 0.3 + 8 + 2,
  pro: 0.5 + 14 + 40 * 0.3 + 12 + 3,
}
/** Questions to our AI teacher included in the price; their own AI is unlimited. */
export const QUESTIONS: Record<Size, number> = { starter: 10, standard: 20, pro: 40, fixup: 10 }

const nine = (x: number) => Math.ceil((x + 1) / 10) * 10 - 1
export const PRICES = Object.fromEntries(
  Object.entries(AI_RUPEES).map(([size, ai]) => [size, { ai: Math.round(ai * MARGIN), price: nine(ai * MARGIN + OUR_SHARE) }]),
) as Record<Exclude<Size, 'fixup'>, { ai: number; price: number }>
