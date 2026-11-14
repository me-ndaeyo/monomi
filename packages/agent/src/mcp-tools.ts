import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { TOOLS, type ToolDeps } from "./tools.js"

export function registerMonomiTools(server: McpServer, deps: ToolDeps) {
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.input },
      async (input) => {
        const result = await tool.run(input, deps)
        if (result.error !== null) {
          return {
            content: [{ type: "text", text: result.error }],
            isError: true,
          }
        }
        const text = JSON.stringify(result.data, null, 2)
        return { content: [{ type: "text", text }] }
      }
    )
  }
}
