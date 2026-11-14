import { describe, expect, test } from "vitest"

import { DECISION_CASES } from "../fixtures/decision-cases"
import { runChecks } from "../src/checks"
import { canonicalJson, sha256Hex } from "../src/proof"
import { buildReport } from "../src/report"

function build() {
  const [pass] = DECISION_CASES
  if (!pass) throw new Error("missing pass fixture")
  return buildReport({
    jobId: 3,
    decision: { approved: true, reasons: [] },
    checks: runChecks(pass.checks),
    model: { name: "vision-model", chatId: "chatcmpl-1", answers: pass.answers },
    attestation: { signing_address: "0xabc", signing_algo: "ecdsa", report_sha256: "f".repeat(64) },
    signature: { signature: "0x1234", matches: true },
    capture: { lat: 8.133349, lng: 4.236789 },
    timestamps: { challengeIssuedMs: 0, capturedMs: 180_000, verifiedMs: 200_000 },
  })
}

describe("buildReport", () => {
  test("rounds the location to 2 decimals", () => {
    expect(build().location).toEqual({ lat: 8.13, lng: 4.24 })
  })

  test("hashes the canonical json of everything except the hash", () => {
    const { report_hash, ...body } = build()
    expect(report_hash).toBe(sha256Hex(canonicalJson(body)))
  })

  test("matches the documented report shape", () => {
    const report = build()
    expect(report.version).toBe(1)
    expect(report.attestation.signature_matches).toBe(true)
    expect(report.timestamps.captured).toBe("1970-01-01T00:03:00.000Z")
    expect(JSON.stringify(report)).not.toContain("photo_url")
  })
})
