import { notFound } from "next/navigation"

import { parseJobId } from "@/lib/api/respond"
import JobDetailView from "./_components/job-detail-view"

export default async function JobPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) notFound()
  return <JobDetailView jobId={jobId} />
}
