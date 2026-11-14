import "server-only"
import type { Report } from "verifier"

import { sql } from "@/lib/db/sql"

/** Latest report for a job, the photo hashes behind it and the resolve tx. */
export async function getLatestReport(jobId: number) {
  const [row] = await sql`
    select r.report, b.photo_sha256s, v.resolve_tx from reports r
    join proof_bundles b on b.proof_hash = r.proof_hash
    left join verifications v on v.proof_hash = r.proof_hash
    where r.job_id = ${jobId} order by r.created_at desc limit 1`
  if (!row) return null
  return {
    report: row.report as Report,
    photoHashes: row.photo_sha256s as string[],
    resolveTx: row.resolve_tx ? String(row.resolve_tx) : null,
  }
}
