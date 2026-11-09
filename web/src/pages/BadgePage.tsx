import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, Copy, Trophy } from 'lucide-react'
import { api, Badge } from '../api'
import { useMyWorkbooks } from '../progress'
import { addToGrowthGoal } from '../growthgoal'

/** A badge anyone can open from a shared link, to see what the learner can now do. */
export default function BadgePage() {
  const { id = '' } = useParams()
  const [b, setB] = useState<Badge | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // Only on the phone or computer it was earned on: a shared badge link never
  // carries the workbook's code.
  const own = useMyWorkbooks()?.find((w) => w.badgeId === id)
  useEffect(() => {
    api<Badge>(`/badges/${id}`).then(setB).catch((e) => setError(e.message))
  }, [id])
  if (error) return <p className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</p>
  if (!b) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="relative overflow-hidden rounded-4xl bg-white p-8 text-center shadow-card-lg">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-lime-400 via-sun-400 to-lime-500" />
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sun-400 text-ink shadow-card"><Award size={40} /></span>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-lime-700">GrowthGoal skill badge</p>
        <h1 className="mt-2 text-3xl font-extrabold">{b.name}</h1>
        <p className="mt-2 text-lg">Earned by <b>{b.learnerName}</b></p>
        <p className="text-ink-soft">{b.skillName} · Level {b.level} · {b.percent}% on the final check</p>
        <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-sun-100 px-4 py-1.5 font-display text-lg font-extrabold">
          <Trophy size={18} className="text-sun-600" /> +{b.points} skill points
        </p>
        <div className="mt-6 rounded-3xl bg-cream p-5 text-left">
          <p className="font-bold">{b.learnerName} can now:</p>
          <ul className="mt-2 list-disc pl-5">{b.canDo.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <p className="mt-5 text-xs text-ink-faint">
          Checked by Learn with AI on {new Date(b.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Badge {b.id}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={share} className="inline-flex items-center gap-2 rounded-2xl bg-lime-500 px-5 py-3 font-bold text-white"><Copy size={16} /> {copied ? 'Link copied' : 'Copy the link to share'}</button>
        <Link to={`/skill/${b.skillId}`} className="rounded-2xl bg-white px-5 py-3 font-bold shadow-card">Start the next level</Link>
        <Link to="/leaderboard" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold shadow-card"><Trophy size={16} /> Leaderboard</Link>
        {own && <a href={addToGrowthGoal([own.code])} className="rounded-2xl bg-white px-5 py-3 font-bold shadow-card">Add to my GrowthGoal profile</a>}
      </div>
    </div>
  )
}
