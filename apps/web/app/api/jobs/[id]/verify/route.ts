import { fail, ok, parseJobId } from "@/lib/api/respond"
import { verifyAuth } from "@/lib/auth/verify-nep413"
import { sql } from "@/lib/db/sql"
import { getJob } from "@/lib/near/contract"
import { runVerification } from "@/lib/verify/run-verification"

export const maxDuration = 120

type Params = { params: Promise<{ id: string }> }

/** Latest check result for a job. Public: reasons only, no photos. */
export async function GET(_request: Request, { params }: Params) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) return fail("Unknown job", 404)
  const [row] = await sql`
    select status, reasons, proof_hash from verifications
    where job_id = ${jobId} order by updated_at desc limit 1`
  return ok(row ? { status: String(row.status), reasons: row.reasons as string[], proof_hash: String(row.proof_hash) } : null)
}

/** Runs the checks once per proof. A row lock makes repeat calls return the stored result. */
export async function POST(request: Request, { params }: Params) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) return fail("Unknown job", 404)
  const auth = await verifyAuth(request, "verify", jobId)
  if (!auth.data) return fail(auth.error ?? "Not signed in", 401)

  const job = await getJob(jobId)
  if (!job?.proof_hash || job.worker !== auth.data) {
    return fail("No submitted proof for this job", 409)
  }
  const [bundle] = await sql`
    select proof_hash from proof_bundles
    where proof_hash = ${job.proof_hash} and job_id = ${jobId} and worker = ${auth.data}`
  if (!bundle) return fail("The proof on-chain does not match an upload", 409)

  const stored = async () => {
    const [row] = await sql`select status, reasons from verifications where proof_hash = ${job.proof_hash}`
    return ok({ status: String(row?.status ?? job.status), reasons: (row?.reasons as string[]) ?? [] })
  }
  if (job.status !== "Submitted") return stored()
  const locked = await sql`
    insert into verifications (proof_hash, job_id, status) values (${job.proof_hash}, ${jobId}, 'running')
    on conflict (proof_hash) do nothing returning proof_hash`
  if (locked.length === 0) return stored()
  return ok(await runVerification(job, job.proof_hash))
}
