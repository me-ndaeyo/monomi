import "server-only"
import { neon } from "@neondatabase/serverless"

import { serverEnv } from "@/config/env/server"

export const sql = neon(serverEnv.DATABASE_URL)
