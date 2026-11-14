"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useWorker } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"

export default function ActivePage() {
  const router = useRouter()
  const wallet = useWallet()
  const worker = useWorker(wallet.accountId)
  const active = worker.data?.active_job ?? null

  useEffect(() => {
    if (active !== null) router.replace(`/jobs/${active}`)
  }, [active, router])

  if (wallet.accountId && (worker.isLoading || active !== null)) return <div className="h-dvh animate-pulse bg-sand" />
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="display m-0 text-[34px] leading-none">No job in progress</h1>
      <p className="m-0 text-[15px] text-muted-light">Pick a job near you. The pay is set aside before you go.</p>
      <Link href="/jobs" className="rounded-full bg-ink px-6 py-3.5 font-semibold text-bone no-underline">Find jobs</Link>
    </div>
  )
}
