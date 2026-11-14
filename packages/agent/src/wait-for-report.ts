import type { JobStatus, MonomiClient, Result, WaitResult } from "./types.js"

export const POLL_INTERVAL_MS = 5_000

// Rejected with attempts left goes back to Claimed, so only these mean the
// worker is done; an approved report also ends the wait.
const DONE_STATUSES: readonly JobStatus[] = [
  "Paid",
  "Rejected",
  "Refunded",
  "UnderReview",
]

export async function waitForReport(
  client: Pick<MonomiClient, "jobStatus" | "getReport">,
  jobId: number,
  timeoutMs: number,
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<Result<WaitResult>> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const job = await client.jobStatus(jobId)
    if (!job.data) return { data: null, error: job.error }
    const report = await client.getReport(jobId)
    const approved = report.data?.report.approved === true
    if (approved || DONE_STATUSES.includes(job.data.status)) {
      return { data: { job: job.data, report: report.data }, error: null }
    }
    if (Date.now() + POLL_INTERVAL_MS > deadline) {
      return {
        data: null,
        error: `No final report yet. Job ${jobId} is ${job.data.status}. Check again later.`,
      }
    }
    await sleep(POLL_INTERVAL_MS)
  }
}
