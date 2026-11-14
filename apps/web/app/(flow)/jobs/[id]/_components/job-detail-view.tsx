"use client"

import Link from "next/link"

import { ChevronIcon, LockIcon, ShieldIcon } from "@/components/ui/icons"
import StaticMap from "@/components/ui/static-map"
import { useJob } from "@/hooks/use-chain"
import { timeLeft } from "@/lib/format/time"
import { formatUsdc } from "@/lib/format/usdc"
import JobActions from "./job-actions"

export default function JobDetailView({ jobId }: Readonly<{ jobId: number }>) {
  const { data: job, isLoading, error } = useJob(jobId, 15_000)

  if (isLoading) return <div className="h-dvh animate-pulse bg-sand" />
  if (error || !job)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-[16px]">{error ? "Could not load this job from NEAR." : "This job does not exist."}</p>
        <Link href="/jobs" className="rounded-full bg-ink px-5 py-3 font-semibold text-bone no-underline">Back to jobs</Link>
      </div>
    )

  const { spec } = job
  return (
    <div className="flex min-h-dvh flex-col md:grid md:min-h-[calc(100dvh-64px)] md:grid-cols-[1fr_520px]">
      <div className="relative md:sticky md:top-16 md:h-[calc(100dvh-64px)] [&>div:first-child]:md:h-full">
        <StaticMap label={formatUsdc(job.amount, false)} />
        <Link href="/jobs" aria-label="Back to jobs" className="absolute left-4 top-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(11,12,10,0.18)]">
          <ChevronIcon back color="#0B0C0A" />
        </Link>
      </div>
      <div className="relative -mt-8 flex flex-1 flex-col gap-4 rounded-t-[28px] bg-bone px-5 pb-4 pt-2.5 shadow-[0_-10px_30px_rgba(11,12,10,0.12)] md:col-start-2 md:row-start-1 md:mt-0 md:rounded-none md:border-l md:border-card-line md:px-8 md:pt-8 md:shadow-none">
        <span aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-[#C9C3B3]" />
        <div className="flex items-center justify-between">
          <span className="display text-[40px] leading-none">
            {formatUsdc(job.amount, false)} <span className="text-[18px] tracking-normal">USDC</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#E3F2E9] px-[11px] py-[7px] text-[13px] font-semibold text-pass-light">
            <LockIcon color="#1F7A4D" size={14} /> Pay set aside
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[21px] font-semibold leading-[1.25]">{spec.title}</h1>
          <span className="text-[14px] text-muted-light">
            Within {spec.radius_m} m of {(spec.lat_e6 / 1e6).toFixed(4)}, {(spec.lng_e6 / 1e6).toFixed(4)} · {timeLeft(job.deadline_ns)}
          </span>
        </div>
        <div className="flex flex-col gap-3 rounded-[18px] border border-card-line bg-white p-4">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted-light">WHAT TO PHOTOGRAPH</span>
          <p className="m-0 whitespace-pre-line text-[15px] leading-[1.45]">{spec.instructions}</p>
          {spec.expected_text && (
            <p className="m-0 text-[15px] leading-[1.45]">
              The sign should read <strong>{spec.expected_text}</strong>, with your code on paper in the same photo.
            </p>
          )}
        </div>
        <div className="flex gap-2.5 px-0.5 text-[13px] leading-[1.45] text-[#3D3B33]">
          <ShieldIcon color="#3D3B33" />
          <span>Don't go onto private property and don't photograph faces. If it feels unsafe, leave. You can drop the job at any time.</span>
        </div>
      </div>
      <div className="md:col-start-2 md:border-l md:border-card-line">
        <JobActions job={job} />
      </div>
    </div>
  )
}
