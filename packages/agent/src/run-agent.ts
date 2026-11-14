import { z } from "zod"

import type { ChatMessage, ChatModel } from "./model.js"
import { runTool, type ToolDeps } from "./tools.js"
import {
  jobSchema,
  posterReportSchema,
  type JobStatus,
  type PosterReport,
  type Result,
} from "./types.js"

const MAX_TURNS = 8
const LOG_CLIP = 100

const waitResultSchema = z.object({
  job: jobSchema,
  report: posterReportSchema.nullable(),
})

export interface AgentOutcome {
  report: PosterReport | null
  status: JobStatus | null
  finalText: string
}

export interface RunAgentParams {
  model: ChatModel
  deps: ToolDeps
  messages: ChatMessage[]
  log: (line: string) => void
}

export async function runAgent({
  model,
  deps,
  messages,
  log,
}: RunAgentParams): Promise<Result<AgentOutcome>> {
  const history = [...messages]
  const outcome: AgentOutcome = { report: null, status: null, finalText: "" }

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const reply = await model(history)
    if (!reply.data) return { data: null, error: reply.error }
    history.push(reply.data)
    const calls = reply.data.tool_calls ?? []
    if (calls.length === 0) {
      outcome.finalText = stripThinking(reply.data.content ?? "")
      return { data: outcome, error: null }
    }
    for (const call of calls) {
      log(`agent -> ${call.function.name} ${clip(call.function.arguments)}`)
      const result = await runTool(
        call.function.name,
        parseArgs(call.function.arguments),
        deps
      )
      log(result.error ? `monomi <- error: ${result.error}` : "monomi <- ok")
      track(outcome, result.data)
      const content = JSON.stringify(
        result.error ? { error: result.error } : result.data
      )
      history.push({ role: "tool", tool_call_id: call.id, content })
    }
  }
  return {
    data: null,
    error: `The agent did not finish within ${MAX_TURNS} turns.`,
  }
}

function track(outcome: AgentOutcome, data: unknown) {
  const report = posterReportSchema.safeParse(data)
  if (report.success) outcome.report = report.data
  const job = jobSchema.safeParse(data)
  if (job.success) outcome.status = job.data.status
  const waited = waitResultSchema.safeParse(data)
  if (waited.success) {
    outcome.status = waited.data.job.status
    outcome.report = waited.data.report
  }
}

function parseArgs(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function clip(text: string): string {
  return text.length > LOG_CLIP ? `${text.slice(0, LOG_CLIP)}...` : text
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
}
