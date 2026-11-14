import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { createClient } from "./client.js"
import { loadConfig } from "./config.js"
import { registerMonomiTools } from "./mcp-tools.js"
import { createSpendingGuard } from "./spending-guard.js"

const config = loadConfig()
if (!config.data) {
  // stdout carries the MCP protocol, so diagnostics go to stderr.
  console.error(`[mcp-server] ${config.error}`)
  process.exit(1)
}

const server = new McpServer({ name: "monomi", version: "0.1.0" })
registerMonomiTools(server, {
  client: createClient(config.data),
  guard: createSpendingGuard({
    perJobCapUsd: config.data.AGENT_PER_JOB_CAP_USD,
    dailyCapUsd: config.data.AGENT_DAILY_CAP_USD,
  }),
})

await server.connect(new StdioServerTransport())
console.error(
  `[mcp-server] monomi tools ready for ${config.data.DEMO_AGENT_ACCOUNT_ID}`
)
