import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, FileUp, Keyboard, Mic, Search, Sparkles, Hammer } from 'lucide-react'
import { Age, AGE_LABEL, Proof, PROOF_LABEL } from '../api'
import { useCatalogue } from '../useCatalogue'

export const PROOF_ICON: Record<Proof, typeof Camera> = { pages: Camera, file: FileUp, result: Hammer, typed: Keyboard, voice: Mic }

export default function Home() {
  const cat = useCatalogue()
  const [q, setQ] = useState('')
  const [age, setAge] = useState<Age | null>(null)
  const list = useMemo(
    () =>
      (cat?.skills ?? []).filter(
        (s) => (!age || s.ages.includes(age)) && (!q || `${s.name} ${s.group} ${s.handIn}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, q, age],
  )
  const groups = [...new Set(list.map((s) => s.group))]
  const from = cat ? Math.min(...Object.values(cat.prices).map((p) => p.price)) : null

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 rounded-4xl bg-white p-6 shadow-card lg:grid-cols-[1.4fr_1fr] lg:p-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">A patient teacher for every skill</p>
          <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">
            Learn anything with an AI teacher that never gets tired of explaining.
          </h1>
          <p className="text-lg text-ink-soft">
            Tell it who you are. It writes a workbook just for you, helps whenever you are stuck, checks your finished work, and gives you a
            skill badge when you can really do it.
          </p>
          <p className="text-sm font-bold text-ink">
            {cat ? `${cat.skills.length} skills · for ages 3 to 80+ · ` : ''}
            {from ? `from ₹${from} a level, paid once` : ''}
          </p>
        </div>
        <ol className="grid gap-2 self-center">
          {[
            ['Chat for 3 minutes', 'Your goal, your level, your language.'],
            ['Get your workbook', 'Written for you, as a PDF and online.'],
            ['Stuck? Ask', 'Our AI teacher, or the ready prompt in your own ChatGPT, Gemini or Claude.'],
            ['Hand it in', 'A photo, a file or a recording.'],
            ['Earn the badge', 'Or a free fix-up workbook for the gaps.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-cream p-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sun-400 font-display text-sm font-extrabold">{i + 1}</span>
              <span className="text-sm"><b>{t}.</b> {d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-extrabold">What do you want to learn?</h2>
          <label className="relative block w-full lg:w-96">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try excel, cursive, spoken English"
              className="w-full rounded-2xl border-2 border-ink/80 bg-white py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-ink/10"
            />
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[null, ...(Object.keys(AGE_LABEL) as Age[])].map((a) => (
            <button
              key={a ?? 'all'}
              onClick={() => setAge(a)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${age === a ? 'bg-lime-500 text-white' : 'bg-cream-dim text-ink-soft hover:bg-lime-100'}`}
            >
              {a ? AGE_LABEL[a] : 'All ages'}
            </button>
          ))}
        </div>
        {!cat ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/60" />
        ) : list.length === 0 ? (
          <p className="rounded-3xl bg-cream-dim p-8 text-center text-ink-soft">No skill matches that yet. Try a shorter word.</p>
        ) : (
          groups.map((g) => (
            <div key={g} className="flex flex-col gap-2">
              <h3 className="text-lg font-bold">{g}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list
                  .filter((s) => s.group === g)
                  .map((s) => {
                    const Icon = PROOF_ICON[s.proof]
                    return (
                      <Link
                        key={s.id}
                        to={`/skill/${s.id}`}
                        className="group flex items-start gap-3 rounded-2xl border border-ink/5 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-card"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-100 text-lime-700"><Icon size={18} /></span>
                        <span className="min-w-0">
                          <span className="block font-bold leading-tight group-hover:text-lime-700">{s.name}</span>
                          <span className="block text-xs text-ink-faint">{s.ages.map((a) => AGE_LABEL[a]).join(' · ')}</span>
                          <span className="mt-0.5 block text-xs text-ink-soft">{PROOF_LABEL[s.proof]}: {s.handIn.toLowerCase()}</span>
                        </span>
                        {s.weSell && <Sparkles size={14} className="ml-auto shrink-0 text-sun-500" aria-label="GrowthGoal favourite" />}
                      </Link>
                    )
                  })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
