import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Award, Bot, ChevronLeft, ChevronRight, Crown, FileText, Gem, Mic, QrCode, Sparkles, Sprout, TrendingUp } from 'lucide-react'
import { AGE_LABEL, BASE, PROOF_LABEL, Skill, iconUrl } from '../api'
import { useCatalogue } from '../useCatalogue'
import { opener, useProgress } from '../progress'
import { HOW_IT_WORKS } from '../Gallery'

/**
 * One skill, laid out like a GrowthGoal product page: pictures on the left;
 * name, price and the choice of workbook on the right; then look inside,
 * more like this, and what learning it here involves.
 */

const LEVEL_ICON = [Sprout, TrendingUp, Award, Gem, Crown]
const SIZE_TEXT = { starter: '4 chapters · about 12 tasks', standard: '6 chapters · about 24 tasks', pro: '8 chapters · about 40 tasks' } as const

function Pictures({ skill }: { skill: Skill }) {
  const images = [
    ...(skill.cover ? [{ src: `${BASE}api/skills/${skill.id}/cover`, alt: `${skill.name} with Learn with AI` }] : []),
    ...HOW_IT_WORKS.map((i) => ({ src: `${BASE}listing/${i.file}`, alt: i.alt })),
  ]
  const [shown, setShown] = useState(0)
  const step = (d: number) => setShown((i) => (i + d + images.length) % images.length)
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative overflow-hidden rounded-4xl bg-white shadow-card">
        <img src={images[shown].src} alt={images[shown].alt} className="aspect-square w-full object-cover" />
        <button onClick={() => step(-1)} aria-label="Previous picture" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card"><ChevronLeft size={18} /></button>
        <button onClick={() => step(1)} aria-label="Next picture" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card"><ChevronRight size={18} /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((im, i) => (
          <button key={im.src} onClick={() => setShown(i)} aria-label={`Show picture ${i + 1}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white ring-2 lg:h-20 lg:w-20 ${i === shown ? 'ring-lime-500' : 'ring-transparent'}`}>
            <img src={im.src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SkillPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cat = useCatalogue()
  const skill = cat?.skills.find((s) => s.id === id)
  const [level, setLevel] = useState(1)
  const earned = useProgress()
  const [showBar, setShowBar] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setLevel(1), [id])

  if (!cat) return <div className="h-96 animate-pulse rounded-4xl bg-white/60" />
  if (!skill) return <p className="rounded-3xl bg-cream-dim p-8 text-center">We do not teach that skill yet. <Link className="font-bold text-lime-700" to="/">See all skills</Link></p>

  const lv = cat.levels[level - 1]
  const price = skill.prices[level - 1]
  // A later level is a step up from the one before: it opens with that level's badge.
  const locked = level > 1 && !opener(earned, skill.id, level)
  const prevName = cat.levels[level - 2]?.name
  const start = `/start/${skill.id}?level=${locked ? 1 : level}`
  const samplePdf = skill.samples[level - 1] ? `${BASE}api/samples/${skill.id}/${level}.pdf` : null
  const pages = Array.from({ length: skill.samplePages?.[level - 1] ?? 0 }, (_, i) => i + 1)
  const more = cat.skills.filter((s) => s.group === skill.group && s.id !== skill.id).slice(0, 8)
  const ages = skill.ages.map((a) => AGE_LABEL[a]).join(', ')

  return (
    <div className="flex flex-col gap-10 pb-24">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"><ChevronLeft size={18} /></button>
          <Pictures skill={skill} />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:pt-14">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-800">{skill.group}</span>
            <span className="flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white"><Bot size={12} /> AI teacher</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight lg:text-4xl">{skill.name}</h1>
          <p className="text-ink-soft">
            For {ages.toLowerCase()} · English, हिंदी or Hinglish · {PROOF_LABEL[skill.proof].toLowerCase()} · skill badge
          </p>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold">₹{price.price}</span>
            <span className="text-sm font-semibold text-ink-soft">{lv.name} · pay once, no subscription</span>
          </div>

          <div>
            <p className="mb-2 font-bold">Your level</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {cat.levels.map((l) => {
                const Icon = LEVEL_ICON[l.n - 1]
                const on = l.n === level
                return (
                  <button
                    key={l.n}
                    type="button"
                    onClick={() => setLevel(l.n)}
                    aria-pressed={on}
                    className={`flex flex-col gap-2 rounded-3xl bg-white p-4 text-left transition ${on ? 'ring-2 ring-lime-500 shadow-card' : 'ring-1 ring-ink/10 hover:ring-lime-300'}`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? 'bg-lime-500 text-white' : 'bg-cream-dim text-lime-700'}`}><Icon size={18} /></span>
                    <span className="font-bold">{l.name}</span>
                    {l.n > 1 && (
                      <span className={`self-start rounded-full px-2 py-0.5 text-xs font-bold ${opener(earned, skill.id, l.n) ? 'bg-lime-100 text-lime-800' : 'bg-cream-dim text-ink-soft'}`}>
                        {opener(earned, skill.id, l.n) ? '✓ Unlocked' : `🔒 After the ${cat.levels[l.n - 2].name} badge`}
                      </span>
                    )}
                    <span className="text-sm leading-snug text-ink-soft">{l.about}</span>
                    <span className="mt-auto text-xs text-ink-faint">{SIZE_TEXT[l.size]}</span>
                    <span className="font-display text-lg font-extrabold">₹{skill.prices[l.n - 1].price}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {samplePdf ? (
              <a href={samplePdf} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold shadow-card ring-1 ring-ink/10 hover:ring-lime-400">
                <FileText size={18} /> See a sample {lv.name}
              </a>
            ) : (
              <span />
            )}
            <Link to={start} className="flex items-center justify-center gap-2 rounded-2xl bg-sun-400 px-5 py-4 font-bold text-ink shadow-[0_5px_0_0_#A16207] hover:bg-sun-300">
              <Sparkles size={18} /> {locked ? 'Start with Basic' : 'Start with the AI teacher'}
            </Link>
          </div>
          {locked && (
            <p className="rounded-2xl bg-cream-dim p-3 text-sm text-ink-soft">
              <b>{lv.name}</b> opens once you have the <b>{prevName}</b> badge in {skill.name}: finish that workbook, hand it in, and pass the check. Then your
              {' '}{lv.name} workbook is written from your checked work, to polish what needs it and take you a level higher.
            </p>
          )}

          <ul className="flex flex-col gap-2.5 rounded-3xl bg-white p-5 text-sm shadow-card">
            <li className="flex gap-3"><Bot size={18} className="shrink-0 text-lime-600" />Written for you from a short form made for this skill: your goal, your own situation, your language{cat.payments ? '' : '. Free while the hackathon runs.'}</li>
            <li className="flex gap-3"><Sparkles size={18} className="shrink-0 text-lime-600" />{cat.questions[lv.size]} questions to our AI teacher, and unlimited help from your own ChatGPT, Gemini or Claude</li>
            <li className="flex gap-3"><QrCode size={18} className="shrink-0 text-lime-600" />Scan the QR on your workbook to hand in: {skill.handIn.toLowerCase()}</li>
            <li className="flex gap-3"><Award size={18} className="shrink-0 text-lime-600" />Pass for a skill badge; not yet, and you get a free fix-up workbook</li>
          </ul>
        </div>
      </div>

      {pages.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Look inside</h2>
            <p className="text-sm text-ink-soft">A sample {lv.name} workbook. Yours is written for you.</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pages.map((p) => (
              <a key={p} href={samplePdf ?? '#'} target="_blank" rel="noreferrer" className="relative w-44 shrink-0 overflow-hidden rounded-2xl bg-white shadow-card lg:w-52">
                <img src={`${BASE}api/samples/${skill.id}/${level}/p${p}.jpg`} alt={`Sample page ${p}`} loading="lazy" className="aspect-[1/1.414] w-full object-cover object-top" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="-rotate-[30deg] font-display text-2xl font-extrabold text-ink/10">Learn with AI sample</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">More like this</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {more.map((s) => (
              <Link key={s.id} to={`/skill/${s.id}`} className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-card lg:w-52">
                <span className="grid aspect-square place-items-center bg-cream-dim">
                  {s.cover ? <img src={`${BASE}api/skills/${s.id}/cover`} alt="" loading="lazy" className="h-full w-full object-cover" /> : <img src={iconUrl(s.icon)} alt="" loading="lazy" className="h-1/2 w-1/2" />}
                </span>
                <span className="flex flex-1 flex-col gap-0.5 p-3">
                  <span className="line-clamp-2 font-display text-sm font-bold leading-tight group-hover:text-lime-700">{s.name}</span>
                  <span className="mt-auto pt-1 text-sm font-extrabold text-lime-700">From ₹{s.prices[0].price}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="text-2xl font-extrabold">About this skill</h2>
          <p className="mt-2 text-ink-soft">
            {skill.name}, for {ages.toLowerCase()}. Five levels, one after another, take you from your first real result to mastering it: Basic, then
            Advanced, Pro, Expert and Master, each opening once you have the badge of the level before. Each is written for you, in English, Hindi or
            Hinglish, from your own situation, and each level starts from your checked work in the one before.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {cat.levels.map((l) => (
              <li key={l.n}><b>{l.name}:</b> {l.about} {SIZE_TEXT[l.size]}. ₹{skill.prices[l.n - 1].price}.</li>
            ))}
          </ul>
        </div>
        <div className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="text-2xl font-extrabold">How you learn it</h2>
          <ol className="mt-3 flex flex-col gap-2.5 text-sm">
            {[
              ['Fill a short form', 'Questions made for this skill: your goal, your own situation, your language.'],
              ['Get your workbook', 'As a PDF to print and online, with a QR code on every page.'],
              ['Stuck? Ask', 'Our AI teacher explains as often as you need, or paste the ready prompt into your own AI.'],
              ['Hand in', `${PROOF_LABEL[skill.proof]}: scan the QR, then send it. Check one page any time.`],
              ['Earn your badge', 'Or get a free fix-up workbook for the parts that need more practice.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sun-400 font-display text-sm font-extrabold">{i + 1}</span>
                <span><b>{t}.</b> {d}</span>
              </li>
            ))}
          </ol>
          {skill.proof === 'voice' && <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft"><Mic size={15} /> You record yourself speaking in the browser or on your phone.</p>}
        </div>
      </section>

      {/* The same bar a GrowthGoal product page keeps at the bottom once you scroll. */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            {skill.cover && <img src={`${BASE}api/skills/${skill.id}/cover`} alt="" className="hidden h-12 w-12 rounded-xl object-cover sm:block" />}
            <p className="hidden min-w-0 flex-1 truncate font-display font-bold sm:block">{skill.name} · {locked ? cat.levels[0].name : lv.name}</p>
            <span className="font-display text-xl font-extrabold">₹{locked ? skill.prices[0].price : price.price}</span>
            <Link to={start} className="ml-auto flex items-center gap-2 rounded-2xl bg-sun-400 px-5 py-3 font-bold text-ink shadow-[0_4px_0_0_#A16207] sm:ml-0">
              {locked ? 'Start with Basic' : 'Start'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
