import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import SkillPage from './pages/SkillPage'
import Start from './pages/Start'
import WorkbookPage from './pages/WorkbookPage'
import BadgePage from './pages/BadgePage'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold text-ink">Learn with AI</span>
            <span className="text-xs font-bold text-lime-700">by GrowthGoal</span>
          </Link>
          <a href="/" className="text-sm font-bold text-ink-soft hover:text-ink">← GrowthGoal shop</a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">{children}</main>
      <footer className="border-t border-ink/5 py-6 text-center text-xs text-ink-faint">
        Learn with AI by GrowthGoal · Built on the Meta Model API: Muse Spark, Muse Image, SAM 3.1 and Muse Voice Transcribe
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/learn">
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/skill/:id" element={<SkillPage />} />
          <Route path="/start/:id" element={<Start />} />
          <Route path="/w/:code" element={<WorkbookPage />} />
          <Route path="/badge/:id" element={<BadgePage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  </React.StrictMode>,
)
