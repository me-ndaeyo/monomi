import "server-only"
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const serverEnv = createEnv({
  server: {
    NEAR_RPC_URL: z.url().default("https://test.rpc.fastnear.com"),
    VERIFIER_ACCOUNT_ID: z.string().default("verifier.monomi.testnet"),
    VERIFIER_PRIVATE_KEY: z.string().startsWith("ed25519:"),
    NEARAI_API_KEY: z.string().min(1),
    NEARAI_VISION_MODEL: z.string().default("Qwen/Qwen3-VL-30B-A3B-Instruct"),
    ONECLICK_JWT: z.string().optional(),
    DATABASE_URL: z.url(),
    PHOTO_URL_SECRET: z.string().min(32),
    DEMO_AGENT_ACCOUNT_ID: z.string().default("demo-agent.monomi.testnet"),
    DEMO_AGENT_PRIVATE_KEY: z.string().startsWith("ed25519:"),
    DEMO_DAILY_CAP_USD: z.coerce.number().default(10),
    DEMO_ENABLED: z.stringbool().default(true),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
})
