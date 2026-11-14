import "server-only"
import { askModel, buildReport, decide, runChecks, verifyChatSignature } from "verifier"

import { serverEnv } from "@/config/env/server"
import { sql } from "@/lib/db/sql"
import type { Job } from "@/lib/near/contract"
import { resolveJob } from "@/lib/near/resolve-job"
import { currentAttestation } from "./attestation-cache"
import { loadBundle } from "./load-bundle"

export type VerificationStatus = "running" | "approved" | "rejected" | "needs_review"

async function finish(proofHash: string, status: VerificationStatus, reasons: string[], extra: { tx?: string; error?: string } = {}) {
  await sql`update verifications set status = ${status}, reasons = ${reasons},
    resolve_tx = ${extra.tx ?? null}, error = ${extra.error ?? null}, updated_at = now()
    where proof_hash = ${proofHash}`
  return { status, reasons }
}

/** Steps 6 to 9 of the spec. The model only answers questions; `decide` makes the call. */
export async function runVerification(job: Job, proofHash: string) {
  const bundle = await loadBundle(proofHash)
  if (!bundle) return finish(proofHash, "needs_review", [], { error: "bundle_missing" })

  const checks = runChecks({
    job: job.spec,
    capture: bundle.capture,
    challengeIssuedAtMs: bundle.challengeIssuedAtMs,
    serverTsMs: bundle.serverTsMs,
    photoHashes: bundle.photoHashes,
    usedPhotoHashes: bundle.usedPhotoHashes,
  })
  const model = await askModel({
    images: bundle.images,
    job: job.spec,
    config: { apiKey: serverEnv.NEARAI_API_KEY, model: serverEnv.NEARAI_VISION_MODEL },
  })
  if (!model.data) return finish(proofHash, "needs_review", [], { error: model.error ?? "model_failed" })

  const attestation = await currentAttestation()
  if (!attestation.data) return finish(proofHash, "needs_review", [], { error: attestation.error ?? "attestation_failed" })
  const signature = await verifyChatSignature({
    chatId: model.data.chatId,
    model: serverEnv.NEARAI_VISION_MODEL,
    apiKey: serverEnv.NEARAI_API_KEY,
    expectedAddress: attestation.data.signing_address,
    requestBody: model.data.requestBody,
    responseBody: model.data.responseBody,
  })
  if (!signature.data?.matches) {
    return finish(proofHash, "needs_review", [], { error: signature.error ?? "signature_mismatch" })
  }

  const decision = decide({
    checks,
    answers: model.data.answers,
    code: bundle.code,
    expectedText: job.spec.expected_text,
    radiusM: job.spec.radius_m,
  })
  const report = buildReport({
    jobId: job.id,
    decision,
    checks,
    model: { name: serverEnv.NEARAI_VISION_MODEL, chatId: model.data.chatId, answers: model.data.answers },
    attestation: attestation.data,
    signature: signature.data,
    capture: bundle.capture,
    timestamps: { challengeIssuedMs: bundle.challengeIssuedAtMs, capturedMs: bundle.serverTsMs, verifiedMs: Date.now() },
  })
  await sql`insert into reports (job_id, proof_hash, report, report_hash)
    values (${job.id}, ${proofHash}, ${JSON.stringify(report)}, ${report.report_hash})
    on conflict (proof_hash) do nothing`
  const tx = await resolveJob({ jobId: job.id, approved: decision.approved, reportHash: report.report_hash, attestationRef: model.data.chatId })
  if (!tx.data) return finish(proofHash, "needs_review", decision.reasons, { error: "resolve_failed" })
  return finish(proofHash, decision.approved ? "approved" : "rejected", decision.reasons, { tx: tx.data })
}
