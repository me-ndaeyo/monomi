import { describe, expect, test } from "vitest"

import { DECISION_CASES } from "../fixtures/decision-cases"
import { runChecks } from "../src/checks"
import { decide } from "../src/decide"

describe("decide", () => {
  test.each(DECISION_CASES)("$name", (fixture) => {
    const decision = decide({
      checks: runChecks(fixture.checks),
      answers: fixture.answers,
      code: fixture.code,
      expectedText: fixture.expectedText,
      radiusM: fixture.checks.job.radius_m,
    })
    expect(decision.approved).toBe(fixture.approved)
    if (fixture.approved) expect(decision.reasons).toEqual([])
    if (fixture.reason) expect(decision.reasons).toEqual([fixture.reason])
  })

  test("a job without expected text ignores the sign answers", () => {
    const [pass] = DECISION_CASES
    if (!pass) throw new Error("missing pass fixture")
    const decision = decide({
      checks: runChecks(pass.checks),
      answers: { ...pass.answers, expected_text_found: false },
      code: pass.code,
      expectedText: null,
    })
    expect(decision).toEqual({ approved: true, reasons: [] })
  })

  test("several failures give one reason each", () => {
    const [pass] = DECISION_CASES
    if (!pass) throw new Error("missing pass fixture")
    const decision = decide({
      checks: runChecks(pass.checks),
      answers: { ...pass.answers, code_read: "", people_are_main_subject: true },
      code: pass.code,
      expectedText: null,
    })
    expect(decision.approved).toBe(false)
    expect(decision.reasons).toHaveLength(2)
  })

  test("no reason contains an em dash", () => {
    for (const fixture of DECISION_CASES) {
      expect(fixture.reason ?? "").not.toContain("—")
    }
  })
})
