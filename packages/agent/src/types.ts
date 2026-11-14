import { z } from "zod"

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

export const jobSpecSchema = z.object({
  title: z.string().trim().min(1).max(80),
  instructions: z.string().trim().min(1).max(600),
  lat_e6: z.number().int().min(-90_000_000).max(90_000_000),
  lng_e6: z.number().int().min(-180_000_000).max(180_000_000),
  radius_m: z.number().int().min(25).max(2000),
  expected_text: z.string().trim().min(1).max(60).nullable().optional(),
  duration_mins: z.number().int().min(30).max(1440),
  min_reputation: z.number().int().min(0).max(1000),
})

export const jobSchema = z.object({
  id: z.number().int(),
  poster: z.string(),
  amount: z.string(),
  spec: jobSpecSchema,
  created_ns: z.string(),
  deadline_ns: z.string(),
  status: z.enum(JOB_STATUSES),
  cancelled: z.boolean(),
  worker: z.string().nullable(),
  claimed_ns: z.string().nullable(),
  attempts: z.number().int(),
  excluded: z.array(z.string()),
  proof_hash: z.string().nullable(),
  submitted_ns: z.string().nullable(),
  report_hash: z.string().nullable(),
  attestation_ref: z.string().nullable(),
  resolved_ns: z.string().nullable(),
})

export const reportSchema = z.object({
  version: z.number().int(),
  job_id: z.number().int(),
  approved: z.boolean(),
  reasons: z.array(z.string()),
  checks: z.record(z.string(), z.union([z.number(), z.boolean()])),
  model: z.object({
    name: z.string(),
    chat_id: z.string(),
    answers: z.record(z.string(), z.unknown()),
  }),
  attestation: z.object({
    signing_address: z.string(),
    signing_algo: z.string(),
    report_sha256: z.string(),
    signature: z.string(),
    signature_matches: z.boolean(),
  }),
  location: z.object({ lat: z.number(), lng: z.number() }),
  timestamps: z.record(z.string(), z.string()),
  report_hash: z.string(),
})

export const posterReportSchema = z.object({
  report: reportSchema,
  photos: z.array(z.object({ url: z.string() })),
})

export type JobSpec = z.infer<typeof jobSpecSchema>
export type Job = z.infer<typeof jobSchema>
export type JobStatus = Job["status"]
export type Report = z.infer<typeof reportSchema>
export type PosterReport = z.infer<typeof posterReportSchema>

export interface Result<T> {
  data: T | null
  error: string | null
}

export interface PostedJob {
  jobId: number
  txHash: string
  amount: string
}

export interface WaitResult {
  job: Job
  report: PosterReport | null
}

export interface MonomiClient {
  postJob(spec: JobSpec, amountUsd: number): Promise<Result<PostedJob>>
  jobStatus(jobId: number): Promise<Result<Job>>
  getReport(jobId: number): Promise<Result<PosterReport>>
  waitForReport(jobId: number, timeoutMs: number): Promise<Result<WaitResult>>
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
