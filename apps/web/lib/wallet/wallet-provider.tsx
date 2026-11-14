"use client"

import "@near-wallet-selector/modal-ui/styles.css"

import { setupWalletSelector, type WalletSelector } from "@near-wallet-selector/core"
import { setupHotWallet } from "@near-wallet-selector/hot-wallet"
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui"
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet"
import { actionCreators } from "@near-js/transactions"
import { createContext, useCallback, useEffect, useMemo, useState } from "react"

import { clientEnv } from "@/config/env/client"
import { ESCROW } from "@/lib/near/contract"

export interface CallInput {
  receiverId: string
  method: string
  args: Record<string, unknown>
  deposit?: bigint
  gas?: bigint
}

export interface WalletState {
  accountId: string | null
  isReady: boolean
  connect: () => void
  disconnect: () => Promise<void>
  call: (input: CallInput) => Promise<string | null>
  signMessage: (message: string, nonce: Uint8Array) => Promise<{ publicKey: string; signature: string }>
}

export const WalletContext = createContext<WalletState | null>(null)

const DEFAULT_GAS = 100_000_000_000_000n

export function WalletProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [selector, setSelector] = useState<WalletSelector | null>(null)
  const [modal, setModal] = useState<WalletSelectorModal | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    void setupWalletSelector({
      network: clientEnv.NEXT_PUBLIC_NEAR_NETWORK,
      modules: [setupHotWallet(), setupMyNearWallet()],
    }).then((ws) => {
      setSelector(ws)
      setModal(setupModal(ws, { contractId: ESCROW, theme: "light" }))
      const subscription = ws.store.observable.subscribe((state) => {
        setAccountId(state.accounts.find((a) => a.active)?.accountId ?? null)
      })
      unsubscribe = () => subscription.unsubscribe()
    })
    return () => unsubscribe?.()
  }, [])

  const call = useCallback(
    async ({ receiverId, method, args, deposit = 0n, gas = DEFAULT_GAS }: CallInput) => {
      if (!selector) throw new Error("Wallet is still loading")
      const wallet = await selector.wallet()
      const outcome = await wallet.signAndSendTransaction({
        receiverId,
        actions: [actionCreators.functionCall(method, args, gas, deposit)],
      })
      // Browser wallets redirect away to sign and return no outcome here.
      if (!outcome) return null
      const failure = JSON.stringify(outcome.status).includes("Failure")
      if (failure) throw new Error(readFailure(outcome.status))
      return outcome.transaction.hash
    },
    [selector]
  )

  const signMessage = useCallback(
    async (message: string, nonce: Uint8Array) => {
      if (!selector) throw new Error("Wallet is still loading")
      const wallet = await selector.wallet()
      const signed = await wallet.signMessage({ message, recipient: "monomi", nonce: Buffer.from(nonce) })
      if (!signed) throw new Error("Your wallet did not sign. Try again.")
      return { publicKey: signed.publicKey, signature: signed.signature }
    },
    [selector]
  )

  const value = useMemo<WalletState>(
    () => ({
      accountId,
      isReady: selector !== null,
      connect: () => modal?.show(),
      disconnect: async () => {
        if (selector) await (await selector.wallet()).signOut()
      },
      call,
      signMessage,
    }),
    [accountId, selector, modal, call, signMessage]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

function readFailure(status: unknown): string {
  const text = JSON.stringify(status)
  const match = /"ExecutionError":"([^"]+)"/.exec(text)
  return match?.[1]?.replace(/^Smart contract panicked: /, "") ?? "The transaction failed"
}
