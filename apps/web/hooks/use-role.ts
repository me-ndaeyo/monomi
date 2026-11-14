"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useWallet } from "@/hooks/use-wallet"
import { authHeader } from "@/lib/wallet/auth-header"

export type Role = "worker" | "client"

interface Envelope {
  data: { role: Role | null } | null
  error: string | null
}

export function useRole() {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ["role", wallet.accountId],
    enabled: wallet.accountId !== null,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(`/api/role?account=${encodeURIComponent(wallet.accountId ?? "")}`)
      const body = (await res.json()) as Envelope
      if (!body.data) throw new Error(body.error ?? "Could not read your account type")
      return body.data.role
    },
  })

  const choose = async (role: Role) => {
    setError(null)
    try {
      const authorization = await authHeader(wallet, "role", 0)
      const res = await fetch("/api/role", { method: "POST", headers: { authorization, "content-type": "application/json" }, body: JSON.stringify({ role }) })
      const body = (await res.json()) as Envelope
      if (!body.data) throw new Error(body.error ?? "Could not save your choice")
      queryClient.setQueryData(["role", wallet.accountId], body.data.role)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your choice")
    }
  }

  return {
    role: query.data ?? null,
    isLoading: !wallet.isReady || (wallet.accountId !== null && query.isLoading),
    loadError: query.error ? query.error.message : null,
    error,
    choose,
  }
}
