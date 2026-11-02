import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import { api, Learner, Size } from '../api'
import { useCatalogue } from '../useCatalogue'

interface Msg { role: 'user' | 'assistant'; content: string }
interface Turn { reply: string; done: boolean; learner: Learner | null; level: number; size: Size }

export default function Start() {
  const { id } = useParams()
  const cat = useCatalogue()
  const skill = cat?.skills.find((s) => s.id === id)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The level picked on the skill page; the AI's suggestion fills in when there is none.
  const asked = Number(params.get('level'))
  const [level, setLevel] = useState<number | null>([1, 2, 3].includes(asked) ? asked : null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<Turn | null>(null)
  const [creating, setCreating] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  async function send(next: Msg[]) {
    setBusy(true)
    setError(null)
    try {
      const turn = await api<Turn>('/intake', { method: 'POST', json: { skillId: id, messages: next } })
      setMessages([...next, { role: 'assistant', content: turn.reply }])
      if (turn.done && turn.learner) setPlan(turn)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  // The teacher speaks first.
  useEffect(() => {
    if (skill && messages.length === 0) void send([{ role: 'user', content: `Hello! I want to learn ${skill.name}.` }])
  }, [skill]) // eslint-disable-line react-hooks/exhaustive-deps
  // Braces, not an expression: scrollIntoView returns a promise in newer browsers.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, plan])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || busy) return
    const next = [...messages, { role: 'user' as const, content: text.trim() }]
    setMessages(next)
    setText('')
    void send(next)
  }

  async function create() {
    if (!plan?.learner) return
    setCreating(true)
    setError(null)
    try {
      const { code } = await api<{ code: string }>('/workbooks', { method: 'POST', json: { skillId: id, level: level ?? plan.level, learner: plan.learner } })
      navigate(`/w/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
      setCreating(false)
    }
  }

  if (!cat) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  if (!skill) return <p>We do not teach that skill yet. <Link to="/">See all skills</Link></p>
  // The first, scripted hello is not shown; the conversation starts with the teacher.
  const shown = messages.slice(1)
  const l = plan?.learner
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={`/skill/${skill.id}`} className="text-sm font-bold text-ink-soft hover:text-ink">← {skill.name}</Link>
      <div className="flex flex-col gap-3 rounded-4xl bg-white p-4 shadow-card sm:p-6">
        <p className="flex items-center gap-2 text-sm font-bold text-lime-700"><Sparkles size={16} /> Your AI teacher</p>
        {shown.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] ${m.role === 'assistant' ? 'self-start bg-cream-dim' : 'self-end bg-lime-500 text-white'}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="self-start rounded-2xl bg-cream-dim px-4 py-2.5 text-ink-faint">Thinking…</div>}
        {l && plan && cat && (
          <div className="mt-2 flex flex-col gap-3 rounded-3xl border-2 border-lime-500 bg-lime-50 p-5">
            <p className="font-display text-xl font-extrabold">Your workbook plan</p>
            <ul className="grid gap-1 text-sm">
              <li><b>For:</b> {l.name}, {l.age}{l.readBy === 'parent' ? ' (with a parent)' : ''}</li>
              <li><b>Goal:</b> {l.goal}</li>
              <li><b>Starting from:</b> {l.startingPoint}</li>
              <li><b>Language:</b> {l.language} · <b>{l.minutesPerDay} minutes</b> a day</li>
            </ul>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Workbook">
              {cat.levels.map((lv) => {
                const on = (level ?? plan.level) === lv.n
                return (
                  <button
                    key={lv.n}
                    type="button"
                    onClick={() => setLevel(lv.n)}
                    aria-pressed={on}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${on ? 'bg-lime-500 text-white' : 'bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-lime-400'}`}
                  >
                    {lv.name} · ₹{skill.prices[lv.n - 1].price}
                    {lv.n === plan.level && !on ? ' (suggested)' : ''}
                  </button>
                )
              })}
            </div>
            <button
              onClick={create}
              disabled={creating}
              className="rounded-2xl bg-lime-500 px-5 py-3.5 font-bold text-white hover:bg-lime-600 disabled:opacity-60"
            >
              {creating ? 'Starting…' : cat.payments ? `Pay ₹${skill.prices[(level ?? plan.level) - 1].price} and write my workbook` : `Write my workbook · ₹${skill.prices[(level ?? plan.level) - 1].price}, free during the hackathon`}
            </button>
          </div>
        )}
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div ref={end} />
      </div>
      {!plan && (
        <form onSubmit={submit} className="sticky bottom-3 flex gap-2 rounded-2xl bg-white p-2 shadow-card-lg">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer…"
            autoFocus
            className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-[15px] focus:outline-none"
          />
          <button disabled={busy || !text.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-lime-500 text-white disabled:opacity-40" aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  )
}
