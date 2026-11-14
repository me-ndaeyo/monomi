import type { Metadata } from "next"

import JobsView from "./_components/jobs-view"

export const metadata: Metadata = { title: "Jobs near you" }

export default function JobsPage() {
  return <JobsView />
}
