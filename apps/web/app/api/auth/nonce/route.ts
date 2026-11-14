import { randomBytes } from "node:crypto"

import { ok } from "@/lib/api/respond"
import { sql } from "@/lib/db/sql"

export async function POST() {
  const nonce = randomBytes(16).toString("hex")
  await sql`insert into auth_nonces (nonce) values (${nonce})`
  return ok({ nonce })
}
