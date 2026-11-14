import Link from "next/link"

import { formatUsdc } from "@/lib/format/usdc"

const CHECKS = ["Right place", "Just now", "Code", "Sign", "Real photos"]

export default function PaidStep({ jobId, amount, title, approved }: Readonly<{ jobId: number; amount: string; title: string; approved: number }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-kola px-5 pb-6 pt-[18px] text-ink">
      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <div className="relative h-24 w-24">
          <span className="pd-ring absolute inset-0 rounded-full border-2 border-ink" aria-hidden="true" />
          <span className="pd-ring pd-ring2 absolute inset-0 rounded-full border-2 border-ink" aria-hidden="true" />
          <svg className="pd-pop relative" width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-label="Paid">
            <circle cx="48" cy="48" r="46" fill="#0B0C0A" />
            <path d="M30 49l12 12 24-26" stroke="#F2A23A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[17px] font-semibold">Your photos checked out</span>
        <span className="display text-[68px] leading-[0.9] tracking-[-0.05em]">
          +{formatUsdc(amount, false)}
          <br />
          <span className="text-[26px] tracking-[-0.02em]">USDC</span>
        </span>
        <span className="text-[15px] text-[#2B2414]">is in your wallet now</span>
      </div>
      <div className="mt-8 flex flex-col gap-3 rounded-[20px] bg-ink px-[18px] py-4 text-bone">
        <span className="text-[15px] font-semibold">{title}</span>
        <div className="flex flex-wrap gap-1.5 text-[12px]">
          {CHECKS.map((c) => (
            <span key={c} className="rounded-full border border-line px-[9px] py-[5px] text-soft"><span className="text-pass">✓</span> {c}</span>
          ))}
        </div>
        <span className="text-[13px] text-muted">That's {approved} {approved === 1 ? "job" : "jobs"} done.</span>
      </div>
      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <Link href="/wallet" className="flex h-[58px] items-center justify-center rounded-[18px] bg-ink text-[17px] font-semibold text-bone no-underline">Cash out</Link>
        <div className="grid grid-cols-2 gap-2.5">
          <Link href={`/report/${jobId}`} className="flex h-[52px] items-center justify-center rounded-2xl border-[1.5px] border-ink text-[15px] font-semibold text-ink no-underline">See the report</Link>
          <Link href="/jobs" className="flex h-[52px] items-center justify-center rounded-2xl border-[1.5px] border-ink text-[15px] font-semibold text-ink no-underline">Next job</Link>
        </div>
      </div>
    </div>
  )
}
