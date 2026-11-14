import { generateCode } from "verifier"

import { fail, ok, parseJobId } from "@/lib/api/respond"
import { verifyAuth } from "@/lib/auth/verify-nep413"
import { sql } from "@/lib/db/sql"
import { getJob } from "@/lib/near/contract"

const CODE_TTL_MS = 10 * 60_000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) return fail("Unknown job", 404)
  const auth = await verifyAuth(request, "challenge", jobId)
  if (!auth.data) return fail(auth.error ?? "Not signed in", 401)

  const job = await getJob(jobId)
  if (!job || job.status !== "Claimed" || job.worker !== auth.data) {
    return fail("Take this job first, then ask for a code", 409)
  }
  await sql`
    update challenges set superseded = true
    where job_id = ${jobId} and worker = ${auth.data} and not used`
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  await sql`
    insert into challenges (job_id, worker, code, expires_at)
    values (${jobId}, ${auth.data}, ${code}, ${expiresAt.toISOString()})`
  return ok({ code, expires_at: expiresAt.toISOString() })
}
