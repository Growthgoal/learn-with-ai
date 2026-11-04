import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, FileUp, Keyboard, Mic, Search, Sparkles, Hammer, Wand2, X } from 'lucide-react'
import { Age, AGE_LABEL, api, BASE, Guide, iconUrl, Proof, Skill } from '../api'
import { useCatalogue } from '../useCatalogue'
import { search } from '../search'
import { useMyWorkbooks } from '../progress'

export const PROOF_ICON: Record<Proof, typeof Camera> = { pages: Camera, file: FileUp, result: Hammer, typed: Keyboard, voice: Mic }

/** How many skills a shelf shows before "Show all". */
const SHELF = 6

export default function Home() {
  const cat = useCatalogue()
  const [guides, setGuides] = useState<Guide[]>([])
  useEffect(() => {
    api<Guide[]>('/guides').then((g) => setGuides(g.filter((x) => x.en || x.hi))).catch(() => setGuides([]))
  }, [])
  const [q, setQ] = useState('')
  const [age, setAge] = useState<Age | null>(null)
  const [group, setGroup] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const skills = cat?.skills ?? []
  const forAge = useMemo(() => skills.filter((s) => !age || s.ages.includes(age)), [skills, age])
  const groups = useMemo(() => (cat?.groups ?? []).map((g) => g.name), [cat])
  const groupIcon = (g: string) => cat?.groups.find((x) => x.name === g)?.icon
  const found = useMemo(() => (q.trim() ? search(forAge, q) : forAge), [forAge, q])
  const list = group && !q.trim() ? found.filter((s) => s.group === group) : found
  const from = skills.length ? Math.min(...skills.map((s) => s.prices[0].price)) : null
  const toList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 rounded-4xl bg-white p-6 shadow-card lg:grid-cols-[1.4fr_1fr] lg:p-10">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">A patient teacher for every skill</p>
          <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">
            Learn anything with an AI teacher that never gets tired of explaining.
          </h1>
          <p className="text-lg text-ink-soft">
            Tell it who you are. It writes a workbook just for you, helps whenever you are stuck, checks your finished work, and gives you a
            skill badge when you can really do it.
          </p>
          <SkillSearch skills={skills} q={q} setQ={setQ} onSubmit={toList} />
          <p className="text-sm font-bold text-ink">
            {skills.length ? `${skills.length} skills, or any skill you name · for ages 3 to 80+ · ` : ''}
            {from ? `from ₹${from} a level, paid once` : ''}
          </p>
        </div>
        <ol className="grid gap-2 self-center">
          {[
            ['Fill a short form', 'Questions made for your skill: your goal, your level, your language.'],
            ['Get your workbook', 'Written for you, as a PDF and online.'],
            ['Stuck? Ask', 'Our AI teacher, or the ready prompt in your own ChatGPT, Gemini or Claude.'],
            ['Hand it in', 'Scan the QR code, then a photo, a file or a recording.'],
            ['Earn the badge', 'And skill points for the leaderboard. Not there yet? A free fix-up workbook for the gaps.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-cream p-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sun-400 font-display text-sm font-extrabold">{i + 1}</span>
              <span className="text-sm"><b>{t}.</b> {d}</span>
            </li>
          ))}
        </ol>
      </section>

      <YourWorkbooks skills={skills} />

      {guides.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">Start free: the basics of learning</h2>
            <p className="text-ink-soft">Short guides that make every other skill easier. Free to download and print, in English and हिंदी.</p>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {guides.map((g) => (
              <div key={g.slug} className="flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-card">
                {g.cover && <img src={`${BASE}api/guides/${g.slug}/cover`} alt="" loading="lazy" className="aspect-square w-full object-cover" />}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="font-display text-lg font-extrabold leading-tight">{g.title}</p>
                  <p className="text-sm text-ink-soft">{g.titleHi}</p>
                  <div className="mt-auto flex gap-2">
                    {g.en && <a href={`${BASE}api/guides/${g.slug}/en.pdf`} target="_blank" rel="noreferrer" className="rounded-xl bg-lime-500 px-3 py-1.5 text-sm font-bold text-white">English</a>}
                    {g.hi && <a href={`${BASE}api/guides/${g.slug}/hi.pdf`} target="_blank" rel="noreferrer" className="rounded-xl bg-lime-100 px-3 py-1.5 text-sm font-bold text-lime-800">हिंदी</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section ref={listRef} className="flex scroll-mt-20 flex-col gap-4">
        <h2 className="text-2xl font-extrabold">What do you want to learn?</h2>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Who is learning</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[null, ...(Object.keys(AGE_LABEL) as Age[])].map((a) => (
              <button
                key={a ?? 'all'}
                onClick={() => setAge(a)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${age === a ? 'bg-lime-500 text-white' : 'bg-cream-dim text-ink-soft hover:bg-lime-100'}`}
              >
                {a ? AGE_LABEL[a] : 'Everyone'}
                <span className="ml-1.5 text-xs opacity-70">{a ? skills.filter((s) => s.ages.includes(a)).length : skills.length}</span>
              </button>
            ))}
          </div>
        </div>
        {!q.trim() && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Topic</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[null, ...groups.filter((g) => forAge.some((s) => s.group === g))].map((g) => {
                const icon = g ? groupIcon(g) : null
                return (
                  <button
                    key={g ?? 'all'}
                    onClick={() => setGroup(g)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${group === g ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink-soft hover:border-ink/30'}`}
                  >
                    {icon && <img src={iconUrl(icon)} alt="" className="h-4 w-4" />}
                    {g ?? 'All topics'}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!cat ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/60" />
        ) : q.trim() ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold">
                {list.length ? `${list.length} skill${list.length === 1 ? '' : 's'} for “${q.trim()}”` : `Nothing listed for “${q.trim()}” yet`}
                {age ? ` · ${AGE_LABEL[age]}` : ''}
              </h3>
              <button onClick={() => setQ('')} className="shrink-0 text-sm font-bold text-ink-soft hover:text-ink">Clear</button>
            </div>
            {list.length > 0 && <Grid skills={list} />}
            <AskAnySkill q={q.trim()} strong={list.length === 0} />
          </div>
        ) : (
          <>
            {groups
              .filter((g) => (!group || g === group) && list.some((s) => s.group === g))
              .map((g) => {
                const shelf = list.filter((s) => s.group === g)
                const all = open.has(g) || !!group || shelf.length <= SHELF + 1
                return (
                  <div key={g} className="flex flex-col gap-2">
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      {groupIcon(g) && <img src={iconUrl(groupIcon(g)!)} alt="" className="h-6 w-6" />}
                      {g} <span className="text-sm font-semibold text-ink-faint">{shelf.length}</span>
                    </h3>
                    <Grid skills={all ? shelf : shelf.slice(0, SHELF)} />
                    {!all && (
                      <button
                        onClick={() => setOpen(new Set([...open, g]))}
                        className="self-start rounded-full bg-cream-dim px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-lime-100"
                      >
                        Show all {shelf.length} in {g}
                      </button>
                    )}
                  </div>
                )
              })}
            <AskAnySkill q="" />
          </>
        )}
      </section>
    </div>
  )
}

function Grid({ skills }: { skills: Skill[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((s) => (
        <Link
          key={s.id}
          to={`/skill/${s.id}`}
          className="group flex min-w-0 items-center gap-3 rounded-2xl border border-ink/5 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream">
            <img src={iconUrl(s.icon)} alt="" loading="lazy" className="h-8 w-8" />
          </span>
          <span className="min-w-0">
            <span className="block font-bold leading-tight group-hover:text-lime-700">{s.name}</span>
            <span className="block truncate text-xs text-ink-faint">{s.ages.map((a) => AGE_LABEL[a]).join(' · ')}</span>
            <span className="mt-0.5 block text-xs font-bold text-ink-soft">from ₹{s.prices[0].price}</span>
          </span>
          {s.weSell && <Sparkles size={14} className="ml-auto shrink-0 self-start text-sun-500" aria-label="GrowthGoal favourite" />}
        </Link>
      ))}
    </div>
  )
}

/** The way out when we do not list a skill: the AI sets up any skill the learner names. */
/**
 * The workbooks made on this phone or computer. There is no sign-in: the code
 * on each workbook is the learner's ticket, and this is where they find it
 * again without the PDF to hand.
 */
function YourWorkbooks({ skills }: { skills: Skill[] }) {
  const mine = useMyWorkbooks()
  if (!mine?.length) return null
  const state = (w: (typeof mine)[number]) =>
    w.badgeId ? 'Badge earned' : w.status === 'writing' ? 'Being written' : w.status === 'failed' ? 'Could not be written' : 'Ready: hand it in when done'
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-extrabold">Your workbooks</h2>
        <p className="text-ink-soft">Made on this phone or computer. Open one to ask for help or hand in your work. The QR code on your workbook opens the same page.</p>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {mine.map((w) => {
          const icon = skills.find((s) => s.id === w.skillId)?.icon
          return (
            <Link key={w.code} to={`/w/${w.code}`} className="flex w-60 shrink-0 snap-start flex-col gap-2 rounded-3xl bg-white p-4 shadow-card hover:ring-2 hover:ring-lime-400">
              <span className="flex items-center gap-2">
                {icon && <img src={iconUrl(icon)} alt="" className="h-8 w-8" />}
                <span className="min-w-0">
                  <span className="block truncate font-display font-extrabold leading-tight">{w.skillName}</span>
                  <span className="block text-sm text-ink-soft">{w.level} · {w.name}</span>
                </span>
              </span>
              <span className={`mt-auto self-start rounded-full px-3 py-1 text-xs font-bold ${w.badgeId ? 'bg-sun-400' : w.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-lime-100 text-lime-800'}`}>{state(w)}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function AskAnySkill({ q, strong }: { q: string; strong?: boolean }) {
  return (
    <Link
      to={`/new${q ? `?skill=${encodeURIComponent(q)}` : ''}`}
      className={`flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5 ${strong ? 'bg-sun-400' : 'bg-lime-100'}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white"><Wand2 size={22} className="text-lime-700" /></span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-extrabold leading-tight">
          {q ? `Get a workbook for “${q}”` : 'Don’t see your skill? Name any skill.'}
        </span>
        <span className="block text-sm text-ink-soft">The AI teacher sets up its own form and writes your workbook, just like the skills listed here.</span>
      </span>
    </Link>
  )
}

/** The search box, with suggestions as you type, the way big shops do it. */
function SkillSearch({ skills, q, setQ, onSubmit }: { skills: Skill[]; q: string; setQ: (q: string) => void; onSubmit: () => void }) {
  const navigate = useNavigate()
  const [focus, setFocus] = useState(false)
  const [active, setActive] = useState(-1)
  const hits = useMemo(() => (q.trim() ? search(skills, q).slice(0, 6) : []), [skills, q])
  // The suggestions, then one last row: ask for this exact skill.
  const rows = q.trim() ? hits.length + 1 : 0
  const go = (i: number) => {
    if (i < hits.length) navigate(`/skill/${hits[i].id}`)
    else navigate(`/new?skill=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (active >= 0) return go(active)
          setFocus(false)
          onSubmit()
        }}
      >
        <label className="relative block">
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(-1)
            }}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(rows - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(-1, a - 1))
              } else if (e.key === 'Escape') setFocus(false)
            }}
            placeholder="Any skill: Excel, Japanese, public speaking, yoga…"
            aria-label="Search skills"
            className="w-full rounded-2xl border-2 border-ink/80 bg-white py-3.5 pl-12 pr-11 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-ink/10"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/50 hover:text-ink">
              <X size={18} />
            </button>
          )}
        </label>
      </form>
      {focus && rows > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-ink/10 bg-white py-1 shadow-card">
          {hits.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(i)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${active === i ? 'bg-cream' : 'hover:bg-cream'}`}
              >
                <img src={iconUrl(s.icon)} alt="" className="h-6 w-6 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                <span className="shrink-0 text-xs text-ink-faint">{s.group}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(hits.length)}
              className={`flex w-full items-center gap-3 border-t border-ink/5 px-4 py-2.5 text-left ${active === hits.length ? 'bg-lime-100' : 'hover:bg-lime-100'}`}
            >
              <Wand2 size={20} className="shrink-0 text-lime-700" />
              <span className="min-w-0 flex-1 truncate font-bold text-lime-800">Get a workbook for “{q.trim()}”</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
