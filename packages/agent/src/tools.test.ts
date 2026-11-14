import { describe, expect, it, vi } from "vitest"

import { createSpendingGuard } from "./spending-guard.js"
import { runTool } from "./tools.js"
import type { MonomiClient } from "./types.js"

const SPEC = {
  title: "Shop sign check",
  instructions: "Photograph the shop sign from the road.",
  lat_e6: 8133500,
  lng_e6: 4240500,
  radius_m: 100,
  duration_mins: 60,
  min_reputation: 0,
}

function mockClient(): MonomiClient {
  return {
    postJob: vi.fn(async () => ({
      data: { jobId: 1, txHash: "tx", amount: "5000000" },
      error: null,
    })),
    jobStatus: vi.fn(async () => ({ data: null, error: "none" })),
    getReport: vi.fn(async () => ({ data: null, error: "No report yet." })),
    waitForReport: vi.fn(async () => ({ data: null, error: "timeout" })),
  }
}

function deps(client = mockClient(), perJobCapUsd = 25) {
  return {
    client,
    guard: createSpendingGuard({ perJobCapUsd, dailyCapUsd: 50 }),
  }
}

describe("runTool", () => {
  it("posts a job with valid input", async () => {
    const d = deps()
    const result = await runTool(
      "monomi_post_job",
      { spec: SPEC, amount_usd: 5 },
      d
    )
    expect(result.error).toBeNull()
    expect(d.client.postJob).toHaveBeenCalledWith(SPEC, 5)
  })

  it("rejects a title over 80 characters without signing", async () => {
    const d = deps()
    const spec = { ...SPEC, title: "x".repeat(81) }
    const result = await runTool("monomi_post_job", { spec, amount_usd: 5 }, d)
    expect(result.error).toContain("spec.title")
    expect(d.client.postJob).not.toHaveBeenCalled()
  })

  it("rejects pay outside 0.50 to 25 USDC", async () => {
    const result = await runTool(
      "monomi_post_job",
      { spec: SPEC, amount_usd: 0.1 },
      deps()
    )
    expect(result.error).toContain("amount_usd")
  })

  it("applies the spending guard before signing", async () => {
    const d = deps(mockClient(), 4)
    const result = await runTool(
      "monomi_post_job",
      { spec: SPEC, amount_usd: 5 },
      d
    )
    expect(result.error).toContain("limit per job")
    expect(d.client.postJob).not.toHaveBeenCalled()
  })

  it("reads the report once when no wait is given", async () => {
    const d = deps()
    await runTool("monomi_get_report", { job_id: 3 }, d)
    expect(d.client.getReport).toHaveBeenCalledWith(3)
    expect(d.client.waitForReport).not.toHaveBeenCalled()
  })

  it("waits for the report when wait_seconds is set", async () => {
    const d = deps()
    await runTool("monomi_get_report", { job_id: 3, wait_seconds: 60 }, d)
    expect(d.client.waitForReport).toHaveBeenCalledWith(3, 60_000)
  })

  it("rejects a negative job id and unknown tools", async () => {
    const bad = await runTool("monomi_job_status", { job_id: -1 }, deps())
    expect(bad.error).toContain("job_id")
    const unknown = await runTool("monomi_pay_everyone", {}, deps())
    expect(unknown.error).toContain("Unknown tool")
  })
})
