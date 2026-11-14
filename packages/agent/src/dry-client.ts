import { z } from "zod"

import approved from "../fixtures/report-approved.json" with { type: "json" }
import rejected from "../fixtures/report-rejected.json" with { type: "json" }
import turns from "../fixtures/dry-turns.json" with { type: "json" }
import { usdToBaseUnits } from "./escrow.js"
import { assistantMessageSchema, type ChatModel } from "./model.js"
import {
  reportSchema,
  type Job,
  type JobSpec,
  type MonomiClient,
  type PosterReport,
} from "./types.js"

export type DryScenario = "approved" | "rejected"

const FIXTURE_JOB_ID = 142

export function createDryClient(scenario: DryScenario): MonomiClient {
  const report = reportSchema.parse(
    scenario === "approved" ? approved : rejected
  )
  const poster: PosterReport = { report, photos: [] }
  let job: Job | null = null

  const finished = (spec: JobSpec, amount: string): Job => ({
    id: FIXTURE_JOB_ID,
    poster: "demo-agent.monomi.testnet",
    amount,
    spec,
    created_ns: "0",
    deadline_ns: "0",
    status: report.approved ? "Paid" : "Rejected",
    cancelled: false,
    worker: "tunde.testnet",
    claimed_ns: "0",
    attempts: report.approved ? 1 : 2,
    excluded: [],
    proof_hash: null,
    submitted_ns: "0",
    report_hash: report.report_hash,
    attestation_ref: report.model.chat_id,
    resolved_ns: "0",
  })

  const missing = { data: null, error: `Job ${FIXTURE_JOB_ID} does not exist.` }

  return {
    async postJob(spec, amountUsd) {
      const amount = usdToBaseUnits(amountUsd)
      job = finished(spec, amount)
      return {
        data: { jobId: FIXTURE_JOB_ID, txHash: "dry-run", amount },
        error: null,
      }
    },
    jobStatus: async () => (job ? { data: job, error: null } : missing),
    getReport: async () => (job ? { data: poster, error: null } : missing),
    waitForReport: async () =>
      job ? { data: { job, report: poster }, error: null } : missing,
  }
}

export function createScriptedModel(): ChatModel {
  const script = z.array(assistantMessageSchema).parse(turns)
  let index = 0
  return async () => {
    const next = script[index++]
    return next
      ? { data: next, error: null }
      : { data: null, error: "The dry script ran out of turns." }
  }
}
