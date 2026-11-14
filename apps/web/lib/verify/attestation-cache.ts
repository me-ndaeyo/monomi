import "server-only"
import { fetchAttestation, type Attestation } from "verifier"

import { serverEnv } from "@/config/env/server"

const REFRESH_MS = 60 * 60_000

let cached: { value: Attestation; fetchedAt: number } | null = null

/** The attested signing key, refreshed hourly. */
export async function currentAttestation() {
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) {
    return { data: cached.value, error: null }
  }
  const result = await fetchAttestation({
    model: serverEnv.NEARAI_VISION_MODEL,
    apiKey: serverEnv.NEARAI_API_KEY,
  })
  if (result.data) cached = { value: result.data, fetchedAt: Date.now() }
  return result
}
