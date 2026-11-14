"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { useOpenJobs, useUsdcBalance, useWorker } from "@/hooks/use-chain"
import { useLocation } from "@/hooks/use-location"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc } from "@/lib/format/usdc"
import { rankJobs, type SortKey } from "../_lib/rank-jobs"
import JobSheet from "./job-sheet"
import JobsMap from "./jobs-map"

export default function JobsView() {
  const wallet = useWallet()
  const { location, request } = useLocation()
  const jobs = useOpenJobs()
  const worker = useWorker(wallet.accountId)
  const balance = useUsdcBalance(wallet.accountId)
  const [sort, setSort] = useState<SortKey>("closest")
  const now = Date.now()

  useEffect(request, [request])

  const here = location.status === "ready" ? { lat: location.lat, lng: location.lng } : null
  const ranked = rankJobs(jobs.data ?? [], { sort, here, approved: worker.data?.approved ?? 0, account: wallet.accountId, now })

  return (
    <div className="relative min-h-dvh pt-[330px] md:grid md:min-h-[calc(100dvh-64px)] md:grid-cols-[1fr_460px] md:pt-0">
      <div className="absolute inset-x-0 top-0 h-[380px] md:sticky md:h-[calc(100dvh-64px)]">
      <JobsMap jobs={ranked} here={here} />
      <div className="absolute inset-x-4 top-[18px] flex items-center justify-between">
          <Link href="/wallet" className="flex items-center gap-2.5 rounded-full bg-ink py-1.5 pl-1.5 pr-4 text-bone no-underline shadow-[0_6px_16px_rgba(11,12,10,0.25)]">
            <span className="display flex h-[34px] w-[34px] items-center justify-center rounded-full bg-kola text-[15px] text-ink">
              {wallet.accountId?.charAt(0).toUpperCase()}
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="text-[11px] text-muted">Balance</span>
              <span className="text-[15px] font-bold">{balance.data ? formatUsdc(balance.data) : "…"}</span>
            </span>
          </Link>
        <button type="button" onClick={request} aria-label="Recenter on my location" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(11,12,10,0.18)]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3.2" fill="#3347C8" /><circle cx="10" cy="10" r="6.5" stroke="#0B0C0A" strokeWidth="1.5" /><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5" stroke="#0B0C0A" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      </div>
      <JobSheet
        ranked={ranked}
        now={now}
        approved={worker.data?.approved ?? 0}
        sort={sort}
        onSort={setSort}
        isLoading={jobs.isLoading}
        error={jobs.error}
        locationStatus={location.status}
      />
    </div>
  )
}
