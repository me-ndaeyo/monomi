import type { JobStatus, PosterReport } from "./types.js"

export interface DecisionInput {
  report: PosterReport | null
  status: JobStatus | null
}

export function decideDeposit({ report, status }: DecisionInput): string {
  if (!report) {
    const state = status ? ` (job status: ${status})` : ""
    return `Do not pay: no verified report${state}`
  }
  if (report.report.approved && report.report.attestation.signature_matches) {
    return "Proceed with deposit"
  }
  const reasons = [...report.report.reasons]
  if (!report.report.attestation.signature_matches) {
    reasons.push("the model answer signature did not match the attested key")
  }
  if (reasons.length === 0) reasons.push("the check did not pass")
  return `Do not pay: ${reasons.join("; ")}`
}
