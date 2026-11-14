"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useWallet } from "@/hooks/use-wallet"
import { USDC } from "@/lib/near/contract"

/** Mints 25 test USDC to the connected wallet (once per 24 h, enforced by the token). */
export function useFaucet() {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [state, setState] = useState<{ status: "idle" | "minting" | "done"; error: string | null }>({ status: "idle", error: null })

  const mint = async () => {
    if (!wallet.accountId) return wallet.connect()
    setState({ status: "minting", error: null })
    try {
      await wallet.call({ receiverId: USDC, method: "mint", args: { amount: "25000000" } })
      await queryClient.invalidateQueries({ queryKey: ["usdc-balance", wallet.accountId] })
      setState({ status: "done", error: null })
    } catch (error) {
      const text = error instanceof Error ? error.message : ""
      setState({ status: "idle", error: text.includes("One mint per day") ? "You already got test USDC today. Come back tomorrow." : "Mint failed. Your wallet needs a little testnet NEAR for fees (near-faucet.io)." })
    }
  }
  return { ...state, mint }
}
