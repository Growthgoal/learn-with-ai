import { useEffect, useState } from 'react'
import { api } from './api'
import { deviceKey } from './device'

/** A badge earned in this browser: what opens the next level of its skill. */
export interface Earned { skillId: string; level: number; badgeId: string; name: string }

/** A workbook made in this browser, newest first: how a learner without an account finds it again. */
export interface Made { code: string; skillId: string; skillName: string; level: string; name: string; status: 'writing' | 'ready' | 'failed'; badgeId: string | null }

interface Progress { badges: Earned[]; workbooks: Made[] }

let cached: Progress | null = null

/** After a new workbook or a new badge, so the next page asks again. */
export const forgetProgress = () => {
  cached = null
}

function useMine() {
  const [mine, setMine] = useState<Progress | null>(cached)
  useEffect(() => {
    if (cached) return setMine(cached)
    const d = deviceKey()
    if (!d) return setMine((cached = { badges: [], workbooks: [] }))
    api<Progress>(`/progress?device=${d}`)
      .then((r) => setMine((cached = r)))
      .catch(() => setMine({ badges: [], workbooks: [] }))
  }, [])
  return mine
}

export const useProgress = () => useMine()?.badges ?? null
export const useMyWorkbooks = () => useMine()?.workbooks ?? null

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
