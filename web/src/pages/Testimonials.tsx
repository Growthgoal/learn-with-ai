import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquareHeart, Star } from 'lucide-react'
import { AGE_LABEL, api, iconUrl, Testimonial } from '../api'
import { useCatalogue } from '../useCatalogue'

/**
 * What learners say. Every review comes from a real workbook: only the page of
 * a workbook can send one, and GrowthGoal reads each before it shows here.
 * First names and age groups only.
 */
export default function Testimonials() {
  const cat = useCatalogue()
  const [list, setList] = useState<Testimonial[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ reviews: Testimonial[] }>('/testimonials')
      .then((r) => setList(r.reviews))
      .catch((e) => setError(e.message))
  }, [])

  const icon = (id: string) => cat?.skills.find((s) => s.id === id)?.icon

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <section className="rounded-4xl bg-white p-6 shadow-card lg:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sun-400"><MessageSquareHeart size={28} /></span>
          <div>
            <h1 className="text-3xl font-extrabold">What learners say</h1>
            <p className="text-ink-soft">
              Every review here comes from a real workbook. Only the learner, or the parent beside a young learner, can write one, from their own
              workbook page. We show first names and age groups only.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</p>
      ) : !list ? (
        <div className="h-60 animate-pulse rounded-3xl bg-white/60" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-4xl bg-white p-10 text-center shadow-card">
          <p className="font-display text-xl font-extrabold">The first reviews are on their way</p>
          <p className="max-w-lg text-ink-soft">
            Learn with AI has just opened, and its first learners are working through their workbooks now. Made one? Open it from Your workbooks on the
            home page and tell us how it went, at the bottom of the page.
          </p>
          <Link to="/" className="rounded-2xl bg-lime-500 px-5 py-3 font-bold text-white">Pick a skill</Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => <ReviewCard key={`${r.at}-${r.name}`} r={r} icon={icon(r.skillId)} />)}
        </div>
      )}
    </div>
  )
}

export function ReviewCard({ r, icon }: { r: Testimonial; icon?: string }) {
  return (
    <figure className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-card">
      <p className="flex gap-0.5" aria-label={`${r.stars} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} className={n <= r.stars ? 'fill-sun-400 text-sun-400' : 'text-ink/15'} />)}
      </p>
      <blockquote className="whitespace-pre-line">“{r.text}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 border-t border-ink/5 pt-3">
        {icon && <img src={iconUrl(icon)} alt="" className="h-8 w-8 shrink-0" />}
        <span className="min-w-0">
          <span className="block font-bold">{r.by === 'parent' ? `${r.name}'s parent` : r.name} · {AGE_LABEL[r.ageBand]}</span>
          <span className="block text-xs text-ink-soft">
            <Link to={`/skill/${r.skillId}`} className="underline-offset-2 hover:underline">{r.skillName}</Link> · {r.level} · {r.badge ? 'earned the badge' : 'made a workbook'}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
