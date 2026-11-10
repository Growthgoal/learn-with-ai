import { Band, Skill } from './skills.js'
import { Size } from '../workbook/write.js'

/**
 * What a workbook costs the learner: set per skill by what the skill is
 * worth to them (its band) and by level, never below the AI credit it uses
 * plus ₹39 for everything else (server, team, payment fee).
 */
export const OUR_SHARE = 39
const MARGIN = 1.3

/**
 * AI credit per workbook size, measured from real runs (output/usage.jsonl),
 * in rupees: intake chat, writing, cover, our AI teacher's included answers,
 * checking every page, and a fix-up workbook.
 */
const AI_RUPEES: Record<Exclude<Size, 'fixup'>, number> = {
  starter: 0.5 + 8 + 0.9 + 10 * 0.1 + 5 + 2,
  standard: 0.5 + 10 + 0.9 + 20 * 0.1 + 8 + 2,
  pro: 0.5 + 14 + 0.9 + 40 * 0.1 + 12 + 3,
}
/** Questions to our AI teacher included in the price; their own AI is unlimited. */
export const QUESTIONS: Record<Size, number> = { starter: 10, standard: 20, pro: 40, fixup: 10 }

/** Basic, Advanced and Pro by band, in rupees. ₹30 up on every level when Learn with AI went paid (the owner's call, 10 Nov 2026). */
const FIRST_THREE: Record<Band, [number, number, number]> = {
  kids: [99, 129, 159],
  life: [109, 149, 199],
  career: [129, 179, 229],
}
/** Expert and Master: each ₹75 more than the level before (the owner's rule, 10 Nov 2026). */
export const STEP_ABOVE_PRO = 75

/** Every level's price by band: Basic, Advanced, Pro, Expert, Master. */
export const BAND_PRICES: Record<Band, number[]> = Object.fromEntries(
  Object.entries(FIRST_THREE).map(([band, [a, b, c]]) => [band, [a, b, c, c + STEP_ABOVE_PRO, c + 2 * STEP_ABOVE_PRO]]),
) as Record<Band, number[]>

const SIZE_OF_LEVEL: Exclude<Size, 'fixup'>[] = ['starter', 'standard', 'pro', 'pro', 'pro']
const nine = (x: number) => Math.ceil((x + 1) / 10) * 10 - 1

export function priceOf(skill: Pick<Skill, 'band'>, level: number) {
  const size = SIZE_OF_LEVEL[level - 1] ?? 'standard'
  const ai = AI_RUPEES[size] * MARGIN
  const floor = nine(ai + OUR_SHARE)
  return { price: Math.max(BAND_PRICES[skill.band][level - 1], floor), ai: Math.round(ai) }
}
