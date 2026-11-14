import { computeProofHash } from "verifier"
import { z } from "zod"

import { fail, ok, parseJobId } from "@/lib/api/respond"
import { verifyAuth } from "@/lib/auth/verify-nep413"
import { sql } from "@/lib/db/sql"
import { getJob } from "@/lib/near/contract"
import { preparePhotos } from "@/lib/verify/prepare-photos"

const Position = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy_m: z.coerce.number().positive().max(150, "GPS is not accurate enough. Move into the open and try again."),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) return fail("Unknown job", 404)
  const auth = await verifyAuth(request, "proof", jobId)
  if (!auth.data) return fail(auth.error ?? "Not signed in", 401)
  const worker = auth.data

  const form = await request.formData()
  const position = Position.safeParse(Object.fromEntries(form))
  if (!position.success) {
    return fail(position.error.issues[0]?.message ?? "Location is missing")
  }
  const job = await getJob(jobId)
  if (!job || job.status !== "Claimed" || job.worker !== worker) {
    return fail("This job is not waiting for your photos", 409)
  }
  const [challenge] = await sql`
    select id, code, issued_at from challenges
    where job_id = ${jobId} and worker = ${worker}
      and not used and not superseded and expires_at > now()
    order by id desc limit 1`
  if (!challenge) return fail("Your code expired. Get a new one.", 410)

  const files = form.getAll("photos").filter((f): f is File => f instanceof File)
  const photos = await preparePhotos(files)
  if (!photos.data) return fail(photos.error ?? "Photos are not valid")

  const serverTs = Date.now()
  const { lat, lng, accuracy_m } = position.data
  const photoHashes = photos.data.map((p) => p.sha256)
  const proofHash = computeProofHash({
    job_id: jobId,
    worker,
    code: String(challenge.code),
    photo_sha256s: photoHashes,
    lat,
    lng,
    accuracy_m,
    server_ts: serverTs,
  })
  await sql.transaction([
    sql`update challenges set used = true where id = ${challenge.id}`,
    sql`insert into proof_bundles
      (proof_hash, job_id, worker, challenge_id, photo_sha256s, lat, lng, accuracy_m, server_ts)
      values (${proofHash}, ${jobId}, ${worker}, ${challenge.id}, ${photoHashes},
        ${lat}, ${lng}, ${accuracy_m}, ${new Date(serverTs).toISOString()})`,
    ...photos.data.map(
      (p, i) => sql`insert into photos (sha256, proof_hash, position, jpeg)
        values (${p.sha256}, ${proofHash}, ${i}, ${p.jpeg})
        on conflict (sha256) do nothing`
    ),
  ])
  return ok({ proof_hash: proofHash })
}
