"use client"

import Link from "next/link"
import { useState } from "react"

import Wordmark from "@/components/ui/wordmark"
import { FOOTER_LINKS, LANDING_NAV } from "@/config/routes"

export default function LandingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5">
      <Wordmark />
      <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] md:flex">
        {LANDING_NAV.map((l) => <Link key={l.url} href={l.url} className="text-bone no-underline hover:text-kola">{l.name}</Link>)}
        <Link href="/try" className="m-btn rounded-full bg-kola px-5 py-3 font-semibold text-ink no-underline">Try it where you are</Link>
      </nav>
      <div className="flex items-center gap-1.5 md:hidden">
        <Link href="/try" className="rounded-full bg-kola px-3.5 py-2.5 text-[14px] font-semibold text-ink no-underline">Try it</Link>
        <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 6h12M3 12h12" stroke="#EFEBE2" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-6" onClick={() => setOpen(false)}>
          <button type="button" aria-label="Close menu" className="self-end text-[15px] text-soft">Close</button>
          <nav className="mt-8 flex flex-col gap-5 text-[24px]">
            {[...LANDING_NAV, ...FOOTER_LINKS.filter((f) => f.url !== "/docs")].map((l) => (
              <Link key={l.url + l.name} href={l.url} className="display text-bone no-underline">{l.name}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
