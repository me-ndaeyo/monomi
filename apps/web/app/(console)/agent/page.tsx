import type { Metadata } from "next"

import AgentConsole from "./_components/agent-console"

export const metadata: Metadata = { title: "Agent console" }

export default function AgentPage() {
  return <AgentConsole />
}
