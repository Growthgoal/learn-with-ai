import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { AGE_LABEL, PROOF_LABEL, Size } from '../api'
import { useCatalogue } from '../useCatalogue'
import { PROOF_ICON } from './Home'

const SIZE_TEXT: Record<Size, { name: string; for: string; pages: string }> = {
  starter: { name: 'Starter', for: 'Young children, or a first small step', pages: '4 chapters, about 12 tasks' },
  standard: { name: 'Standard', for: 'Most learners and most skills', pages: '6 chapters, about 24 tasks' },
  pro: { name: 'Pro', for: 'Career and tech goals, deeper practice', pages: '8 chapters, about 40 tasks' },
}

export default function SkillPage() {
  const { id } = useParams()
  const cat = useCatalogue()
  const skill = cat?.skills.find((s) => s.id === id)
  if (!cat) return <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
  if (!skill) return <p className="rounded-3xl bg-cream-dim p-8 text-center">We do not teach that skill yet. <Link className="font-bold text-lime-700" to="/">See all skills</Link></p>
  const Icon = PROOF_ICON[skill.proof]
  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm font-bold text-ink-soft hover:text-ink">← All skills</Link>
      <section className="rounded-4xl bg-white p-6 shadow-card lg:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">{skill.group}</p>
        <h1 className="mt-1 text-4xl font-extrabold">{skill.name}</h1>
        <p className="mt-2 text-ink-soft">For {skill.ages.map((a) => AGE_LABEL[a]).join(', ').toLowerCase()}.</p>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cream p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-100 text-lime-700"><Icon size={18} /></span>
          <p className="text-sm"><b>How your work is checked:</b> {PROOF_LABEL[skill.proof].toLowerCase()} ({skill.handIn.toLowerCase()}). The AI marks it against your workbook's own checklist and tells you exactly what to fix.</p>
        </div>
        <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          {[
            'A workbook written for you: your goal, your level, your language (English, Hindi or Hinglish)',
            'Help on every task: ask our AI teacher, or copy a ready prompt into your own ChatGPT, Gemini or Claude',
            'Hand in anytime; check a single page while you work',
            'Pass and get a skill badge you can share. Not yet? A free fix-up workbook for just the gaps',
          ].map((x) => (
            <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-lime-600" />{x}</li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {(Object.keys(SIZE_TEXT) as Size[]).map((size) => (
          <div key={size} className={`flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-card ${size === 'standard' ? 'ring-2 ring-lime-500' : ''}`}>
            <p className="font-display text-xl font-extrabold">{SIZE_TEXT[size].name}</p>
            <p className="text-sm text-ink-soft">{SIZE_TEXT[size].for}</p>
            <p className="font-display text-4xl font-extrabold">₹{cat.prices[size].price}<span className="text-sm font-semibold text-ink-soft"> a level</span></p>
            <p className="text-xs text-ink-soft">{SIZE_TEXT[size].pages} · {cat.questions[size]} questions to our AI teacher · unlimited help from your own AI</p>
          </div>
        ))}
      </section>
      <p className="text-sm text-ink-soft">The AI teacher suggests the size that fits after your chat. You pay once per level: about ₹{cat.prices.standard.ai} of it is what the AI costs us, and the rest keeps GrowthGoal running.</p>
      <Link to={`/start/${skill.id}`} className="inline-flex w-fit items-center gap-2 rounded-2xl bg-lime-500 px-6 py-4 font-bold text-white shadow-card hover:bg-lime-600">
        Start with the AI teacher <ArrowRight size={18} />
      </Link>
    </div>
  )
}
