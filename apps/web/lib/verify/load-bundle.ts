import "server-only"

import { sql } from "@/lib/db/sql"

export async function loadBundle(proofHash: string) {
  const [row] = await sql`
    select b.photo_sha256s, b.lat, b.lng, b.accuracy_m, b.server_ts, c.code, c.issued_at
    from proof_bundles b join challenges c on c.id = b.challenge_id
    where b.proof_hash = ${proofHash}`
  if (!row) return null
  const photoHashes = row.photo_sha256s as string[]
  const photos = await sql`
    select sha256, jpeg from photos where sha256 = any(${photoHashes}) order by position`
  const reused = await sql`
    select sha256 from photos where sha256 = any(${photoHashes}) and proof_hash <> ${proofHash}`
  return {
    code: String(row.code),
    capture: { lat: Number(row.lat), lng: Number(row.lng), accuracy_m: Number(row.accuracy_m) },
    serverTsMs: new Date(String(row.server_ts)).getTime(),
    challengeIssuedAtMs: new Date(String(row.issued_at)).getTime(),
    photoHashes,
    usedPhotoHashes: reused.map((r) => String(r.sha256)),
    images: photos.map((p) => Buffer.from(p.jpeg as Uint8Array).toString("base64")),
  }
}
