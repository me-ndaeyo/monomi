import { z } from "zod"

import type { SpendingGuard } from "./spending-guard.js"
import { jobSpecSchema, type MonomiClient, type Result } from "./types.js"

const MAX_WAIT_SECONDS = 1800

export const postJobInput = z.object({
  spec: jobSpecSchema.describe(
    "What to check. lat_e6 and lng_e6 are micro-degrees (8.1335 becomes 8133500)."
  ),
  amount_usd: z
    .number()
    .min(0.5)
    .max(25)
    .describe("Pay for the worker in USDC, 0.50 to 25.00."),
})

export const jobIdInput = z.object({
  job_id: z
    .number()
    .int()
    .min(0)
    .describe("Job id returned by monomi_post_job."),
})

export const getReportInput = jobIdInput.extend({
  wait_seconds: z
    .number()
    .int()
    .min(0)
    .max(MAX_WAIT_SECONDS)
    .default(0)
    .describe("Wait up to this long for the worker to finish. 0 reads once."),
})

export interface ToolDeps {
  client: MonomiClient
  guard: SpendingGuard
}

export interface MonomiTool {
  name: string
  description: string
  input: z.ZodObject
  run(rawInput: unknown, deps: ToolDeps): Promise<Result<unknown>>
}

function defineTool<T extends z.ZodObject>(
  name: string,
  description: string,
  input: T,
  handler: (input: z.infer<T>, deps: ToolDeps) => Promise<Result<unknown>>
): MonomiTool {
  return {
    name,
    description,
    input,
    async run(rawInput, deps) {
      const parsed = input.safeParse(rawInput)
      if (parsed.success) return handler(parsed.data, deps)
      const fields = parsed.error.issues.map((i) => i.path.join(".") || "input")
      return {
        data: null,
        error: `Invalid input for ${name}: check ${fields.join(", ")}.`,
      }
    },
  }
}

export const TOOLS: readonly MonomiTool[] = [
  defineTool(
    "monomi_post_job",
    "Hire a person nearby to photograph a place. Locks the pay in escrow before anyone moves. Returns the job id.",
    postJobInput,
    async ({ spec, amount_usd }, { client, guard }) => {
      const refused = guard.check(amount_usd)
      if (refused) return { data: null, error: refused }
      const posted = await client.postJob(spec, amount_usd)
      if (posted.data) guard.record(amount_usd)
      return posted
    }
  ),
  defineTool(
    "monomi_job_status",
    "Read the current on-chain status of a Monomi job.",
    jobIdInput,
    ({ job_id }, { client }) => client.jobStatus(job_id)
  ),
  defineTool(
    "monomi_get_report",
    "Get the verified report for a job: approved or not, the reasons, and photo links. Can wait for the worker.",
    getReportInput,
    ({ job_id, wait_seconds }, { client }) =>
      wait_seconds === 0
        ? client.getReport(job_id)
        : client.waitForReport(job_id, wait_seconds * 1000)
  ),
]

export function runTool(
  name: string,
  rawInput: unknown,
  deps: ToolDeps
): Promise<Result<unknown>> {
  const tool = TOOLS.find((candidate) => candidate.name === name)
  if (!tool)
    return Promise.resolve({ data: null, error: `Unknown tool ${name}.` })
  return tool.run(rawInput, deps)
}
