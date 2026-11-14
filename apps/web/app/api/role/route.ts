import { z } from "zod"

import { fail, ok } from "@/lib/api/respond"
import { verifyAuth } from "@/lib/auth/verify-nep413"
import { sql } from "@/lib/db/sql"

const ROLES = ["worker", "client"] as const

export async function GET(request: Request) {
  const account = new URL(request.url).searchParams.get("account") ?? ""
  if (!account) return fail("Missing account")
  const [row] = await sql`select role from account_roles where account = ${account}`
  return ok({ role: row ? String(row.role) : null })
}

/** Sets the account's role once. Signed by the account (NEP-413, job id 0). */
export async function POST(request: Request) {
  const body = z.object({ role: z.enum(ROLES) }).safeParse(await request.json().catch(() => null))
  if (!body.success) return fail("Pick earning or posting checks")
  const auth = await verifyAuth(request, "role", 0)
  if (!auth.data) return fail(auth.error ?? "Not signed in", 401)
  await sql`insert into account_roles (account, role) values (${auth.data}, ${body.data.role}) on conflict (account) do nothing`
  const [row] = await sql`select role from account_roles where account = ${auth.data}`
  return ok({ role: String(row?.role) })
}
