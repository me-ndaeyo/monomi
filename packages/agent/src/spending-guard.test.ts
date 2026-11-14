import { describe, expect, it } from "vitest"

import { createSpendingGuard } from "./spending-guard.js"

function guardAt(iso: { value: string }) {
  return createSpendingGuard({
    perJobCapUsd: 25,
    dailyCapUsd: 50,
    now: () => new Date(iso.value),
  })
}

describe("createSpendingGuard", () => {
  it("allows a job under both caps", () => {
    const guard = guardAt({ value: "2026-11-14T10:00:00Z" })
    expect(guard.check(15)).toBeNull()
  })

  it("refuses a job above the per-job cap", () => {
    const guard = guardAt({ value: "2026-11-14T10:00:00Z" })
    expect(guard.check(25.01)).toContain("limit per job")
  })

  it("refuses a job that would pass the daily cap", () => {
    const guard = guardAt({ value: "2026-11-14T10:00:00Z" })
    guard.record(25)
    guard.record(20)
    expect(guard.check(5)).toBeNull()
    expect(guard.check(5.01)).toContain("5.00 USDC left")
  })

  it("resets the daily total at midnight UTC", () => {
    const clock = { value: "2026-11-14T23:59:00Z" }
    const guard = guardAt(clock)
    guard.record(25)
    guard.record(25)
    expect(guard.check(1)).toContain("Daily limit")
    clock.value = "2026-11-15T00:00:01Z"
    expect(guard.check(1)).toBeNull()
  })

  it("refuses zero, negative and non-numeric amounts", () => {
    const guard = guardAt({ value: "2026-11-14T10:00:00Z" })
    expect(guard.check(0)).toContain("positive")
    expect(guard.check(-1)).toContain("positive")
    expect(guard.check(Number.NaN)).toContain("positive")
  })
})
