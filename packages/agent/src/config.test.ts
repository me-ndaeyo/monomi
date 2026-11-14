import { describe, expect, it } from "vitest"

import { loadConfig } from "./config.js"

describe("loadConfig", () => {
  it("fills testnet defaults when only the key is set", () => {
    const result = loadConfig({ DEMO_AGENT_PRIVATE_KEY: "ed25519:abc" })
    expect(result.data?.MONOMI_CONTRACT_ID).toBe("escrow.monomi.testnet")
    expect(result.data?.USDC_CONTRACT_ID).toBe("tusdc.monomi.testnet")
    expect(result.data?.AGENT_DAILY_CAP_USD).toBe(50)
  })

  it("names the bad variable without echoing its value", () => {
    const result = loadConfig({ DEMO_AGENT_PRIVATE_KEY: "secret-value" })
    expect(result.error).toContain("DEMO_AGENT_PRIVATE_KEY")
    expect(result.error).not.toContain("secret-value")
  })
})
