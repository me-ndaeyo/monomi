import "server-only"
import { z } from "zod"

import { serverEnv } from "@/config/env/server"

const ONECLICK = "https://1click.chaindefuser.com/v0"
const MAINNET_USDC =
  "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
const EVM = /^0x[0-9a-fA-F]{40}$/

export const CHAINS = {
  base: { asset: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", address: EVM },
  arb: { asset: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", address: EVM },
  eth: { asset: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", address: EVM },
  sol: { asset: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", address: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
} as const
export type Chain = keyof typeof CHAINS

const Quote = z.object({
  quote: z.object({
    amountOutFormatted: z.string(),
    amountOutUsd: z.string().optional(),
    timeEstimate: z.number(),
    withdrawFee: z.string().optional(),
  }),
})

/**
 * Live 1Click quote with `dry: true`, so no funds move. 1Click runs on mainnet only
 * and rejects testnet refund accounts, so the preview names the mainnet `near` account.
 */
export async function dryQuote(chain: Chain, recipient: string, amount: string) {
  const response = await fetch(`${ONECLICK}/quote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(serverEnv.ONECLICK_JWT ? { authorization: `Bearer ${serverEnv.ONECLICK_JWT}` } : {}),
    },
    body: JSON.stringify({
      dry: true,
      swapType: "EXACT_INPUT",
      slippageTolerance: 100,
      originAsset: MAINNET_USDC,
      depositType: "ORIGIN_CHAIN",
      destinationAsset: CHAINS[chain].asset,
      amount,
      refundTo: "near",
      refundType: "ORIGIN_CHAIN",
      recipient,
      recipientType: "DESTINATION_CHAIN",
      deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
    }),
    cache: "no-store",
  })
  const body: unknown = await response.json().catch(() => null)
  const parsed = Quote.safeParse(body)
  if (!parsed.success) {
    const message = z.object({ message: z.string() }).safeParse(body)
    return { data: null, error: message.success ? message.data.message : "No quote right now" }
  }
  return { data: parsed.data.quote, error: null }
}
