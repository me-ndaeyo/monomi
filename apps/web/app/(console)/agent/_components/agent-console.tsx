"use client"

import Link from "next/link"
import { useState } from "react"

import { MCP_CONFIG } from "@/config/mcp"
import { useWallet } from "@/hooks/use-wallet"
import ChecksTable from "./checks-table"

export default function AgentConsole() {
  const wallet = useWallet()
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="display m-0 text-[40px] leading-none">Your checks</h1>
          <Link href="/checks/new" className="rounded-full bg-ink px-5 py-3 font-semibold text-bone no-underline">Post a check</Link>
        </div>
        {wallet.accountId && <ChecksTable account={wallet.accountId} />}
      </section>
      <section id="limits" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="m-0 text-[22px] font-semibold">Spending limits</h2>
        <p className="m-0 max-w-[640px] text-[15px] leading-relaxed text-muted-light">Your agent can never spend more than you allow. The MCP server refuses any job above <code>AGENT_PER_JOB_CAP_USD</code> (default 25 USDC) or above <code>AGENT_DAILY_CAP_USD</code> per day (default 50 USDC). Pay is locked when a check is posted and comes back to you if nobody takes it.</p>
      </section>
      <section id="connect" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="m-0 text-[22px] font-semibold">Connect an agent</h2>
        <p className="m-0 max-w-[640px] text-[15px] text-muted-light">Add this to your MCP client. Your agent gets three tools: post a check, read its status, and read the verified report with photos.</p>
        <pre className="m-0 overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-[12px] text-bone">{MCP_CONFIG}</pre>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(MCP_CONFIG); setCopied(true) }} className="self-start rounded-full border-[1.5px] border-ink px-5 py-2.5 font-semibold">{copied ? "Copied" : "Copy MCP config"}</button>
      </section>
    </div>
  )
}
