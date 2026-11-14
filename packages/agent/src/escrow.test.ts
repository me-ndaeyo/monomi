import { describe, expect, it } from "vitest"

import { findPostedJobId, usdToBaseUnits } from "./escrow.js"

describe("findPostedJobId", () => {
  it("reads the job id from the monomi_job_posted event", () => {
    const event = {
      standard: "monomi",
      version: "1.0.0",
      event: "monomi_job_posted",
      data: [{ job_id: 7, poster: "a.testnet", amount: "500000" }],
    }
    const logs = ["Transfer 500000", `EVENT_JSON:${JSON.stringify(event)}`]
    expect(findPostedJobId(logs)).toBe(7)
  })

  it("returns null when the escrow refused the job", () => {
    expect(findPostedJobId(["Refund 500000 from escrow"])).toBeNull()
    expect(findPostedJobId(["EVENT_JSON:{not json"])).toBeNull()
  })
})

describe("usdToBaseUnits", () => {
  it("converts USDC to 6-decimal base units without float drift", () => {
    expect(usdToBaseUnits(15)).toBe("15000000")
    expect(usdToBaseUnits(0.5)).toBe("500000")
    expect(usdToBaseUnits(0.29)).toBe("290000")
  })
})
