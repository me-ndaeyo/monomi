import { describe, expect, it, vi } from "vitest"

import approved from "../fixtures/report-approved.json" with { type: "json" }
import { createDryClient } from "./dry-client.js"
import { reportSchema, type Job, type MonomiClient } from "./types.js"
import { waitForReport } from "./wait-for-report.js"

async function jobWith(status: Job["status"]): Promise<Job> {
  const client = createDryClient("approved")
  await client.postJob(
    {
      title: "t",
      instructions: "i",
      lat_e6: 0,
      lng_e6: 0,
      radius_m: 25,
      duration_mins: 30,
      min_reputation: 0,
    },
    1
  )
  const job = await client.jobStatus(142)
  if (!job.data) throw new Error("fixture job missing")
  return { ...job.data, status }
}

describe("waitForReport", () => {
  it("keeps polling while the worker can still retry", async () => {
    const claimed = await jobWith("Claimed")
    const paid = await jobWith("Paid")
    const report = { report: reportSchema.parse(approved), photos: [] }
    const jobStatus = vi
      .fn<MonomiClient["jobStatus"]>()
      .mockResolvedValueOnce({ data: claimed, error: null })
      .mockResolvedValue({ data: paid, error: null })
    const getReport = vi
      .fn<MonomiClient["getReport"]>()
      .mockResolvedValueOnce({ data: null, error: "No report yet." })
      .mockResolvedValue({ data: report, error: null })
    const sleep = vi.fn(async () => {})
    const result = await waitForReport(
      { jobStatus, getReport },
      142,
      60_000,
      sleep
    )
    expect(result.data?.job.status).toBe("Paid")
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it("gives up with the current status after the timeout", async () => {
    const claimed = await jobWith("Claimed")
    const result = await waitForReport(
      {
        jobStatus: async () => ({ data: claimed, error: null }),
        getReport: async () => ({ data: null, error: "No report yet." }),
      },
      142,
      0,
      async () => {}
    )
    expect(result.error).toContain("Claimed")
  })
})
