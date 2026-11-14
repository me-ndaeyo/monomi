"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { JOBS_QUERY_KEY } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { ESCROW } from "@/lib/near/contract"
import { requestCode, runVerify, uploadProof, type VerifyResult } from "../_lib/api"

export type SendStage = "idle" | "uploading" | "signing" | "checking"

export function useCaptureFlow(jobId: number) {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null)
  const [stage, setStage] = useState<SendStage>("idle")
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const guard = async (work: () => Promise<void>) => {
    setError(null)
    try {
      await work()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setStage("idle")
    }
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })

  return {
    code,
    stage,
    result,
    error,
    getCode: () =>
      guard(async () => {
        const fresh = await requestCode(wallet, jobId)
        setCode({ code: fresh.code, expiresAt: Date.parse(fresh.expires_at) })
        setResult(null)
      }),
    send: (photos: Blob[], position: GeolocationPosition) =>
      guard(async () => {
        setStage("uploading")
        const { proof_hash } = await uploadProof(wallet, jobId, photos, position)
        setStage("signing")
        await wallet.call({ receiverId: ESCROW, method: "submit_proof", args: { job_id: jobId, proof_hash } })
        setStage("checking")
        setResult(await runVerify(wallet, jobId))
        setCode(null)
        setStage("idle")
        await refresh()
      }),
    check: () =>
      guard(async () => {
        setStage("checking")
        setResult(await runVerify(wallet, jobId))
        setStage("idle")
        await refresh()
      }),
    chain: (method: "appeal" | "escalate" | "retry_transfer" | "abandon") =>
      guard(async () => {
        await wallet.call({ receiverId: ESCROW, method, args: { job_id: jobId } })
        await refresh()
      }),
  }
}
