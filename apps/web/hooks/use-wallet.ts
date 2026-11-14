"use client"

import { useContext } from "react"

import { WalletContext, type WalletState } from "@/lib/wallet/wallet-provider"

export function useWallet(): WalletState {
  const wallet = useContext(WalletContext)
  if (!wallet) throw new Error("useWallet must be used within a WalletProvider")
  return wallet
}
