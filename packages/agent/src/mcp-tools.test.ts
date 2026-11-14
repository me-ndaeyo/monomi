import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it } from "vitest"

import { createDryClient } from "./dry-client.js"
import { registerMonomiTools } from "./mcp-tools.js"
import { createSpendingGuard } from "./spending-guard.js"

async function connect() {
  const server = new McpServer({ name: "monomi", version: "0.1.0" })
  registerMonomiTools(server, {
    client: createDryClient("approved"),
    guard: createSpendingGuard({ perJobCapUsd: 25, dailyCapUsd: 50 }),
  })
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: "test", version: "0.0.0" })
  await Promise.all([server.connect(serverSide), client.connect(clientSide)])
  return client
}

describe("registerMonomiTools", () => {
  it("lists the three Monomi tools", async () => {
    const client = await connect()
    const { tools } = await client.listTools()
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "monomi_get_report",
      "monomi_job_status",
      "monomi_post_job",
    ])
  })

  it("returns a plain-language error for an unknown job", async () => {
    const client = await connect()
    const result = await client.callTool({
      name: "monomi_job_status",
      arguments: { job_id: 5 },
    })
    expect(result.isError).toBe(true)
    expect(JSON.stringify(result.content)).toContain("does not exist")
  })

  it("flags invalid input as an error", async () => {
    const client = await connect()
    const result = await client.callTool({
      name: "monomi_job_status",
      arguments: { job_id: "five" },
    })
    expect(result.isError).toBe(true)
  })
})
