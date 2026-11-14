import "server-only"
import { teraToGas } from "near-api-js"

import { serverEnv } from "@/config/env/server"
import { ESCROW } from "./contract"
import { serverAccount } from "./server-account"

interface ResolveInput {
  jobId: number
  approved: boolean
  reportHash: string
  attestationRef: string
}

const RETRIES = 3

/** Safe to retry: the contract only resolves jobs that are still Submitted. */
export async function resolveJob(input: ResolveInput) {
  const verifier = serverAccount(
    serverEnv.VERIFIER_ACCOUNT_ID,
    serverEnv.VERIFIER_PRIVATE_KEY
  )
  let lastError = "Could not reach NEAR"
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const outcome = await verifier.callFunctionRaw({
        contractId: ESCROW,
        methodName: "resolve",
        args: {
          job_id: input.jobId,
          approved: input.approved,
          report_hash: input.reportHash,
          attestation_ref: input.attestationRef,
        },
        gas: teraToGas(100),
      })
      return { data: outcome.transaction.hash, error: null }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  console.error("[resolve-job] failed", { jobId: input.jobId })
  return { data: null, error: lastError }
}
