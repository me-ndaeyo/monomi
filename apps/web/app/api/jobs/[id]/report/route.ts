import { fail, ok, parseJobId } from "@/lib/api/respond"
import { verifyAuth } from "@/lib/auth/verify-nep413"
import { getJob } from "@/lib/near/contract"
import { getLatestReport } from "@/lib/report/get-report"
import { photoUrl } from "@/lib/report/photo-token"

/** Full report with photos, for the poster only. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) return fail("Unknown job", 404)
  const auth = await verifyAuth(request, "report", jobId)
  if (!auth.data) return fail(auth.error ?? "Not signed in", 401)
  const job = await getJob(jobId)
  if (!job || job.poster !== auth.data) return fail("Only the poster can see the photos", 403)
  const found = await getLatestReport(jobId)
  if (!found) return fail("No report yet", 404)
  const origin = new URL(request.url).origin
  return ok({ report: found.report, photos: found.photoHashes.map((h) => ({ url: origin + photoUrl(h) })) })
}
