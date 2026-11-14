import { notFound } from "next/navigation"

import { parseJobId } from "@/lib/api/respond"
import CaptureFlow from "./_components/capture-flow"

export default async function CapturePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const jobId = parseJobId((await params).id)
  if (jobId === null) notFound()
  return <CaptureFlow jobId={jobId} />
}
