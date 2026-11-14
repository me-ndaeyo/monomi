"use client"

import Link from "next/link"
import { useState } from "react"

import { useUsdcBalance } from "@/hooks/use-chain"
import { useFaucet } from "@/hooks/use-faucet"
import { useLocation } from "@/hooks/use-location"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"

function Step({ n, done, title, detail, children }: Readonly<{ n: number; done: boolean; title: string; detail: string; children?: React.ReactNode }>) {
  return (
    <li className={`flex flex-col gap-3 rounded-[20px] border p-5 ${done ? "border-line bg-ink-2" : "border-kola/60 bg-ink-2"}`}>
      <div className="flex items-center gap-3">
        <span className={`display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] ${done ? "bg-pass text-ink" : "m-pulse bg-kola text-ink"}`}>{done ? "✓" : n}</span>
        <span className="flex flex-col"><span className="text-[17px] font-semibold">{title}</span><span className="text-[14px] text-soft">{detail}</span></span>
      </div>
      {children}
    </li>
  )
}

const BTN = "m-btn h-[52px] w-full rounded-full bg-kola text-[16px] font-semibold text-ink disabled:opacity-60"

export default function TrySteps() {
  const wallet = useWallet()
  const balance = useUsdcBalance(wallet.accountId)
  const faucet = useFaucet()
  const { location, request } = useLocation()
  const [job, setJob] = useState<{ id: number | null; error: string | null; posting: boolean }>({ id: null, error: null, posting: false })
  const funded = balance.data !== undefined && BigInt(balance.data) > 0n

  const post = async () => {
    if (location.status !== "ready" || !wallet.accountId) return request()
    setJob({ id: null, error: null, posting: true })
    const res = await fetch("/api/demo-job", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lat: location.lat, lng: location.lng, account: wallet.accountId }) })
    const body = (await res.json()) as { data: { job_id: number } | null; error: string | null }
    setJob({ id: body.data?.job_id ?? null, error: body.error, posting: false })
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      <Step n={1} done={!!wallet.accountId} title="Connect a testnet wallet" detail={wallet.accountId ? `${wallet.accountId} is connected` : "Meteor or HOT, set to testnet"}>
        {!wallet.accountId && <button type="button" className={BTN} onClick={wallet.connect}>Connect wallet</button>}
      </Step>
      <Step n={2} done={funded || faucet.status === "done"} title="Get test USDC (optional)" detail={funded ? `${formatUsdc(balance.data ?? "0")} in your wallet` : "Only needed to post your own checks. The test job is paid by our demo agent."}>
        {wallet.accountId && !funded && <button type="button" className={BTN} onClick={() => void faucet.mint()} disabled={faucet.status === "minting"}>{faucet.status === "minting" ? "Minting…" : "Mint 25 test USDC"}</button>}
        {faucet.error && <p className="m-0 text-[13px] text-fail">{faucet.error}</p>}
      </Step>
      <Step n={3} done={job.id !== null} title="Post a test job right here" detail={location.status === "ready" ? `Using your location, accurate to ${Math.round(location.accuracy)} m` : location.status === "denied" ? "Location is blocked. Allow it for this site: the check needs to know you are at the spot." : "Uses your browser location"}>
        <p className="m-0 text-[14px] text-soft">The job pays 0.50 test USDC from our demo agent and asks for a photo of MONOMI and a code written on paper.</p>
        {job.id === null && (
          <button type="button" className={BTN} disabled={!wallet.accountId || job.posting} onClick={() => void post()}>
            {job.posting ? "Posting on NEAR…" : location.status === "ready" ? "Post a test job here" : "Allow location"}
          </button>
        )}
        {job.error && <p role="alert" className="m-0 text-[13px] text-fail">{job.error}</p>}
      </Step>
      <Step n={4} done={false} title="Take the job on your phone" detail="Open the job, tap Take this job, then take the photo">
        {job.id !== null && <Link href={`/jobs/${job.id}`} className="m-btn flex h-[52px] items-center justify-center rounded-full bg-bone font-semibold text-ink no-underline">Open job #{job.id}</Link>}
      </Step>
      <Step n={5} done={false} title="Watch it get checked and paid" detail="Then open the report, like a business would">
        {job.id !== null && <Link href={`/report/${job.id}`} className="text-[15px] text-kola">Report for job #{job.id}</Link>}
      </Step>
      <li className="text-center text-[13px] text-muted">One test job per wallet per day. No real money moves.</li>
    </ol>
  )
}
