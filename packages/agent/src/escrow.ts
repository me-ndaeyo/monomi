import { Account, teraToGas } from "near-api-js"
import { z } from "zod"

import type { AgentConfig } from "./config.js"
import { jobSchema, type Job, type JobSpec, type PostedJob } from "./types.js"

const POST_GAS = teraToGas(100)
const ONE_YOCTO = 1n
const EVENT_PREFIX = "EVENT_JSON:"

const configViewSchema = z.object({ total_jobs: z.number().int() })

const postedEventSchema = z.object({
  event: z.literal("monomi_job_posted"),
  data: z.array(z.object({ job_id: z.number().int() })).min(1),
})

export function usdToBaseUnits(amountUsd: number): string {
  return BigInt(Math.round(amountUsd * 1_000_000)).toString()
}

export function createEscrow(config: AgentConfig) {
  const account = new Account(
    config.DEMO_AGENT_ACCOUNT_ID,
    config.NEAR_RPC_URL,
    config.DEMO_AGENT_PRIVATE_KEY
  )

  const view = (method: string, args: Record<string, unknown>) =>
    account.provider.callFunction({
      contractId: config.MONOMI_CONTRACT_ID,
      method,
      args,
    })

  async function getJob(jobId: number): Promise<Job | null> {
    const raw = await view("get_job", { job_id: jobId })
    return raw === null || raw === undefined ? null : jobSchema.parse(raw)
  }

  async function postJob(spec: JobSpec, amountUsd: number): Promise<PostedJob> {
    const before = configViewSchema.parse(await view("get_config", {}))
    const amount = usdToBaseUnits(amountUsd)
    const outcome = await account.callFunctionRaw({
      contractId: config.USDC_CONTRACT_ID,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: config.MONOMI_CONTRACT_ID,
        amount,
        msg: JSON.stringify({ post_job: spec }),
      },
      deposit: ONE_YOCTO,
      gas: POST_GAS,
    })
    const logs = outcome.receipts_outcome.flatMap((r) => r.outcome.logs)
    const jobId = findPostedJobId(logs)
    if (jobId === null) {
      // ft_transfer_call succeeds even when the escrow panics and refunds,
      // so a missing event means the job was not created.
      throw new Error(
        `The escrow did not create a job (expected id ${before.total_jobs}). The token contract refunded the amount.`
      )
    }
    return { jobId, txHash: outcome.transaction.hash, amount }
  }

  return { getJob, postJob, account }
}

export function findPostedJobId(logs: string[]): number | null {
  for (const log of logs) {
    if (!log.startsWith(EVENT_PREFIX)) continue
    const parsed = postedEventSchema.safeParse(
      safeJson(log.slice(EVENT_PREFIX.length))
    )
    if (parsed.success) return parsed.data.data[0]?.job_id ?? null
  }
  return null
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
