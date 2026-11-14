"use client"

import { useState } from "react"

import { usdToBaseUnits } from "@/lib/format/usdc"

const CHAINS = [
  { key: "base", label: "Base" },
  { key: "arb", label: "Arbitrum" },
  { key: "sol", label: "Solana" },
  { key: "eth", label: "Ethereum" },
] as const

interface Quote {
  amountOutFormatted: string
  timeEstimate: number
  withdrawFee?: string
}

export default function CashOutForm({ maxUsd }: Readonly<{ maxUsd: number }>) {
  const [chain, setChain] = useState<(typeof CHAINS)[number]["key"]>("base")
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState(maxUsd > 0 ? maxUsd.toFixed(2) : "")
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getQuote = async () => {
    setError(null)
    setQuote(null)
    const usd = Number(amount)
    if (!Number.isFinite(usd) || usd <= 0) return setError("Enter an amount")
    if (usd > maxUsd) return setError("That's more than your balance")
    setIsLoading(true)
    const res = await fetch("/api/cashout/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chain, address: address.trim(), amount: usdToBaseUnits(usd) }) })
    const body = (await res.json()) as { data: Quote | null; error: string | null }
    setIsLoading(false)
    if (body.data) setQuote(body.data)
    else setError(body.error ?? "No quote right now")
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-card-line bg-white p-4">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted-light">CASH OUT TO ANY CHAIN</span>
      <div role="group" aria-label="Destination chain" className="grid grid-cols-4 gap-1 rounded-xl bg-sand p-1">
        {CHAINS.map((c) => (
          <button key={c.key} type="button" aria-pressed={chain === c.key} onClick={() => { setChain(c.key); setQuote(null) }} className={`h-9 rounded-[9px] text-[13px] ${chain === c.key ? "bg-white font-semibold" : ""}`}>{c.label}</button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-[13px] font-medium">Your address on {CHAINS.find((c) => c.key === chain)?.label}
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={chain === "sol" ? "Solana address" : "0x…"} className="h-12 rounded-xl border border-card-line bg-bone px-3 font-mono text-[14px]" />
      </label>
      <label className="flex flex-col gap-1 text-[13px] font-medium">Amount (USDC)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="h-12 rounded-xl border border-card-line bg-bone px-3 text-[16px]" />
      </label>
      <button type="button" onClick={() => void getQuote()} disabled={isLoading} className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-bone disabled:opacity-60">{isLoading ? "Getting a live quote…" : "See what I'd get"}</button>
      {error && <p role="alert" className="m-0 text-[14px] text-fail-light">{error}</p>}
      {quote && (
        <div className="rise-rows flex flex-col gap-1.5 rounded-2xl bg-bone p-3.5 text-[14px]">
          <span>You'd receive <strong>{quote.amountOutFormatted} USDC</strong> on {CHAINS.find((c) => c.key === chain)?.label}</span>
          <span className="text-muted-light">About {quote.timeEstimate} seconds{quote.withdrawFee ? ` · network fee included` : ""}</span>
        </div>
      )}
      <p className="m-0 rounded-xl bg-kola/20 p-3 text-[13px] leading-snug">Mainnet only: the quote is live from NEAR Intents, the transfer runs after launch. On testnet no money moves.</p>
    </div>
  )
}
