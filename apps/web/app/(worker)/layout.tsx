import TabBar from "@/components/layout/tab-bar"
import WorkerShell from "@/components/layout/worker-shell"

export default function WorkerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkerShell>
      <div className="pb-28">{children}</div>
      <TabBar />
    </WorkerShell>
  )
}
