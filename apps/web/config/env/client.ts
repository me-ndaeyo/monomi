import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_NEAR_NETWORK: z.literal("testnet").default("testnet"),
    NEXT_PUBLIC_NEAR_RPC_URL: z.url().default("https://rpc.testnet.near.org"),
    NEXT_PUBLIC_MONOMI_CONTRACT_ID: z.string().default("escrow.monomi.testnet"),
    NEXT_PUBLIC_USDC_CONTRACT_ID: z.string().default("tusdc.monomi.testnet"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_NEAR_NETWORK: process.env.NEXT_PUBLIC_NEAR_NETWORK,
    NEXT_PUBLIC_NEAR_RPC_URL: process.env.NEXT_PUBLIC_NEAR_RPC_URL,
    NEXT_PUBLIC_MONOMI_CONTRACT_ID: process.env.NEXT_PUBLIC_MONOMI_CONTRACT_ID,
    NEXT_PUBLIC_USDC_CONTRACT_ID: process.env.NEXT_PUBLIC_USDC_CONTRACT_ID,
  },
  emptyStringAsUndefined: true,
})
