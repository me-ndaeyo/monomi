import { decideDeposit } from "./decision.js"
import type { ChatModel } from "./model.js"
import { runAgent } from "./run-agent.js"
import { scenarioMessages } from "./scenario.js"
import type { ToolDeps } from "./tools.js"
import type { Result } from "./types.js"

export interface DemoParams {
  model: ChatModel
  deps: ToolDeps
  log: (line: string) => void
}

export interface DemoResult {
  summary: string
  decision: string
}

// The decision line comes from the report fields, never from the model text.
export async function runDemo({
  model,
  deps,
  log,
}: DemoParams): Promise<Result<DemoResult>> {
  const outcome = await runAgent({
    model,
    deps,
    messages: scenarioMessages(),
    log,
  })
  if (!outcome.data) return { data: null, error: outcome.error }
  return {
    data: {
      summary: outcome.data.finalText,
      decision: decideDeposit(outcome.data),
    },
    error: null,
  }
}
