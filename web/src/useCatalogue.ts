import { useEffect, useState } from 'react'
import { api, Catalogue } from './api'

let cached: Catalogue | null = null

export function useCatalogue() {
  const [cat, setCat] = useState<Catalogue | null>(cached)
  useEffect(() => {
    if (cached) return
    api<Catalogue>('/skills').then((c) => {
      cached = c
      setCat(c)
    })
  }, [])
  return cat
}
