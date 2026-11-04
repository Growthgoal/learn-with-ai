import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send, Sparkles } from 'lucide-react'
import { api, Badge, Learner, Skill } from '../api'
import { useCatalogue } from '../useCatalogue'
import { deviceKey } from '../device'
import { Earned, forgetProgress, opener, useProgress } from '../progress'

/**
 * Getting started: the skill's own form (no AI, so it costs nothing), the
 * price, then the AI's few remaining questions, then the workbook.
 */

interface FormQuestion {
  id: string; label: string; type: 'single' | 'multi' | 'text'; options: string[]
  /** The workbook cannot be written without it. */
  required?: boolean
  /** Asked only when an earlier answer opens it. */
  showIf?: { id: string; anyOf: string[] } | null
}
interface SkillForm { goals: string[]; questions: FormQuestion[] }

const LANGS: { value: Learner['language']; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिंदी' },
  { value: 'Hinglish', label: 'Hinglish' },
]
const MINUTES = [10, 15, 20, 30, 45, 60]
const LIKES = ['Cricket', 'Music', 'Cooking', 'Animals', 'Movies', 'Travel', 'Drawing', 'Gaming', 'Family', 'Business', 'Festivals', 'Nature']

function Chips({ options, value, onChange, multi = false }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            className={`rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition ${on ? 'bg-lime-500 text-white' : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-lime-400'}`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

const field = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-lime-400'

export default function Start() {
  const { id = '' } = useParams()
  const cat = useCatalogue()
  const listed = cat?.skills.find((s) => s.id === id)
  // A skill the learner named themselves is not in the catalogue; ask for it alone.
  const [own, setOwn] = useState<Skill | null | undefined>(undefined)
  useEffect(() => {
    if (cat && !listed) api<Skill>(`/skills/${id}`).then(setOwn).catch(() => setOwn(null))
  }, [cat, listed, id])
  const skill = listed ?? own ?? undefined
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const asked = Number(params.get('level'))
  const [level, setLevel] = useState([1, 2, 3].includes(asked) ? asked : 1)
  // Advanced and Pro open with the badge of the level before: from this browser, or a pasted badge link.
  const earned = useProgress()
  const [pasted, setPasted] = useState<Earned | null>(null)
  const [badgeLink, setBadgeLink] = useState('')
  const [badgeError, setBadgeError] = useState<string | null>(null)

  const [form, setForm] = useState<SkillForm | null>(null)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  // Asked only for a child under 12; anyone older fills it in for themselves.
  const [readBy, setReadBy] = useState<'learner' | 'parent' | null>(null)
  const [language, setLanguage] = useState<Learner['language']>('English')
  const [goal, setGoal] = useState<string[]>([])
  const [goalOther, setGoalOther] = useState('')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [minutes, setMinutes] = useState(15)
  const [likes, setLikes] = useState<string[]>([])
  const [likesOther, setLikesOther] = useState('')
  const [notes, setNotes] = useState('')

  // After the form: the AI's own few questions, answered one at a time.
  const [ai, setAi] = useState<{ intro: string; questions: string[] } | null>(null)
  const [aiAnswers, setAiAnswers] = useState<string[]>([])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<SkillForm>(`/skills/${id}/form`).then(setForm).catch(() => setForm({ goals: [], questions: [] }))
  }, [id])

  if (!cat || !form || (!listed && own === undefined)) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  if (!skill) return <p>We do not teach that skill yet. <Link to="/">See all skills</Link></p>

  const young = Number(age) > 0 && Number(age) < 12
  // A follow-up question appears only once the answer it hangs on is given.
  const shown = form.questions.filter((q) => !q.showIf || (answers[q.showIf.id] ?? []).some((a) => q.showIf!.anyOf.includes(a)))
  const said = (q: FormQuestion) => (answers[q.id] ?? []).map((a) => a.trim()).filter(Boolean)
  const goalText = [...goal.filter((g) => g !== 'Something else'), goal.includes('Something else') ? goalOther.trim() : ''].filter(Boolean).join('; ')
  const learner = (): Learner & { answers: { question: string; answer: string }[]; notes?: string } => ({
    name: name.trim(),
    age: Number(age),
    language,
    goal: goalText || `Get good at ${skill.name.toLowerCase()}`,
    startingPoint: (shown.find((q) => q.type !== 'text') ? said(shown.find((q) => q.type !== 'text')!).join(', ') : '') || 'Not said',
    minutesPerDay: minutes,
    interests: [...likes, ...likesOther.split(',').map((x) => x.trim())].filter(Boolean).slice(0, 6),
    readBy: young ? readBy ?? 'parent' : 'learner',
    answers: shown.map((q) => ({ question: q.label, answer: said(q).join(', ') || 'Not answered' })),
    notes: notes.trim() || undefined,
  })

  // The steps of the form; each says whether it is complete enough to move on.
  const steps: { title: string; ok: boolean; body: JSX.Element }[] = [
    {
      title: 'Who is learning?',
      ok: name.trim().length > 0 && Number(age) >= 3 && Number(age) <= 100 && (!young || readBy !== null),
      body: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-bold">Learner's first name<input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} className={field} placeholder="e.g. Aarav" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">Age<input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" className={field} placeholder="e.g. 7" /></label>
          {young && (
            <div className="flex flex-col gap-1.5 text-sm font-bold">Who is filling this in?
              <Chips
                options={[`${name.trim() || 'The child'} (the learner)`, 'A parent']}
                value={readBy === 'parent' ? ['A parent'] : readBy === 'learner' ? [`${name.trim() || 'The child'} (the learner)`] : []}
                onChange={(v) => setReadBy(v[0] === 'A parent' ? 'parent' : 'learner')}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-sm font-bold">Workbook language
            <Chips options={LANGS.map((l) => l.label)} value={[LANGS.find((l) => l.value === language)!.label]} onChange={(v) => setLanguage(LANGS.find((l) => l.label === v[0])!.value)} />
          </div>
        </div>
      ),
    },
    {
      title: `What do you want from ${skill.name}?`,
      ok: goal.length > 0 && (!goal.includes('Something else') || goalOther.trim().length > 2),
      body: (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">Pick any that fit.</p>
          <Chips multi options={[...form.goals, 'Something else']} value={goal} onChange={setGoal} />
          {goal.includes('Something else') && <input value={goalOther} onChange={(e) => setGoalOther(e.target.value.slice(0, 200))} className={field} placeholder="Your goal, in a few words" />}
        </div>
      ),
    },
    ...shown.map((q) => ({
      title: q.label,
      ok: q.type === 'text' ? !q.required || (said(q)[0] ?? '').length >= 2 : said(q).length > 0,
      body:
        q.type === 'text' ? (
          <textarea
            value={(answers[q.id] ?? [''])[0]}
            onChange={(e) => setAnswers({ ...answers, [q.id]: [e.target.value.slice(0, 500)] })}
            rows={3}
            className={field}
            placeholder={q.required ? 'A sentence or two, in your own words' : 'A sentence or two (you can skip this)'}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {q.type === 'multi' && <p className="text-sm text-ink-soft">Pick any that fit.</p>}
            <Chips multi={q.type === 'multi'} options={q.options} value={answers[q.id] ?? []} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
          </div>
        ),
    })),
    {
      title: 'Time and the things you love',
      ok: true,
      body: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-sm font-bold">Minutes a day
            <Chips options={MINUTES.map((m) => `${m} min`)} value={[`${minutes} min`]} onChange={(v) => setMinutes(parseInt(v[0]))} />
          </div>
          <div className="flex flex-col gap-1.5 text-sm font-bold">What do you love? Your examples will be about these.
            <Chips multi options={LIKES} value={likes} onChange={(v) => setLikes(v.slice(0, 4))} />
            <input value={likesOther} onChange={(e) => setLikesOther(e.target.value.slice(0, 80))} className={field} placeholder="Anything else you love (optional)" />
          </div>
        </div>
      ),
    },
    {
      title: 'Anything else you want us to know?',
      ok: true,
      body: <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1500))} rows={5} className={field} placeholder="Optional. For example: what you have tried before, an exam date, a teacher's comment, what makes it hard." />,
    },
  ]
  const onPrice = step === steps.length
  const current = steps[step]

  async function toAi() {
    setBusy(true)
    setError(null)
    try {
      const r = await api<{ intro: string; questions: string[] }>('/followups', { method: 'POST', json: { skillId: id, level, learner: learner(), fromBadge: openerFor(level)?.badgeId } })
      setAi(r)
      if (r.questions.length === 0) await write([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function write(extra: string[]) {
    setBusy(true)
    setError(null)
    const l = learner()
    const qa = ai?.questions.map((q, i) => `${q} ${extra[i] ?? ''}`.trim()).join('\n')
    try {
      const { code } = await api<{ code: string }>('/workbooks', {
        method: 'POST',
        json: { skillId: id, level, device: deviceKey(), fromBadge: openerFor(level)?.badgeId, learner: { ...l, notes: [l.notes, qa ? `Answers to the AI teacher's questions:\n${qa}` : ''].filter(Boolean).join('\n\n') || undefined } },
      })
      forgetProgress()
      navigate(`/w/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
      setBusy(false)
    }
  }

  function answerAi(e: FormEvent) {
    e.preventDefault()
    if (!ai || !reply.trim()) return
    const next = [...aiAnswers, reply.trim()]
    setAiAnswers(next)
    setReply('')
    if (next.length >= ai.questions.length) void write(next)
  }

  const price = skill.prices[level - 1].price
  const who = name.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const openerFor = (n: number) =>
    opener(earned, skill.id, n, name) ?? (pasted && pasted.level === n - 1 && pasted.name.toLowerCase() === who ? pasted : null)
  const isOpen = (n: number) => n === 1 || !!openerFor(n)
  const prevName = cat.levels[level - 2]?.name

  async function applyPastedBadge() {
    setBadgeError(null)
    const id = /badge\/([a-z0-9]+)/i.exec(badgeLink)?.[1] ?? badgeLink.trim()
    try {
      const b = await api<Badge>(`/badges/${encodeURIComponent(id)}`)
      const first = b.learnerName.trim().split(/\s+/)[0] ?? ''
      if (b.skillId !== skill!.id) return setBadgeError(`That badge is for ${b.skillName}, not ${skill!.name}.`)
      if (b.level !== level - 1) return setBadgeError(`That is a Level ${b.level} badge; ${cat!.levels[level - 1].name} needs the ${prevName} badge.`)
      if (first.toLowerCase() !== who) return setBadgeError(`That badge was earned by ${first}. Use the same first name as on the badge.`)
      setPasted({ skillId: b.skillId, level: b.level, badgeId: b.id, name: first })
    } catch {
      setBadgeError('We could not find that badge. Copy the link from the badge page and paste it here.')
    }
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={skill.custom ? '/' : `/skill/${skill.id}`} className="text-sm font-bold text-ink-soft hover:text-ink">← {skill.custom ? 'All skills' : skill.name}</Link>

      {!ai && !onPrice && (
        <div className="flex flex-col gap-5 rounded-4xl bg-white p-5 shadow-card sm:p-8">
          <div className="h-2 overflow-hidden rounded-full bg-cream-dim"><div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${((step + 1) / (steps.length + 1)) * 100}%` }} /></div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Step {step + 1} of {steps.length + 1}</p>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{current.title}</h1>
          {current.body}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex items-center gap-1 rounded-2xl px-4 py-3 font-bold text-ink-soft disabled:opacity-30"><ArrowLeft size={16} /> Back</button>
            <button type="button" onClick={() => setStep(step + 1)} disabled={!current.ok} className="flex items-center gap-1 rounded-2xl bg-lime-500 px-6 py-3 font-bold text-white disabled:opacity-40">Next <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {!ai && onPrice && (
        <div className="flex flex-col gap-4 rounded-4xl bg-white p-5 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{name.trim()}'s {skill.name} workbook</h1>
          <p className="text-ink-soft">{goalText || skill.name} · {LANGS.find((l) => l.value === language)!.label} · {minutes} minutes a day</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {cat.levels.map((l) => (
              <button key={l.n} type="button" onClick={() => setLevel(l.n)} aria-pressed={l.n === level} className={`rounded-2xl p-4 text-left ${l.n === level ? 'bg-lime-50 ring-2 ring-lime-500' : 'bg-cream ring-1 ring-ink/10'}`}>
                <span className="block font-bold">{l.name}</span>
                <span className="font-display text-2xl font-extrabold">₹{skill.prices[l.n - 1].price}</span>
                {l.n > 1 && <span className="block text-xs font-bold text-ink-soft">{isOpen(l.n) ? '✓ Unlocked' : `🔒 After ${cat.levels[l.n - 2].name}`}</span>}
              </button>
            ))}
          </div>
          {!isOpen(level) && (
            <div className="flex flex-col gap-2 rounded-2xl bg-cream-dim p-4 text-sm">
              <p>
                <b>{cat.levels[level - 1].name}</b> opens with {name.trim() || 'the learner'}'s <b>{prevName}</b> badge in {skill.name}. It is written from that
                checked work, to polish what needs it and go a level higher. No badge yet? Start with {prevName}.
              </p>
              <p className="font-bold">Earned it on another phone? Paste the badge link:</p>
              <div className="flex gap-2">
                <input value={badgeLink} onChange={(e) => setBadgeLink(e.target.value)} placeholder="growthgoal.in/learn/badge/…" className={`${field} py-2`} />
                <button type="button" onClick={applyPastedBadge} disabled={!badgeLink.trim()} className="shrink-0 rounded-2xl bg-ink px-4 font-bold text-white disabled:opacity-40">Use it</button>
              </div>
              {badgeError && <p className="font-semibold text-red-700">{badgeError}</p>}
            </div>
          )}
          <button onClick={toAi} disabled={busy || !isOpen(level)} className="flex items-center justify-center gap-2 rounded-2xl bg-sun-400 px-6 py-4 font-bold text-ink shadow-[0_5px_0_0_#A16207] disabled:opacity-60">
            <Sparkles size={18} /> {busy ? 'Reading your answers…' : cat.payments ? `Pay ₹${price} and continue` : `Continue · ₹${price}, free during the hackathon`}
          </button>
          <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-bold text-ink-soft">← Change my answers</button>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      )}

      {ai && (
        <div className="flex flex-col gap-3 rounded-4xl bg-white p-5 shadow-card sm:p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-lime-700"><Sparkles size={16} /> Your AI teacher {ai.questions.length > 0 ? `· ${Math.min(aiAnswers.length + 1, ai.questions.length)} of ${ai.questions.length}` : ''}</p>
          {ai.intro && <div className="max-w-[90%] self-start rounded-2xl bg-cream-dim px-4 py-2.5">{ai.intro}</div>}
          {ai.questions.slice(0, aiAnswers.length + 1).map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="max-w-[90%] self-start rounded-2xl bg-cream-dim px-4 py-2.5">{q}</div>
              {aiAnswers[i] && <div className="max-w-[90%] self-end rounded-2xl bg-lime-500 px-4 py-2.5 text-white">{aiAnswers[i]}</div>}
            </div>
          ))}
          {busy && <div className="self-start rounded-2xl bg-cream-dim px-4 py-2.5 text-ink-faint">Writing {name.trim()}'s workbook…</div>}
          {!busy && aiAnswers.length < ai.questions.length && (
            <form onSubmit={answerAi} className="flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value.slice(0, 400))} autoFocus placeholder="Your answer" className="min-w-0 flex-1 rounded-xl border border-ink/10 px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-lime-400" />
              <button disabled={!reply.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-lime-500 text-white disabled:opacity-40" aria-label="Send"><Send size={18} /></button>
            </form>
          )}
          {!busy && aiAnswers.length < ai.questions.length && (
            <button type="button" onClick={() => write(aiAnswers)} className="self-start text-sm font-bold text-ink-soft">Skip the rest and write my workbook →</button>
          )}
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      )}
    </div>
  )
}
