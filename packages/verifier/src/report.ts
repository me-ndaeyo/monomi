import type { Attestation, ChatSignature } from "./attestation"
import type { DeterministicChecks } from "./checks"
import type { Decision } from "./decide"
import type { ModelAnswers } from "./model"
import { canonicalJson, sha256Hex } from "./proof"

export const REPORT_VERSION = 1

export interface BuildReportInput {
  jobId: number
  decision: Decision
  checks: DeterministicChecks
  model: { name: string; chatId: string; answers: ModelAnswers }
  attestation: Pick<
    Attestation,
    "signing_address" | "signing_algo" | "report_sha256"
  >
  signature: Pick<ChatSignature, "signature" | "matches">
  capture: { lat: number; lng: number }
  timestamps: {
    challengeIssuedMs: number
    capturedMs: number
    verifiedMs: number
  }
}

export interface Report {
  version: number
  job_id: number
  approved: boolean
  reasons: string[]
  checks: DeterministicChecks
  model: { name: string; chat_id: string; answers: ModelAnswers }
  attestation: {
    signing_address: string
    signing_algo: "ecdsa" | "ed25519"
    report_sha256: string
    signature: string
    signature_matches: boolean
  }
  location: { lat: number; lng: number }
  timestamps: { challenge_issued: string; captured: string; verified: string }
  report_hash: string
}

const roundCoarse = (value: number) => Math.round(value * 100) / 100
const iso = (ms: number) => new Date(ms).toISOString()

export function computeReportHash(report: Omit<Report, "report_hash">): string {
  return sha256Hex(canonicalJson(report))
}

export function buildReport(input: BuildReportInput): Report {
  const body: Omit<Report, "report_hash"> = {
    version: REPORT_VERSION,
    job_id: input.jobId,
    approved: input.decision.approved,
    reasons: input.decision.reasons,
    checks: input.checks,
    model: {
      name: input.model.name,
      chat_id: input.model.chatId,
      answers: input.model.answers,
    },
    attestation: {
      ...input.attestation,
      signature: input.signature.signature,
      signature_matches: input.signature.matches,
    },
    location: {
      lat: roundCoarse(input.capture.lat),
      lng: roundCoarse(input.capture.lng),
    },
    timestamps: {
      challenge_issued: iso(input.timestamps.challengeIssuedMs),
      captured: iso(input.timestamps.capturedMs),
      verified: iso(input.timestamps.verifiedMs),
    },
  }
  return { ...body, report_hash: computeReportHash(body) }
}
