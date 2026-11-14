import RoleGate from "@/components/layout/role-gate"
import TabBar from "@/components/layout/tab-bar"
import WorkerShell from "@/components/layout/worker-shell"

export default function WorkerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkerShell wide>
      <div className="pb-28 md:pb-0">
        <RoleGate role="worker">{children}</RoleGate>
      </div>
      <TabBar />
    </WorkerShell>
  )
}
