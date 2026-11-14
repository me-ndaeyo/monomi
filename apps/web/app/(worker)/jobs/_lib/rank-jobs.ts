import { haversineM } from "verifier/checks"

import type { Job } from "@/lib/near/contract"

export type SortKey = "closest" | "pay" | "ending"

export interface RankedJob {
  job: Job
  distanceM: number | null
  locked: boolean
}

export function rankJobs(
  jobs: Job[],
  opts: { sort: SortKey; here: { lat: number; lng: number } | null; approved: number; account: string | null; now: number }
): RankedJob[] {
  const visible = jobs.filter(
    (j) => j.deadline_ns > opts.now && j.poster !== opts.account && !(opts.account && j.excluded.includes(opts.account))
  )
  const ranked = visible.map((job) => ({
    job,
    distanceM: opts.here ? haversineM(opts.here, { lat: job.spec.lat_e6 / 1e6, lng: job.spec.lng_e6 / 1e6 }) : null,
    locked: job.spec.min_reputation > opts.approved,
  }))
  const by: Record<SortKey, (a: RankedJob, b: RankedJob) => number> = {
    closest: (a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0),
    pay: (a, b) => Number(BigInt(b.job.amount) - BigInt(a.job.amount)),
    ending: (a, b) => a.job.deadline_ns - b.job.deadline_ns,
  }
  return ranked.sort((a, b) => Number(a.locked) - Number(b.locked) || by[opts.sort](a, b))
}
