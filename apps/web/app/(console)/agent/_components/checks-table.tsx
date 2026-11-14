"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { JOBS_QUERY_KEY } from "@/hooks/use-chain"
import { STATUS_LABEL } from "@/lib/format/job-status"
import { formatUsdc } from "@/lib/format/usdc"
import { getJobs } from "@/lib/near/contract"

export default function ChecksTable({ account }: Readonly<{ account: string }>) {
  const { data, isLoading, error } = useQuery({ queryKey: [...JOBS_QUERY_KEY, "poster", account], queryFn: () => getJobs({ poster: account }), refetchInterval: 15_000 })
  if (isLoading) return <div className="h-40 animate-pulse rounded-[20px] bg-sand" />
  if (error) return <p className="rounded-2xl bg-fail-light/10 p-5 text-fail-light">Could not load your checks from NEAR. {error.message}</p>
  if (!data?.length)
    return (
      <div className="rounded-[20px] border border-card-line bg-white p-6 text-[15px] text-muted-light">
        No checks yet. <Link href="/checks/new" className="text-indigo">Post your first check</Link> or connect an agent below.
      </div>
    )
  return (
    <div className="overflow-x-auto rounded-[20px] border border-card-line bg-white">
      <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
        <thead className="text-[12px] text-muted-light"><tr><th className="p-4 font-medium">Place</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Pay</th><th className="p-4" /></tr></thead>
        <tbody>
          {data.map((job) => (
            <tr key={job.id} className="border-t border-card-line">
              <td className="p-4"><span className="font-semibold">{job.spec.title}</span><br /><span className="text-[12px] text-muted-light">Job #{job.id}</span></td>
              <td className="p-4">{STATUS_LABEL[job.status]}</td>
              <td className="p-4 font-mono">{formatUsdc(job.amount)}</td>
              <td className="p-4 text-right"><Link href={`/report/${job.id}`} className="text-indigo">See the report</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
