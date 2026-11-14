import { z } from "zod"

import { clientEnv } from "@/config/env/client"
import { viewFunction } from "./rpc"

export const ESCROW = clientEnv.NEXT_PUBLIC_MONOMI_CONTRACT_ID
export const USDC = clientEnv.NEXT_PUBLIC_USDC_CONTRACT_ID

export const JOB_STATUSES = [
  "Open",
  "Claimed",
  "Submitted",
  "Rejected",
  "UnderReview",
  "PayingOut",
  "Paid",
  "PayoutFailed",
  "Refunding",
  "Refunded",
  "RefundFailed",
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

const ns = z.string().transform(Number).transform((n) => Math.floor(n / 1e6))

export const JobSchema = z.object({
  id: z.number(),
  poster: z.string(),
  amount: z.string(),
  spec: z.object({
    title: z.string(),
    instructions: z.string(),
    lat_e6: z.number(),
    lng_e6: z.number(),
    radius_m: z.number(),
    expected_text: z.string().nullable(),
    duration_mins: z.number(),
    min_reputation: z.number(),
  }),
  created_ns: ns,
  deadline_ns: ns,
  status: z.enum(JOB_STATUSES),
  cancelled: z.boolean(),
  worker: z.string().nullable(),
  claimed_ns: ns.nullable(),
  attempts: z.number(),
  excluded: z.array(z.string()),
  proof_hash: z.string().nullable(),
  submitted_ns: ns.nullable(),
  report_hash: z.string().nullable(),
  attestation_ref: z.string().nullable(),
  resolved_ns: ns.nullable(),
})
/** Timestamps (`*_ns` fields) are converted to milliseconds. */
export type Job = z.infer<typeof JobSchema>

export const WorkerStatsSchema = z.object({
  approved: z.number(),
  rejected: z.number(),
  active_job: z.number().nullable(),
})
export type WorkerStats = z.infer<typeof WorkerStatsSchema>

export const CLAIM_TTL_MS = 45 * 60_000
export const APPEAL_WINDOW_MS = 15 * 60_000
export const MAX_ATTEMPTS = 2

export async function getJob(jobId: number): Promise<Job | null> {
  const raw = await viewFunction(ESCROW, "get_job", { job_id: jobId })
  return raw === null ? null : JobSchema.parse(raw)
}

export async function getJobs(params: {
  status?: JobStatus
  poster?: string
  limit?: number
}): Promise<Job[]> {
  const raw = await viewFunction(ESCROW, "get_jobs", {
    from_index: 0,
    limit: params.limit ?? 100,
    status: params.status ?? null,
    poster: params.poster ?? null,
  })
  return z.array(JobSchema).parse(raw)
}

export async function getWorker(account: string): Promise<WorkerStats> {
  const raw = await viewFunction(ESCROW, "get_worker", { account })
  return WorkerStatsSchema.parse(raw)
}

export async function getUsdcBalance(account: string): Promise<string> {
  const raw = await viewFunction(USDC, "ft_balance_of", { account_id: account })
  return z.string().parse(raw)
}

export async function isUsdcRegistered(account: string): Promise<boolean> {
  const raw = await viewFunction(USDC, "storage_balance_of", {
    account_id: account,
  })
  return raw !== null
}
