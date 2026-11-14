"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import Wordmark from "@/components/ui/wordmark"
import { CONSOLE_NAV } from "@/config/routes"
import { useUsdcBalance } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"

export default function ConsoleSidebar() {
  const pathname = usePathname()
  const wallet = useWallet()
  const balance = useUsdcBalance(wallet.accountId)
  const [open, setOpen] = useState(false)
  return (
    <aside className="bg-ink text-bone md:sticky md:top-0 md:flex md:h-dvh md:w-[260px] md:shrink-0 md:flex-col md:p-6">
      <div className="flex items-center justify-between p-4 md:p-0">
        <Wordmark />
        <button type="button" className="text-[14px] text-soft md:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
      </div>
      <nav className={`${open ? "flex" : "hidden"} flex-col gap-1 px-4 pb-4 md:mt-10 md:flex md:p-0`}>
        {CONSOLE_NAV.map((l) => (
          <Link key={l.url} href={l.url} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-2.5 text-[15px] no-underline ${pathname === l.url ? "bg-ink-3 text-kola" : "text-soft hover:text-bone"}`}>{l.name}</Link>
        ))}
      </nav>
      <div className={`${open ? "block" : "hidden"} border-t border-line px-4 py-4 md:mt-auto md:block md:px-0`}>
        {wallet.accountId ? (
          <>
            <p className="m-0 break-all font-mono text-[13px]">{wallet.accountId}</p>
            <p className="m-0 text-[13px] text-muted">Balance {balance.data ? formatUsdc(balance.data) : "…"}</p>
          </>
        ) : (
          <button type="button" onClick={wallet.connect} className="w-full rounded-full bg-kola py-2.5 text-[14px] font-semibold text-ink">Connect wallet</button>
        )}
      </div>
    </aside>
  )
}
