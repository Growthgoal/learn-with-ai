import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { Age, AGE_LABEL, api, Board, BoardRow, iconUrl } from '../api'
import { useCatalogue } from '../useCatalogue'
import { deviceKey } from '../device'

const MEDAL = ['🥇', '🥈', '🥉']

/**
 * Skill points, best first. A badge adds its level's points times the score
 * on the final check; each skill and level counts once. Only first names and
 * age groups are shown.
 */
export default function Leaderboard() {
  const cat = useCatalogue()
  const [period, setPeriod] = useState<'month' | 'all'>('month')
  const [age, setAge] = useState<Age | null>(null)
  const [group, setGroup] = useState<string | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams({ period })
    if (age) p.set('age', age)
    if (group) p.set('group', group)
    const d = deviceKey()
    if (d) p.set('device', d)
    setBoard(null)
    api<Board>(`/leaderboard?${p}`).then(setBoard).catch((e) => setError(e.message))
  }, [period, age, group])

  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${on ? 'bg-lime-500 text-white' : 'bg-cream-dim text-ink-soft hover:bg-lime-100'}`
  const mineOutside = board?.mine.filter((m) => !board.rows.some((r) => r.you && r.rank === m.rank && r.name === m.name)) ?? []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <section className="rounded-4xl bg-white p-6 shadow-card lg:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sun-400"><Trophy size={28} /></span>
          <div>
            <h1 className="text-3xl font-extrabold">Leaderboard</h1>
            <p className="text-ink-soft">
              Every badge earns skill points: Basic 100, Advanced 250, Pro 500, Expert 750, Master 1000, times your score on the final check. Each skill and level counts once.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button className={chip(period === 'month')} onClick={() => setPeriod('month')}>This month</button>
          <button className={chip(period === 'all')} onClick={() => setPeriod('all')}>All time</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[null, ...(Object.keys(AGE_LABEL) as Age[])].map((a) => (
            <button key={a ?? 'all'} className={chip(age === a)} onClick={() => setAge(a)}>{a ? AGE_LABEL[a] : 'Everyone'}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[null, ...(cat?.groups ?? [])].map((g) => (
            <button
              key={g?.name ?? 'all'}
              onClick={() => setGroup(g?.name ?? null)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${group === (g?.name ?? null) ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30'}`}
            >
              {g && <img src={iconUrl(g.icon)} alt="" className="h-4 w-4" />}
              {g?.name ?? 'All skills'}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</p>
      ) : !board ? (
        <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
      ) : board.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-4xl bg-white p-10 text-center shadow-card">
          <p className="font-display text-xl font-extrabold">No badges here yet</p>
          <p className="text-ink-soft">Finish a workbook, hand it in, and be the first name on this board.</p>
          <Link to="/" className="rounded-2xl bg-lime-500 px-5 py-3 font-bold text-white">Pick a skill</Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {board.rows.map((r) => <Row key={`${r.rank}-${r.name}-${r.points}`} r={r} />)}
          {mineOutside.length > 0 && (
            <>
              <li className="py-1 text-center text-ink-faint">⋯</li>
              {mineOutside.map((r) => <Row key={`me-${r.rank}-${r.name}`} r={r} />)}
            </>
          )}
        </ol>
      )}
      {board && board.total > 0 && <p className="text-center text-xs text-ink-faint">{board.total} learner{board.total === 1 ? '' : 's'} on this board. Only first names and age groups are shown.</p>}
    </div>
  )
}

function Row({ r }: { r: BoardRow }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl p-3 shadow-card ${r.you ? 'bg-lime-100 ring-2 ring-lime-500' : 'bg-white'}`}>
      <span className="grid w-10 shrink-0 place-items-center font-display text-xl font-extrabold">{MEDAL[r.rank - 1] ?? r.rank}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{r.name}{r.you && <span className="ml-2 rounded-full bg-lime-500 px-2 py-0.5 text-xs text-white">You</span>}</span>
        <span className="block text-xs text-ink-faint">{AGE_LABEL[r.ageBand]} · {r.badges} badge{r.badges === 1 ? '' : 's'}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-xl font-extrabold">{r.points}</span>
        <span className="block text-xs text-ink-faint">points</span>
      </span>
    </li>
  )
}
