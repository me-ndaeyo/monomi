import type { Metadata } from "next"
import Link from "next/link"

import SlimFooter from "@/components/layout/slim-footer"
import SlimHeader from "@/components/layout/slim-header"
import { formatUsdc } from "@/lib/format/usdc"
import { getJob } from "@/lib/near/contract"
import { getLatestReport } from "@/lib/report/get-report"
import CheckList from "./_components/check-list"
import ShareButton from "./_components/share-button"
import TechDetails from "./_components/tech-details"

export const metadata: Metadata = { title: "Check report" }
export const dynamic = "force-dynamic"

function resolveId(raw: string): number | null {
  const value = raw === "sample" ? process.env.SAMPLE_REPORT_JOB_ID : raw
  const id = Number(value)
  return value !== undefined && Number.isInteger(id) && id >= 0 ? id : null
}

export default async function ReportPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const jobId = resolveId((await params).id)
  const job = jobId === null ? null : await getJob(jobId)
  const found = job ? await getLatestReport(job.id) : null
  const report = found?.report
  return (
    <div className="flex min-h-dvh flex-col bg-bone text-ink">
      <SlimHeader tone="dark" action={<ShareButton />} />
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-6 px-4 pb-10 pt-4">
        {!job || !report ? (
          <div className="flex flex-col gap-3 rounded-[20px] border border-card-line bg-white p-6">
            <h1 className="display m-0 text-[34px] leading-none">No report yet</h1>
            <p className="m-0 text-[15px] text-muted-light">{job ? "This job hasn't been checked yet. Reports appear as soon as the photos are checked." : "We couldn't find this check."}</p>
            <Link href="/jobs" className="text-indigo">See open jobs</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[12px] tracking-[0.08em] text-muted-light">CHECK REPORT</span>
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="display m-0 text-[48px] leading-none sm:text-[64px]">{report.approved ? "Yes, it checks out." : "It didn't check out."}</h1>
                <span className={`m-stamp rounded-lg border-2 px-3 py-1 font-mono text-[14px] font-bold ${report.approved ? "border-pass-light text-pass-light" : "border-fail-light text-fail-light"}`}>{report.approved ? "VERIFIED" : "NOT VERIFIED"}</span>
              </div>
              <p className="m-0 text-[15px] text-muted-light">{job.spec.title} · near {report.location.lat}, {report.location.lng} · checked {new Date(report.timestamps.verified).toUTCString()}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4"><span className="text-[13px] text-muted-light">What was asked</span><p className="m-0 mt-1 text-[15px]">{job.spec.instructions}</p></div>
              <div className="rounded-2xl bg-white p-4"><span className="text-[13px] text-muted-light">Who checked</span><p className="m-0 mt-1 text-[15px]">Someone nearby. Their identity stays private.</p></div>
            </div>
            <CheckList report={report} expectedText={job.spec.expected_text} />
            {!report.approved && report.reasons.length > 0 && <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] text-fail-light">{report.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
            <p className="m-0 rounded-2xl bg-white p-4 text-[15px]">Only the person who paid for this check can see the photos. {job.status === "Paid" ? <>The person who checked was paid <strong>{formatUsdc(job.amount)}</strong> the moment these checks passed.</> : null}</p>
            <TechDetails report={report} jobId={job.id} tx={found?.resolveTx ?? null} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink p-5 text-bone">
              <span className="text-[16px] font-semibold">Need somewhere checked before you pay?</span>
              <Link href="/checks/new" className="rounded-full bg-kola px-5 py-3 font-semibold text-ink no-underline">Post a check</Link>
            </div>
          </>
        )}
      </main>
      <SlimFooter tone="dark" />
    </div>
  )
}
