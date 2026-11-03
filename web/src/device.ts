/**
 * This browser's own random key. With a learner's first name it is who they
 * are on the leaderboard, until Learn with AI joins GrowthGoal accounts.
 * Without storage (a private window) every visit is a new learner, which only
 * costs them their place on the board.
 */
const KEY = 'lwa-device'

export function deviceKey(): string | undefined {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && /^[a-z0-9]{12,40}$/.test(saved)) return saved
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789'
    const made = Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => abc[b % abc.length]).join('')
    localStorage.setItem(KEY, made)
    return made
  } catch {
    return undefined
  }
}
