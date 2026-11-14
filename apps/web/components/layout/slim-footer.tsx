import Link from "next/link"

import Wordmark from "@/components/ui/wordmark"
import { FOOTER_LINKS } from "@/config/routes"

export default function SlimFooter({ tone }: Readonly<{ tone: "light" | "dark" }>) {
  return (
    <footer className={`mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[14px] ${tone === "light" ? "text-bone" : "text-ink"}`}>
      <Wordmark tone={tone} />
      <nav className="flex flex-wrap gap-5">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.url} href={l.url} className="no-underline opacity-80 hover:opacity-100" style={{ color: "inherit" }}>{l.name}</Link>
        ))}
      </nav>
    </footer>
  )
}
