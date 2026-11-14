"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import TabIcon from "@/components/layout/tab-icon"
import Wordmark from "@/components/ui/wordmark"
import { WORKER_TABS } from "@/config/routes"
import { isTabActive } from "./active-tab"
import { useUsdcBalance } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"

/** Worker navigation on desktop, pinned to the top; phones use the floating tab bar. */
export default function DesktopNav() {
  const pathname = usePathname()
  const wallet = useWallet()
  const balance = useUsdcBalance(wallet.accountId)
  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-line bg-ink/95 px-6 backdrop-blur md:flex">
      <Wordmark />
      <nav aria-label="App" className="flex gap-1 rounded-full bg-ink-2 p-1">
        {WORKER_TABS.map((tab) => {
          const active = isTabActive(tab.url, pathname)
          return (
            <Link key={tab.url} href={tab.url} aria-current={active ? "page" : undefined} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[14px] no-underline ${active ? "bg-kola font-semibold text-ink" : "text-soft hover:text-bone"}`}>
              <TabIcon name={tab.name} color={active ? "#0B0C0A" : "#9A9886"} />
              {tab.name}
            </Link>
          )
        })}
      </nav>
      {wallet.accountId ? (
        <Link href="/wallet" className="flex items-center gap-3 rounded-full border border-line py-1.5 pl-1.5 pr-4 text-bone no-underline hover:border-soft">
          <span className="display flex h-8 w-8 items-center justify-center rounded-full bg-bone text-[14px] text-ink">{wallet.accountId.charAt(0).toUpperCase()}</span>
          <span className="flex flex-col leading-tight">
            <span className="max-w-[180px] truncate font-mono text-[12px] text-soft">{wallet.accountId}</span>
            <span className="text-[13px] font-semibold">{balance.data ? formatUsdc(balance.data) : "…"}</span>
          </span>
        </Link>
      ) : (
        <button type="button" onClick={wallet.connect} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-bone">Connect wallet</button>
      )}
    </header>
  )
}
