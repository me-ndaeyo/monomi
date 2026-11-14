import type { KeyPair } from "near-api-js"
import { z } from "zod"

import { nep413Header, signNep413 } from "./nep413.js"
import { posterReportSchema, type PosterReport, type Result } from "./types.js"

const NONCE_PATH = "/api/auth/nonce"
const reportPath = (jobId: number) => `/api/jobs/${jobId}/report`

const envelope = <T extends z.ZodType>(data: T) =>
  z.object({ data: data.nullable(), error: z.string().nullable() })

const nonceEnvelope = envelope(z.object({ nonce: z.string().min(1) }))
const reportEnvelope = envelope(posterReportSchema)

export interface MonomiApiParams {
  baseUrl: string
  accountId: string
  keyPair: KeyPair
  fetchFn?: typeof fetch
}

export function createMonomiApi({
  baseUrl,
  accountId,
  keyPair,
  fetchFn = fetch,
}: MonomiApiParams) {
  async function getNonce(): Promise<Result<string>> {
    const response = await fetchFn(new URL(NONCE_PATH, baseUrl), {
      method: "POST",
    })
    const body = nonceEnvelope.safeParse(await response.json())
    if (!body.success)
      return { data: null, error: "The nonce reply was malformed." }
    if (!body.data.data)
      return { data: null, error: body.data.error ?? "No nonce." }
    return { data: body.data.data.nonce, error: null }
  }

  async function getReport(jobId: number): Promise<Result<PosterReport>> {
    const nonce = await getNonce()
    if (!nonce.data) return { data: null, error: nonce.error }
    const message = `monomi:report:${jobId}:${nonce.data}`
    const auth = signNep413(keyPair, accountId, message)
    const response = await fetchFn(new URL(reportPath(jobId), baseUrl), {
      headers: { Authorization: nep413Header(auth) },
    })
    const body = reportEnvelope.safeParse(await response.json())
    if (!body.success) {
      return {
        data: null,
        error: `The report reply was malformed (HTTP ${response.status}).`,
      }
    }
    if (!body.data.data) {
      return { data: null, error: body.data.error ?? "No report yet." }
    }
    return { data: body.data.data, error: null }
  }

  return { getReport }
}
