import Link from "next/link"

import { FOOTER_LINKS } from "@/config/routes"

const CITIES = "Lagos · Ogbomosho · Enugu · Kano · Ibadan · Accra · Nairobi · Kigali · "

export default function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div aria-hidden="true" className="overflow-hidden py-8">
        <div className="m-marquee display flex w-max whitespace-nowrap text-[56px] text-ink-3 md:text-[120px]">
          <span>{CITIES}</span>
          <span>{CITIES}</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 pb-10 text-[14px]">
        <span className="text-soft">monomi · Built on NEAR</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          {FOOTER_LINKS.map((l) => <Link key={l.url} href={l.url} className="text-bone no-underline hover:text-kola">{l.name}</Link>)}
        </nav>
      </div>
    </footer>
  )
}
