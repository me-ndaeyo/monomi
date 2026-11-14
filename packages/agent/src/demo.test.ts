import { describe, expect, it } from "vitest"

import { runDemo } from "./demo.js"
import { createDryClient, createScriptedModel } from "./dry-client.js"
import { createSpendingGuard } from "./spending-guard.js"

function dryDeps(scenario: "approved" | "rejected", perJobCapUsd = 25) {
  return {
    client: createDryClient(scenario),
    guard: createSpendingGuard({ perJobCapUsd, dailyCapUsd: 50 }),
  }
}

describe("runDemo in dry mode", () => {
  it("proceeds with the deposit when the report is approved", async () => {
    const result = await runDemo({
      model: createScriptedModel(),
      deps: dryDeps("approved"),
      log: () => {},
    })
    expect(result.error).toBeNull()
    expect(result.data?.decision).toBe("Proceed with deposit")
  })

  it("refuses to pay and lists the reasons when the report is rejected", async () => {
    const result = await runDemo({
      model: createScriptedModel(),
      deps: dryDeps("rejected"),
      log: () => {},
    })
    expect(result.data?.decision).toBe(
      "Do not pay: The code on the paper does not match the code we gave you; The sign does not show ADEYEMI FOODS"
    )
  })

  it("does not pay when the spending guard blocks the job", async () => {
    const lines: string[] = []
    const result = await runDemo({
      model: createScriptedModel(),
      deps: dryDeps("approved", 10),
      log: (line) => lines.push(line),
    })
    expect(lines.some((line) => line.includes("limit per job"))).toBe(true)
    expect(result.data?.decision).toBe("Do not pay: no verified report")
  })
})
