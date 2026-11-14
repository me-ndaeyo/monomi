import { z } from "zod"

import { fail, ok } from "@/lib/api/respond"
import { CHAINS, dryQuote, type Chain } from "@/lib/oneclick/quote"

const Body = z.object({
  chain: z.enum(Object.keys(CHAINS) as [Chain, ...Chain[]]),
  address: z.string().trim().min(1),
  amount: z.string().regex(/^\d+$/),
})

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null))
  if (!body.success) return fail("Pick a chain, an address and an amount")
  const { chain, address, amount } = body.data
  if (!CHAINS[chain].address.test(address)) return fail("That address doesn't look right for this chain")
  const quote = await dryQuote(chain, address, amount)
  return quote.data ? ok(quote.data) : fail(quote.error ?? "No quote right now", 502)
}
