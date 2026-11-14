"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { JOBS_QUERY_KEY } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { ESCROW, USDC, isUsdcRegistered } from "@/lib/near/contract"

const STORAGE_DEPOSIT = 1_250_000_000_000_000_000_000n

/** Registers the worker on the token first so the payout can't bounce, then claims. */
export function useClaim(jobId: number) {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const run = async (method: "claim" | "release_stale_claim" | "expire") => {
    if (!wallet.accountId) return wallet.connect()
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      if (method === "claim" && !(await isUsdcRegistered(wallet.accountId))) {
        await wallet.call({ receiverId: USDC, method: "storage_deposit", args: { account_id: wallet.accountId }, deposit: STORAGE_DEPOSIT })
      }
      await wallet.call({ receiverId: ESCROW, method, args: { job_id: jobId } })
      await queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ["worker", wallet.accountId] })
      return true
    } catch (error) {
      setSubmitError(friendly(error))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { run, isSubmitting, submitError }
}

function friendly(error: unknown): string {
  const text = error instanceof Error ? error.message : "Something went wrong"
  if (/NotEnoughBalance|LackBalanceForState|balance/i.test(text)) {
    return "Your wallet needs about 0.01 NEAR for fees. Get free testnet NEAR at near-faucet.io, then try again."
  }
  return text
}
