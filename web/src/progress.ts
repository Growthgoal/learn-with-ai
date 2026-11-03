import { useEffect, useState } from 'react'
import { api } from './api'
import { deviceKey } from './device'

/** A badge earned in this browser: what opens the next level of its skill. */
export interface Earned { skillId: string; level: number; badgeId: string; name: string }

let cached: Earned[] | null = null

export function useProgress() {
  const [earned, setEarned] = useState<Earned[] | null>(cached)
  useEffect(() => {
    if (cached) return
    const d = deviceKey()
    if (!d) return setEarned((cached = []))
    api<{ badges: Earned[] }>(`/progress?device=${d}`)
      .then((r) => setEarned((cached = r.badges)))
      .catch(() => setEarned([]))
  }, [])
  return earned
}

/**
 * The badge that opens this level of this skill, if this browser has one:
 * Basic is always open, each level after it needs the badge of the one before.
 * With a name, only that learner's badges count.
 */
export function opener(earned: Earned[] | null, skillId: string, level: number, name?: string) {
  if (level === 1) return null
  const who = name?.trim().split(/\s+/)[0]?.toLowerCase()
  return earned?.find((b) => b.skillId === skillId && b.level === level - 1 && (!who || b.name.toLowerCase() === who)) ?? null
}
