"use client"

import { useQuery } from "@tanstack/react-query"

import { getJob, getJobs, getUsdcBalance, getWorker } from "@/lib/near/contract"

export const JOBS_QUERY_KEY = ["jobs"]

export function useOpenJobs() {
  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, "open"],
    queryFn: () => getJobs({ status: "Open" }),
    refetchInterval: 20_000,
  })
}

export function useJob(jobId: number, refetchMs?: number) {
  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, jobId],
    queryFn: () => getJob(jobId),
    refetchInterval: refetchMs,
  })
}

export function useWorker(account: string | null) {
  return useQuery({
    queryKey: ["worker", account],
    queryFn: () => getWorker(account ?? ""),
    enabled: account !== null,
  })
}

/** Used by both the earnings pill on /jobs and the balance on /wallet. */
export function useUsdcBalance(account: string | null) {
  return useQuery({
    queryKey: ["usdc-balance", account],
    queryFn: () => getUsdcBalance(account ?? ""),
    enabled: account !== null,
    refetchInterval: 15_000,
  })
}
