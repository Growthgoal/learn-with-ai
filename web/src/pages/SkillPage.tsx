import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, FileText } from 'lucide-react'
import { AGE_LABEL, BASE, PROOF_LABEL } from '../api'
import { useCatalogue } from '../useCatalogue'
import { PROOF_ICON } from './Home'
import { Gallery } from '../Gallery'

const SIZE_TEXT = { starter: '4 chapters, about 12 tasks', standard: '6 chapters, about 24 tasks', pro: '8 chapters, about 40 tasks' } as const

export default function SkillPage() {
  const { id } = useParams()
  const cat = useCatalogue()
  const skill = cat?.skills.find((s) => s.id === id)
  const [picked, setPicked] = useState<number | null>(null)
  if (!cat) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  if (!skill) return <p className="rounded-3xl bg-cream-dim p-8 text-center">We do not teach that skill yet. <Link className="font-bold text-lime-700" to="/">See all skills</Link></p>
  const level = picked ?? 1
  const Icon = PROOF_ICON[skill.proof]
  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm font-bold text-ink-soft hover:text-ink">← All skills</Link>
      <section className="grid gap-6 rounded-4xl bg-white p-5 shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:p-8">
        <Gallery skill={skill} />
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">{skill.group}</p>
            <h1 className="mt-1 text-4xl font-extrabold">{skill.name}</h1>
            <p className="mt-1 text-ink-soft">For {skill.ages.map((a) => AGE_LABEL[a]).join(', ').toLowerCase()}.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-cream p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-100 text-lime-700"><Icon size={18} /></span>
            <p className="text-sm"><b>How your work is checked:</b> {PROOF_LABEL[skill.proof].toLowerCase()} ({skill.handIn.toLowerCase()}). The AI marks it against your workbook's own checklist and tells you exactly what to fix.</p>
          </div>
          <ul className="grid gap-2 text-sm">
            {[
              'A workbook written for you: your goal, your level, your language (English, Hindi or Hinglish)',
              'Help on every task: ask our AI teacher, or copy a ready prompt into your own ChatGPT, Gemini or Claude',
              'Scan the QR on your printed workbook to hand in pages, and check a single page any time',
              'Pass and get a skill badge you can share. Not yet? A free fix-up workbook for just the gaps',
            ].map((x) => (
              <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-lime-600" />{x}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">Choose your workbook</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {cat.levels.map((l) => {
            const on = l.n === level
            const sample = skill.samples?.[l.n - 1]
            return (
              <div key={l.n} className={`flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-card ${on ? 'ring-2 ring-lime-500' : 'ring-1 ring-ink/5'}`}>
                <button type="button" onClick={() => setPicked(l.n)} aria-pressed={on} className="flex flex-col gap-2 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl font-extrabold">{l.name}</span>
                    {on && <span className="rounded-full bg-lime-500 px-2.5 py-0.5 text-xs font-bold text-white">Selected</span>}
                  </span>
                  <span className="text-sm text-ink-soft">{l.about}</span>
                  <span className="font-display text-4xl font-extrabold">₹{skill.prices[l.n - 1].price}</span>
                  <span className="text-xs text-ink-soft">{SIZE_TEXT[l.size]} · {cat.questions[l.size]} questions to our AI teacher · unlimited help from your own AI</span>
                </button>
                {sample && (
                  <a href={`${BASE}api/samples/${skill.id}/${l.n}.pdf`} target="_blank" rel="noreferrer" className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-lime-700 hover:underline">
                    <FileText size={15} /> See a sample {l.name} workbook
                  </a>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-sm text-ink-soft">
          Your own workbook is written for you after a short chat; the samples show the kind of pages you get. You pay once for a level. Of the {cat.levels[level - 1].name} price, about ₹{skill.prices[level - 1].ai} is what the AI costs us; the rest keeps GrowthGoal running.
        </p>
        <Link to={`/start/${skill.id}?level=${level}`} className="inline-flex w-fit items-center gap-2 rounded-2xl bg-lime-500 px-6 py-4 font-bold text-white shadow-card hover:bg-lime-600">
          Start {cat.levels[level - 1].name} with the AI teacher <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
