import { z } from "zod"

import { serverEnv } from "@/config/env/server"
import { fail, ok } from "@/lib/api/respond"
import { withinDailyLimit } from "@/lib/api/rate-limit"
import { postDemoJob } from "@/lib/near/post-demo-job"

const Body = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  account: z.string().min(2).max(64),
})

const DEMO_JOB_USD = 0.5

export async function POST(request: Request) {
  if (!serverEnv.DEMO_ENABLED) return fail("Test jobs are switched off right now", 503)
  const body = Body.safeParse(await request.json().catch(() => null))
  if (!body.success) return fail("Allow location and connect a wallet first")
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const dailyJobs = Math.floor(serverEnv.DEMO_DAILY_CAP_USD / DEMO_JOB_USD)
  const allowed =
    (await withinDailyLimit(`demo:wallet:${body.data.account}`, 1)) &&
    (await withinDailyLimit(`demo:ip:${ip}`, 3)) &&
    (await withinDailyLimit("demo:total", dailyJobs))
  if (!allowed) return fail("You've used today's test job. Come back tomorrow.", 429)
  try {
    const job = await postDemoJob(body.data.lat, body.data.lng)
    return job.data === null ? fail(job.error ?? "Could not post", 502) : ok({ job_id: job.data })
  } catch (error) {
    console.error("[demo-job] post failed", error instanceof Error ? error.message : "unknown")
    return fail("The test job could not be posted. Try again in a minute.", 502)
  }
}
