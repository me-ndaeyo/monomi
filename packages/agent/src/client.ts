import { KeyPair } from "near-api-js"

import type { AgentConfig } from "./config.js"
import { createEscrow } from "./escrow.js"
import { createMonomiApi } from "./monomi-api.js"
import {
  errorMessage,
  jobSpecSchema,
  type MonomiClient,
  type PosterReport,
  type Result,
} from "./types.js"
import { waitForReport } from "./wait-for-report.js"

export const MIN_AMOUNT_USD = 0.5
export const MAX_AMOUNT_USD = 25

export function createClient(config: AgentConfig): MonomiClient {
  const escrow = createEscrow(config)
  const api = createMonomiApi({
    baseUrl: config.MONOMI_API_URL,
    accountId: config.DEMO_AGENT_ACCOUNT_ID,
    keyPair: KeyPair.fromString(config.DEMO_AGENT_PRIVATE_KEY),
  })

  const client: MonomiClient = {
    async postJob(spec, amountUsd) {
      const parsed = jobSpecSchema.safeParse(spec)
      if (!parsed.success) {
        return { data: null, error: "The job details are out of range." }
      }
      if (amountUsd < MIN_AMOUNT_USD || amountUsd > MAX_AMOUNT_USD) {
        return { data: null, error: "Pay must be between 0.50 and 25.00 USDC." }
      }
      return attempt(() => escrow.postJob(parsed.data, amountUsd))
    },

    async jobStatus(jobId) {
      const job = await attempt(() => escrow.getJob(jobId))
      if (job.error) return { data: null, error: job.error }
      if (!job.data)
        return { data: null, error: `Job ${jobId} does not exist.` }
      return { data: job.data, error: null }
    },

    async getReport(jobId): Promise<Result<PosterReport>> {
      const result = await attempt(() => api.getReport(jobId))
      return result.data ?? { data: null, error: result.error }
    },

    waitForReport: (jobId, timeoutMs) =>
      waitForReport(client, jobId, timeoutMs),
  }
  return client
}

async function attempt<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { data: await run(), error: null }
  } catch (error) {
    return { data: null, error: errorMessage(error) }
  }
}
