import { fail } from "@/lib/api/respond"
import { sql } from "@/lib/db/sql"
import { readPhotoToken } from "@/lib/report/photo-token"

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const sha256 = readPhotoToken((await params).token)
  if (!sha256) return fail("This photo link has expired", 410)
  const [row] = await sql`select jpeg from photos where sha256 = ${sha256} and jpeg is not null`
  if (!row) return fail("Photo deleted", 404)
  return new Response(Buffer.from(row.jpeg as Uint8Array), {
    headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=600" },
  })
}
