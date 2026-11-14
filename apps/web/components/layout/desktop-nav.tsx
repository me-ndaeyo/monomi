"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import Wordmark from "@/components/ui/wordmark"
import { WORKER_TABS } from "@/config/routes"
import { useWallet } from "@/hooks/use-wallet"

/** Worker navigation on desktop; phones use the floating tab bar instead. */
export default function DesktopNav() {
  const pathname = usePathname()
  const wallet = useWallet()
  return (
    <header className="hidden h-16 items-center justify-between border-b border-card-line bg-ink px-6 md:flex">
      <Wordmark />
      <nav aria-label="App" className="flex gap-1">
        {WORKER_TABS.map((tab) => {
          const active = pathname.startsWith(tab.url)
          return (
            <Link key={tab.url} href={tab.url} aria-current={active ? "page" : undefined} className={`rounded-full px-4 py-2 text-[14px] no-underline ${active ? "bg-kola font-bold text-ink" : "text-soft hover:text-bone"}`}>
              {tab.name}
            </Link>
          )
        })}
      </nav>
      <span className="min-w-[160px] text-right font-mono text-[13px] text-soft">{wallet.accountId ?? ""}</span>
    </header>
  )
}
