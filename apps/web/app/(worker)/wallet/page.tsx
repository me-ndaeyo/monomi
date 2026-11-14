"use client"

import Link from "next/link"

import { useUsdcBalance } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"
import CashOutForm from "./_components/cash-out-form"

export default function WalletPage() {
  const wallet = useWallet()
  const balance = useUsdcBalance(wallet.accountId)
  const usd = balance.data ? Number(BigInt(balance.data)) / 1e6 : 0
  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <h1 className="display m-0 text-[34px] leading-none">Wallet</h1>
      <div className="flex flex-col gap-1 rounded-[24px] bg-ink p-5 text-bone">
        <span className="text-[13px] text-muted">Balance</span>
        <span className="display text-[48px] leading-none text-kola">{balance.isLoading ? "…" : balance.error ? "–" : formatUsdc(balance.data ?? "0", false)} <span className="text-[20px] tracking-normal text-bone">USDC</span></span>
        {balance.error && <span className="text-[13px] text-fail">Could not read your balance from NEAR. Try again shortly.</span>}
        <span className="font-mono text-[12px] text-muted">{wallet.accountId} · test USDC</span>
      </div>
      <CashOutForm maxUsd={usd} />
      <Link href="/faucet" className="text-center text-[14px] text-indigo">Get 25 test USDC to try posting a check</Link>
    </div>
  )
}
