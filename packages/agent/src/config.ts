import { z } from "zod"

import type { Result } from "./types.js"

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value)

const withDefault = (fallback: string) =>
  z.preprocess(emptyAsUndefined, z.string().default(fallback))

const usd = (fallback: number) =>
  z.preprocess(emptyAsUndefined, z.coerce.number().positive().default(fallback))

const envSchema = z.object({
  NEAR_RPC_URL: withDefault("https://rpc.testnet.near.org"),
  MONOMI_CONTRACT_ID: withDefault("escrow.monomi.testnet"),
  USDC_CONTRACT_ID: withDefault("tusdc.monomi.testnet"),
  MONOMI_API_URL: withDefault("http://localhost:3000"),
  DEMO_AGENT_ACCOUNT_ID: withDefault("demo-agent.monomi.testnet"),
  DEMO_AGENT_PRIVATE_KEY: z.templateLiteral(["ed25519:", z.string()]),
  NEARAI_API_KEY: z.preprocess(emptyAsUndefined, z.string().optional()),
  NEARAI_AGENT_MODEL: withDefault("Qwen/Qwen3.8-27B"),
  AGENT_PER_JOB_CAP_USD: usd(25),
  AGENT_DAILY_CAP_USD: usd(50),
})

export type AgentConfig = z.infer<typeof envSchema>

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env
): Result<AgentConfig> {
  const parsed = envSchema.safeParse(env)
  if (parsed.success) return { data: parsed.data, error: null }
  // Name the failing variables only, never their values.
  const names = parsed.error.issues.map((issue) => issue.path.join("."))
  return { data: null, error: `Missing or invalid env: ${names.join(", ")}` }
}
