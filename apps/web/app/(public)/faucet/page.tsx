"use client"

import Link from "next/link"

import SlimFooter from "@/components/layout/slim-footer"
import SlimHeader from "@/components/layout/slim-header"
import { useUsdcBalance } from "@/hooks/use-chain"
import { useFaucet } from "@/hooks/use-faucet"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"

export default function FaucetPage() {
  const wallet = useWallet()
  const faucet = useFaucet()
  const balance = useUsdcBalance(wallet.accountId)
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-bone">
      <SlimHeader tone="light" action={<span className="font-mono text-[12px] text-soft">Test mode · NEAR testnet</span>} />
      <main className="mx-auto w-full flex-1 flex max-w-[560px] flex-col gap-5 px-4 py-10">
        <h1 className="display m-0 text-[48px] leading-[0.95]">Get 25 test USDC</h1>
        <p className="m-0 text-[16px] leading-relaxed text-soft">Test USDC has no value. Use it to post checks like an agent or a business would. One mint per wallet per day.</p>
        {wallet.accountId && <p className="m-0 font-mono text-[14px] text-soft">{wallet.accountId} · {balance.data ? formatUsdc(balance.data) : "…"}</p>}
        <button type="button" onClick={() => void faucet.mint()} disabled={faucet.status === "minting"} className="m-btn h-14 rounded-full bg-kola text-[16px] font-semibold text-ink disabled:opacity-60">
          {!wallet.accountId ? "Connect a testnet wallet" : faucet.status === "minting" ? "Minting…" : faucet.status === "done" ? "Done. Mint again tomorrow" : "Mint 25 test USDC"}
        </button>
        {faucet.error && <p role="alert" className="m-0 text-[14px] text-fail">{faucet.error}</p>}
        <p className="m-0 text-[14px] text-soft">No testnet NEAR for fees? Get some free at <a href="https://near-faucet.io" className="text-kola">near-faucet.io</a>. Then <Link href="/try" className="text-kola">try the whole loop</Link>.</p>
      </main>
      <SlimFooter tone="light" />
    </div>
  )
}
