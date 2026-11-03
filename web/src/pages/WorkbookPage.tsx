import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, ChevronDown, Copy, Download, HelpCircle, Loader2, Mic, Printer, Send, Square, Upload } from 'lucide-react'
import { api, BASE, Check, PROOF_LABEL, Task, WorkbookView } from '../api'

function useWorkbook(code: string) {
  const [wb, setWb] = useState<WorkbookView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = () =>
    api<WorkbookView>(`/workbooks/${code}`)
      .then(setWb)
      .catch((e) => setError(e.message))
  useEffect(() => {
    void load()
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps
  // Writing takes about a minute; keep asking until it is ready.
  useEffect(() => {
    if (wb?.status !== 'writing') return
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [wb?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  return { wb, error, reload: load }
}

/** Help with one task: our AI teacher, or the ready prompt in the learner's own AI. */
function Stuck({ code, task, left, onAsked }: { code: string; task: Task; left: number; onAsked: (left: number) => void }) {
  const [open, setOpen] = useState(false)
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  async function ask(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const next = [...chat, { role: 'user' as const, content: text.trim() }]
    setChat(next)
    setText('')
    setBusy(true)
    setNote(null)
    try {
      const r = await api<{ reply: string; questionsLeft: number }>(`/workbooks/${code}/ask`, { method: 'POST', json: { taskId: task.id, messages: next } })
      setChat([...next, { role: 'assistant', content: r.reply }])
      onAsked(r.questionsLeft)
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(task.stuckPrompt)
      setNote('Copied. Paste it into ChatGPT, Gemini, Claude or any AI you use.')
    } catch {
      setNote('Select the prompt above and copy it.')
    }
  }
  const q = encodeURIComponent(task.stuckPrompt)
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 text-sm font-bold text-lime-700">
        <HelpCircle size={15} /> Stuck? {open ? 'Hide help' : 'Get help'}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-cream p-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Ask your own AI, as much as you like</p>
            <p className="mt-1 select-all whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">{task.stuckPrompt}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={copy} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-sm font-bold shadow-sm"><Copy size={14} /> Copy prompt</button>
              <a href={`https://chatgpt.com/?q=${q}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold shadow-sm">Open in ChatGPT</a>
              <a href={`https://claude.ai/new?q=${q}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold shadow-sm">Open in Claude</a>
              <a href="https://gemini.google.com/app" target="_blank" rel="noreferrer" className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold shadow-sm">Gemini (paste it)</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Or ask our AI teacher · {left} questions left</p>
            <div className="mt-1 flex flex-col gap-2">
              {chat.map((m, i) => (
                <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === 'assistant' ? 'self-start bg-white' : 'self-end bg-lime-500 text-white'}`}>{m.content}</div>
              ))}
              {busy && <div className="self-start rounded-2xl bg-white px-3 py-2 text-sm text-ink-faint">Thinking…</div>}
            </div>
            <form onSubmit={ask} className="mt-2 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What is confusing you?" className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm focus:outline-none" />
              <button disabled={busy || !text.trim() || left <= 0} className="grid h-10 w-10 place-items-center rounded-xl bg-lime-500 text-white disabled:opacity-40" aria-label="Ask"><Send size={16} /></button>
            </form>
          </div>
          {note && <p className="text-sm font-semibold text-ink-soft">{note}</p>}
        </div>
      )}
    </div>
  )
}

/** Records a spoken task in the browser, for voice skills. */
function Recorder({ onDone }: { onDone: (file: File) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chunks = useRef<Blob[]>([])
  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      chunks.current = []
      r.ondataavailable = (e) => chunks.current.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const type = r.mimeType || 'audio/webm'
        onDone(new File([new Blob(chunks.current, { type })], `recording-${Date.now()}.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type }))
      }
      r.start()
      setRec(r)
    } catch {
      setError('The microphone is not available. Record on your phone and upload the file instead.')
    }
  }
  return (
    <div className="flex items-center gap-2">
      {rec ? (
        <button onClick={() => { rec.stop(); setRec(null) }} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"><Square size={14} /> Stop</button>
      ) : (
        <button onClick={start} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white"><Mic size={14} /> Record</button>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

function CheckCard({ check, code }: { check: Check; code: string }) {
  const r = check.result
  return (
    <div className={`rounded-3xl p-5 shadow-card ${r.passed ? 'bg-lime-50 ring-2 ring-lime-500' : 'bg-white'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg font-extrabold">
          {r.scope === 'badge' ? (r.passed ? 'Passed. Badge earned!' : 'Not there yet') : 'Page check'} · {r.percent}%
        </p>
        <p className="text-xs text-ink-faint">{new Date(check.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      {!r.readable && <p className="mt-2 rounded-xl bg-sun-100 p-2 text-sm font-semibold">{r.unreadableReason}</p>}
      {!r.integrity.ok && <p className="mt-2 rounded-xl bg-sun-100 p-2 text-sm font-semibold">{r.integrity.note}</p>}
      <p className="mt-2 text-sm">{r.summary}</p>
      <ul className="mt-3 grid gap-2">
        {r.tasks.map((t) => (
          <li key={t.id} className="rounded-2xl bg-cream p-3 text-sm">
            <b>Task {t.id}</b> · {t.found ? `${t.score} points` : 'not handed in'}
            <p className="mt-0.5">{t.feedback}</p>
            {t.criteria.length > 0 && (
              <p className="mt-1 text-xs text-ink-soft">{t.criteria.map((c) => `${c.met ? '✓' : '✗'} ${c.criterion}`).join('   ')}</p>
            )}
          </li>
        ))}
      </ul>
      {(r.strengths.length > 0 || r.toImprove.length > 0) && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {r.strengths.length > 0 && <div><b>Going well</b><ul className="list-disc pl-5">{r.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {r.toImprove.length > 0 && <div><b>Practise next</b><ul className="list-disc pl-5">{r.toImprove.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
      )}
      {check.fixUpCode && (
        <Link to={`/w/${check.fixUpCode}`} className="mt-3 inline-block rounded-xl bg-sun-400 px-4 py-2 text-sm font-bold">Open your free fix-up workbook →</Link>
      )}
      {r.passed && <p className="mt-2 text-xs text-ink-soft">Workbook {code}</p>}
    </div>
  )
}

/**
 * Rupees a printed page, binding and packing included. The GrowthGoal shop
 * charges by its own copy of these (server/src/lib/learnPrint.ts) and by the
 * page count it reads from our server; keep the two the same.
 */
const PRINT_RATE = { bw: 2, colour: 5 }

/** A printed copy, posted: a separate order in the GrowthGoal shop, paid there. */
function PrintCopy({ code, pages }: { code: string; pages: number }) {
  const [colour, setColour] = useState(false)
  const options = [
    { colour: false, label: 'Black and white', rate: PRINT_RATE.bw },
    { colour: true, label: 'Colour', rate: PRINT_RATE.colour },
  ]
  return (
    <section className="flex flex-col gap-4 rounded-4xl bg-white p-6 shadow-card lg:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-100 text-lime-700"><Printer size={22} /></span>
        <div>
          <h2 className="text-xl font-extrabold">Want it printed and posted?</h2>
          <p className="text-sm text-ink-soft">
            We print this workbook ({pages} pages), bind it and send it to your door. Paid separately from the workbook itself.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => setColour(o.colour)}
            aria-pressed={colour === o.colour}
            className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left ${colour === o.colour ? 'border-lime-500 bg-lime-50' : 'border-ink/10 bg-white hover:border-ink/30'}`}
          >
            <span className="text-sm font-bold">{o.label}</span>
            <span className="font-display text-2xl font-extrabold">₹{pages * o.rate}</span>
            <span className="text-xs text-ink-faint">₹{o.rate} a page × {pages}</span>
          </button>
        ))}
      </div>
      <a
        href={`/checkout?print=${encodeURIComponent(code)}&colour=${colour ? 1 : 0}`}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/90"
      >
        <Printer size={18} /> Order the printed copy · ₹{pages * (colour ? PRINT_RATE.colour : PRINT_RATE.bw)}
      </a>
      <p className="text-xs text-ink-faint">Delivery as in the GrowthGoal shop: ₹49, free on orders of ₹999 and above.</p>
    </section>
  )
}

export default function WorkbookPage() {
  const { code = '' } = useParams()
  const { wb, error, reload } = useWorkbook(code)
  const [left, setLeft] = useState<number | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lwa-typed-${code}`) || '{}')
    } catch {
      return {}
    }
  })
  const [checking, setChecking] = useState<'page' | 'badge' | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [openCh, setOpenCh] = useState<number | null>(1)

  useEffect(() => {
    try {
      localStorage.setItem(`lwa-typed-${code}`, JSON.stringify(answers))
    } catch {
      // storage off: answers still go with the check
    }
  }, [answers, code])

  if (error) return <p className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</p>
  if (!wb) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  if (wb.status === 'writing')
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-4xl bg-white p-10 text-center shadow-card">
        <Loader2 className="animate-spin text-lime-600" size={36} />
        <h1 className="text-2xl font-extrabold">Writing {wb.learner.name}'s {wb.fixUpOf ? 'fix-up ' : ''}workbook</h1>
        <p className="text-ink-soft">Your AI teacher is planning the chapters, writing the lessons and examples, and making every task fit {wb.learner.name}. It takes about a minute.</p>
      </div>
    )
  if (wb.status === 'failed' || !wb.workbook)
    return <p className="rounded-3xl bg-red-50 p-6 text-red-700">This workbook could not be written. Write to GrowthGoal on WhatsApp with the code {wb.code} and we will make it again.</p>

  const w = wb.workbook
  const questions = left ?? wb.questionsLeft
  const typed = wb.skill.proof === 'typed'
  const accept = { pages: 'image/*', result: 'image/*', file: '.xlsx,.xlsm,.csv,.txt,.py,.js,.html,.css,.sql,.md,image/*', voice: 'audio/*', typed: '' }[wb.skill.proof]

  async function check(scope: 'page' | 'badge') {
    setChecking(scope)
    setCheckError(null)
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    form.append('scope', scope)
    if (typed) form.append('answers', JSON.stringify(answers))
    try {
      await api<Check>(`/workbooks/${code}/check`, { method: 'POST', body: form })
      setFiles([])
      await reload()
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : 'Try again.')
    } finally {
      setChecking(null)
    }
  }

  const taskCard = (t: Task) => (
    <div key={t.id} className="rounded-2xl border border-ink/5 bg-white p-4">
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-md bg-sun-400 px-2 font-display text-sm font-extrabold">{t.id === 'final' ? 'Final' : t.id}</span>
        <p className="font-semibold">{t.instruction}</p>
      </div>
      {t.trace && <p className="mt-2 font-display text-2xl tracking-widest text-ink/40">{t.trace}</p>}
      <p className="mt-2 text-sm text-ink-soft"><b>Hint:</b> {t.hint}</p>
      {typed && (
        <textarea
          value={answers[t.id] ?? ''}
          onChange={(e) => setAnswers({ ...answers, [t.id]: e.target.value })}
          rows={3}
          placeholder="Type your answer here. It is saved on this device."
          className="mt-2 w-full rounded-xl border border-ink/10 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
        />
      )}
      {wb.skill.proof === 'voice' && t.kind === 'speak' && (
        <div className="mt-2"><Recorder onDone={(f) => setFiles((x) => [...x, new File([f], `task-${t.id}-${f.name}`, { type: f.type })])} /></div>
      )}
      <Stuck code={code} task={t} left={questions} onAsked={setLeft} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-4xl bg-white p-6 shadow-card lg:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">
          {wb.skill.name} · {wb.sizeLabel}
        </p>
        <img src={`${BASE}api/workbooks/${code}/cover`} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} className="mb-4 mt-3 aspect-[3/2] w-full max-w-xl rounded-3xl object-cover" />
        <h1 className="mt-1 text-3xl font-extrabold lg:text-4xl">{w.title}</h1>
        <p className="mt-1 text-ink-soft">{w.subtitle}</p>
        {wb.fixUpOf && <p className="mt-3 rounded-2xl bg-sun-100 p-3 text-sm">This free fix-up workbook covers just the parts that needed more practice. When it is done, hand in your <Link className="font-bold underline" to={`/w/${wb.fixUpOf}`}>first workbook</Link> again for the badge.</p>}
        <p className="mt-4">{w.welcome}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`${BASE}api/workbooks/${code}/pdf`} className="inline-flex items-center gap-2 rounded-2xl bg-lime-500 px-5 py-3 font-bold text-white hover:bg-lime-600"><Download size={18} /> Download the PDF to print</a>
          {wb.badgeId && <Link to={`/badge/${wb.badgeId}`} className="inline-flex items-center gap-2 rounded-2xl bg-sun-400 px-5 py-3 font-bold"><Award size={18} /> See your badge{wb.badgePoints ? ` · +${wb.badgePoints} skill points` : ''}</Link>}
        </div>
        <p className="mt-3 text-xs text-ink-faint">Workbook code {code}. Keep this page: it is your online copy, your help and your hand-in desk.</p>
      </section>

      {wb.print && wb.pages && <PrintCopy code={code} pages={wb.pages} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">Your chapters</h2>
        {w.chapters.map((c) => (
          <div key={c.number} className="rounded-3xl bg-white shadow-card">
            <button onClick={() => setOpenCh(openCh === c.number ? null : c.number)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
              <span><span className="text-xs font-bold text-lime-700">Chapter {c.number}</span><span className="block font-display text-xl font-extrabold">{c.title}</span></span>
              <ChevronDown className={`shrink-0 transition ${openCh === c.number ? 'rotate-180' : ''}`} />
            </button>
            {openCh === c.number && (
              <div className="flex flex-col gap-3 px-5 pb-5">
                <p className="rounded-2xl bg-sun-100 p-3 font-semibold">{c.goal}</p>
                {c.lesson.map((p, i) => <p key={i}>{p}</p>)}
                <div className="rounded-2xl border-2 border-lime-500 p-4">
                  <p className="font-bold text-lime-700">Worked example: {c.example.title}</p>
                  <ol className="mt-1 list-decimal pl-5 text-sm">{c.example.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
                {c.tasks.map(taskCard)}
                <p className="border-l-4 border-sun-400 pl-3 text-sm"><b>Check yourself:</b> {c.checkpoint}</p>
              </div>
            )}
          </div>
        ))}
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="font-display text-xl font-extrabold">Final task</p>
          <div className="mt-2">{taskCard(w.finalTask)}</div>
        </div>
      </section>

      {w.quickReference && w.quickReference.length > 0 && (
        <section className="rounded-4xl border-2 border-lime-500 bg-white p-6 lg:p-8">
          <h2 className="text-xl font-extrabold">Keep this: your quick reference</h2>
          <p className="text-sm text-ink-soft">The rules and steps worth remembering. It is also the last page of your PDF.</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">{w.quickReference.map((x) => <li key={x}>{x}</li>)}</ol>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-4xl bg-ink p-6 text-white lg:p-8">
        <h2 className="text-2xl font-extrabold">Hand in your work</h2>
        <p className="text-white/80">
          {typed
            ? 'Your typed answers above go with the check.'
            : `${PROOF_LABEL[wb.skill.proof]}: ${wb.skill.handIn.toLowerCase()}. Photos flat and in good light, the whole page in view.`}{' '}
          Check a few pages any time while you work, or hand in everything for your badge: <b>{w.badge.name}</b>.
        </p>
        {!typed && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-white/30 p-4 hover:border-white/60">
            <Upload size={20} />
            <span className="text-sm font-semibold">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready: ${files.map((f) => f.name).join(', ').slice(0, 120)}` : 'Choose photos, files or recordings'}</span>
            <input type="file" multiple accept={accept} className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => check('page')} disabled={!!checking} className="rounded-2xl bg-white px-5 py-3 font-bold text-ink disabled:opacity-50">
            {checking === 'page' ? 'Checking…' : 'Check these pages now'}
          </button>
          <button onClick={() => check('badge')} disabled={!!checking} className="rounded-2xl bg-sun-400 px-5 py-3 font-bold text-ink disabled:opacity-50">
            {checking === 'badge' ? 'Checking everything…' : 'Hand in for my badge'}
          </button>
        </div>
        {checkError && <p className="rounded-xl bg-red-100 p-3 text-sm font-semibold text-red-800">{checkError}</p>}
        <p className="text-xs text-white/60">Photos are used only to check this work and are not kept. Marks and feedback stay on this page.</p>
      </section>

      {wb.checks.length > 0 && (
        <section id="results" className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Your checks</h2>
          {[...wb.checks].reverse().map((c) => <CheckCard key={c.id} check={c} code={code} />)}
        </section>
      )}
    </div>
  )
}
