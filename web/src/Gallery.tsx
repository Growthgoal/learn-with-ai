import { useState } from 'react'
import { BASE, Skill } from './api'

/** The pictures that explain Learn with AI, the same on every skill. */
export const HOW_IT_WORKS = [
  { file: 'how-it-works.png', alt: 'How Learn with AI works, in five steps' },
  { file: 'step-workbook.png', alt: 'Chat with the AI teacher, then get your own workbook with a QR code' },
  { file: 'step-stuck.png', alt: 'Stuck on a task? Ask our AI teacher or paste the ready prompt into your own AI' },
  { file: 'step-hand-in.png', alt: 'Scan the QR on your workbook to hand in photos, files or recordings' },
  { file: 'step-badge.png', alt: 'Pass the check and earn a skill badge, or get a free fix-up workbook' },
]

/** A skill's listing pictures: its own cover first, then how learning with us works. */
export function Gallery({ skill }: { skill: Skill }) {
  const images = [
    ...(skill.cover ? [{ src: `${BASE}api/skills/${skill.id}/cover`, alt: `${skill.name} with Learn with AI` }] : []),
    ...HOW_IT_WORKS.map((i) => ({ src: `${BASE}listing/${i.file}`, alt: i.alt })),
  ]
  const [shown, setShown] = useState(0)
  const main = images[Math.min(shown, images.length - 1)]
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <img src={main.src} alt={main.alt} className="aspect-square w-full rounded-3xl bg-cream object-cover" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((im, i) => (
          <button
            key={im.src}
            onClick={() => setShown(i)}
            aria-label={`Show picture ${i + 1}`}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ${i === shown ? 'ring-lime-500' : 'ring-transparent'}`}
          >
            <img src={im.src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}
