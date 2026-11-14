"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowIcon } from "@/components/ui/icons"
import { useWorker } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { CLAIM_TTL_MS, type Job } from "@/lib/near/contract"
import { useClaim } from "../_hooks/use-claim"

const BUTTON = "flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[17px] font-semibold text-bone no-underline disabled:opacity-60"
const QUIET = "flex h-[52px] w-full items-center justify-center rounded-2xl border-[1.5px] border-ink text-[15px] font-semibold"

export default function JobActions({ job }: Readonly<{ job: Job }>) {
  const router = useRouter()
  const wallet = useWallet()
  const worker = useWorker(wallet.accountId)
  const claim = useClaim(job.id)
  const now = Date.now()
  const mine = job.worker !== null && job.worker === wallet.accountId
  const expired = now > job.deadline_ns
  const staleClaim = job.status === "Claimed" && job.claimed_ns !== null && now > job.claimed_ns + CLAIM_TTL_MS

  const body = (() => {
    if (!wallet.accountId) return <button type="button" className={BUTTON} onClick={wallet.connect}>Connect wallet to take this job</button>
    if (mine) return <Link href={`/jobs/${job.id}/capture`} className={BUTTON}>Continue this job <ArrowIcon color="#F2A23A" size={16} /></Link>
    if (expired && (job.status === "Open" || job.status === "Claimed"))
      return <button type="button" className={QUIET} disabled={claim.isSubmitting} onClick={() => void claim.run("expire")}>This job ended. Return the pay to the poster</button>
    if (staleClaim)
      return <button type="button" className={QUIET} disabled={claim.isSubmitting} onClick={() => void claim.run("release_stale_claim")}>The worker ran out of time. Reopen this job</button>
    if (job.status !== "Open") return <p className="text-center text-[15px] text-muted-light">Someone else is on this job.</p>
    if (job.poster === wallet.accountId) return <p className="text-center text-[15px] text-muted-light">You posted this job, so you can't take it.</p>
    if (job.excluded.includes(wallet.accountId)) return <p className="text-center text-[15px] text-muted-light">You can't take this job again.</p>
    if ((worker.data?.active_job ?? null) !== null) return <Link href={`/jobs/${worker.data?.active_job}`} className={QUIET}>Finish your current job first</Link>
    if ((worker.data?.approved ?? 0) < job.spec.min_reputation)
      return <p className="text-center text-[15px] text-muted-light">Unlocks after {job.spec.min_reputation} finished jobs. You've done {worker.data?.approved ?? 0}.</p>
    return (
      <button
        type="button"
        className={BUTTON}
        disabled={claim.isSubmitting}
        onClick={async () => {
          if (await claim.run("claim")) router.push(`/jobs/${job.id}/capture`)
        }}
      >
        {claim.isSubmitting ? "Waiting for your wallet…" : "Take this job"} <ArrowIcon color="#F2A23A" size={16} />
      </button>
    )
  })()

  return (
    <div className="sticky bottom-0 flex flex-col gap-2 border-t border-card-line bg-bone px-5 pb-6 pt-3.5">
      {body}
      {claim.submitError && <p role="alert" className="text-center text-[13px] text-fail-light">{claim.submitError}</p>}
      {job.status === "Open" && <span className="text-center text-[13px] text-muted-light">You'll have 45 minutes to send the photos</span>}
    </div>
  )
}
