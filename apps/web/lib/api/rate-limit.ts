import "server-only"

import { sql } from "@/lib/db/sql"

/** Counts one use of `key` today and says whether it is still within `limit`. */
export async function withinDailyLimit(key: string, limit: number) {
  const [row] = await sql`select bump_rate_limit(${key}) as count`
  return Number(row?.count ?? limit + 1) <= limit
}
