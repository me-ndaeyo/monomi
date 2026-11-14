"use client"

import Link from "next/link"

import { useWorker } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"

const UNLOCK_STEP = 5
const RULES = [
  "Stay on public ground. Don't enter private property unless you are invited.",
  "Photograph places, not people. Photos where a person is the main subject are rejected.",
  "If it feels unsafe, leave. You can drop a job at any time.",
]

export default function MePage() {
  const wallet = useWallet()
  const worker = useWorker(wallet.accountId)
  if (!wallet.accountId)
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="display m-0 text-[34px] leading-none">Your account</h1>
        <p className="m-0 text-[15px] text-muted-light">Your NEAR wallet is your Monomi account. We never ask for a name or phone number.</p>
        <button type="button" onClick={wallet.connect} className="rounded-full bg-ink px-6 py-3.5 font-semibold text-bone">Connect wallet</button>
      </div>
    )
  const done = worker.data?.approved ?? 0
  const next = Math.ceil((done + 1) / UNLOCK_STEP) * UNLOCK_STEP
  return (
    <div className="flex flex-col gap-5 px-4 pt-8">
      <h1 className="display m-0 text-[34px] leading-none">Me</h1>
      <div className="flex flex-col gap-1 rounded-[20px] bg-ink p-5 text-bone">
        <span className="text-[13px] text-muted">Signed in as</span>
        <span className="break-all font-mono text-[15px]">{wallet.accountId}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-card-line bg-white p-4"><span className="display text-[32px]">{done}</span><p className="m-0 text-[13px] text-muted-light">jobs done</p></div>
        <div className="rounded-[18px] border border-card-line bg-white p-4"><span className="display text-[32px]">{worker.data?.rejected ?? 0}</span><p className="m-0 text-[13px] text-muted-light">not passed</p></div>
      </div>
      <div className="flex flex-col gap-2 rounded-[18px] border border-card-line bg-white p-4">
        <span className="text-[15px] font-semibold">{next - done} more {next - done === 1 ? "job" : "jobs"} until jobs that need {next}</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-ink" style={{ width: `${((done % UNLOCK_STEP) / UNLOCK_STEP) * 100}%` }} /></div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted-light">SAFETY RULES</span>
        {RULES.map((r) => <p key={r} className="m-0 rounded-2xl bg-white px-4 py-3 text-[14px] leading-snug">{r}</p>)}
      </div>
      <div className="flex gap-3">
        <Link href="/faucet" className="flex-1 rounded-2xl border-[1.5px] border-ink py-3 text-center text-[15px] font-semibold text-ink no-underline">Get test USDC</Link>
        <button type="button" onClick={() => void wallet.disconnect()} className="flex-1 rounded-2xl border-[1.5px] border-fail-light py-3 text-[15px] font-semibold text-fail-light">Sign out</button>
      </div>
    </div>
  )
}
