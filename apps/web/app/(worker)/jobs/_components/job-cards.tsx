import Link from "next/link"

import { ArrowIcon, ChevronIcon, LockIcon, WalkIcon } from "@/components/ui/icons"
import { timeLeft, walkTime } from "@/lib/format/time"
import { formatUsdc } from "@/lib/format/usdc"
import type { RankedJob } from "../_lib/rank-jobs"

export function FeaturedJobCard({ item, now }: Readonly<{ item: RankedJob; now: number }>) {
  const { job, distanceM } = item
  const total = job.deadline_ns - job.created_ns
  const left = Math.max(0, Math.min(100, ((job.deadline_ns - now) / total) * 100))
  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-3 rounded-[20px] bg-kola p-4 text-ink no-underline">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="display text-[32px] leading-none">
            {formatUsdc(job.amount, false)} <span className="text-[16px] tracking-normal">USDC</span>
          </span>
          <span className="text-[16px] font-semibold leading-[1.3]">{job.spec.title}</span>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink">
          <ArrowIcon color="#F2A23A" />
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[13px] font-medium">
        {distanceM !== null && (
          <span className="flex items-center gap-1.5 rounded-lg bg-ink/10 px-[9px] py-[5px]">
            <WalkIcon /> {walkTime(distanceM)}
          </span>
        )}
        <span className="rounded-lg bg-ink/10 px-[9px] py-[5px]">Pay set aside</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-ink/15">
          <div className="h-full rounded-full bg-ink" style={{ width: `${left}%` }} />
        </div>
        <span className="text-[12px] font-medium">{timeLeft(job.deadline_ns, now)} to take it</span>
      </div>
    </Link>
  )
}

export function JobRow({ item, now, approved }: Readonly<{ item: RankedJob; now: number; approved: number }>) {
  const { job, distanceM, locked } = item
  const meta = locked
    ? `Unlocks after ${job.spec.min_reputation} finished jobs · you've done ${approved}`
    : [distanceM !== null ? walkTime(distanceM) : null, timeLeft(job.deadline_ns, now)].filter(Boolean).join(" · ")
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`grid grid-cols-[76px_1fr_18px] items-center gap-3 rounded-[18px] px-4 py-3.5 text-ink no-underline ${locked ? "border border-dashed border-[#C9C3B3] bg-[#F5F2EA]" : "border border-card-line bg-white"}`}
    >
      <span className={`display text-[22px] ${locked ? "text-muted-light" : ""}`}>{formatUsdc(job.amount, false)}</span>
      <span className="flex flex-col gap-[3px]">
        <span className={`text-[15px] font-semibold ${locked ? "text-[#3D3B33]" : ""}`}>{job.spec.title}</span>
        <span className="text-[13px] text-muted-light">{meta}</span>
      </span>
      {locked ? <LockIcon color="#5E5C50" size={16} /> : <ChevronIcon color="#5E5C50" />}
    </Link>
  )
}
