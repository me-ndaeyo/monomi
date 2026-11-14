"use client"

import { NearConnector } from "@hot-labs/near-connect"
import { createContext, useCallback, useEffect, useMemo, useState } from "react"

import { clientEnv } from "@/config/env/client"

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
  const [connector, setConnector] = useState<NearConnector | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const nc = new NearConnector({ network: clientEnv.NEXT_PUBLIC_NEAR_NETWORK, features: { testnet: true } })
    nc.on("wallet:signIn", (event) => setAccountId(event.accounts[0]?.accountId ?? null))
    nc.on("wallet:signOut", () => setAccountId(null))
    nc.getConnectedWallet()
      .then(({ accounts }) => setAccountId(accounts[0]?.accountId ?? null))
      .catch(() => setAccountId(null))
      .finally(() => setIsReady(true))
    setConnector(nc)
    return () => nc.removeAllListeners()
  }, [])

  const call = useCallback(
    async ({ receiverId, method, args, deposit = 0n, gas = DEFAULT_GAS }: CallInput) => {
      if (!connector) throw new Error("Wallet is still loading")
      const wallet = await connector.wallet()
      const outcome = await wallet.signAndSendTransaction({
        receiverId,
        actions: [{ type: "FunctionCall", params: { methodName: method, args, gas: gas.toString(), deposit: deposit.toString() } }],
      })
      if (JSON.stringify(outcome.status).includes("Failure")) throw new Error(readFailure(outcome.status))
      return outcome.transaction.hash
    },
    [connector]
  )

  const signMessage = useCallback(
    async (message: string, nonce: Uint8Array) => {
      if (!connector) throw new Error("Wallet is still loading")
      const wallet = await connector.wallet()
      const signed = await wallet.signMessage({ message, recipient: "monomi", nonce })
      return { publicKey: signed.publicKey, signature: signed.signature }
    },
    [connector]
  )

  const value = useMemo<WalletState>(
    () => ({
      accountId,
      isReady,
      connect: () => void connector?.connect().catch(() => undefined),
      disconnect: async () => {
        await connector?.disconnect()
        setAccountId(null)
      },
      call,
      signMessage,
    }),
    [accountId, isReady, connector, call, signMessage]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

function readFailure(status: unknown): string {
  const match = /"ExecutionError":"([^"]+)"/.exec(JSON.stringify(status))
  return match?.[1]?.replace(/^Smart contract panicked: /, "") ?? "The transaction failed"
}
