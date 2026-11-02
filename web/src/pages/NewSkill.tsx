import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Wand2 } from 'lucide-react'
import { api } from '../api'

const field = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-lime-400'

/**
 * Any skill we do not list. The AI checks it is safe to teach, gives it its
 * own form, and from there it is the same as every listed skill.
 */
export default function NewSkill() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [name, setName] = useState(params.get('skill') ?? '')
  const [want, setWant] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { id } = await api<{ id: string }>('/custom-skills', { method: 'POST', json: { name: name.trim(), want: want.trim() } })
      navigate(`/start/${id}`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <Link to="/" className="text-sm font-bold text-ink-soft hover:text-ink">← All skills</Link>
      <div className="flex flex-col gap-2">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lime-100"><Wand2 size={26} className="text-lime-700" /></span>
        <h1 className="text-3xl font-extrabold leading-tight">A workbook for any skill</h1>
        <p className="text-ink-soft">
          Name the skill. The AI teacher sets up questions made for it, then writes your workbook, helps when you are stuck and checks your
          work, just like the skills we list.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-card">
        <label className="flex flex-col gap-1.5">
          <span className="font-bold">Which skill?</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="e.g. Kathak, bird watching, Tally Prime" className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-bold">What do you want to be able to do? <span className="font-normal text-ink-faint">(optional)</span></span>
          <textarea
            value={want}
            onChange={(e) => setWant(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="e.g. Perform one full dance at my sister's wedding"
            className={field}
          />
        </label>
        {error && <p className="rounded-2xl bg-sun-100 px-4 py-3 text-sm font-semibold text-ink">{error}</p>}
        <button disabled={busy || name.trim().length < 2} className="flex items-center justify-center gap-2 rounded-2xl bg-lime-500 px-5 py-3.5 font-bold text-white disabled:opacity-50">
          <Wand2 size={18} /> {busy ? 'Setting up your skill…' : 'Continue'}
        </button>
        <p className="flex items-start gap-2 text-xs text-ink-faint">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          We teach skills that are safe and legal. Anything that could hurt someone, or that only a licensed professional may do, we will say no to and suggest something close.
        </p>
      </form>
    </div>
  )
}
