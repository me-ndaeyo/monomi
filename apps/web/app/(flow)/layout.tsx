import RoleGate from "@/components/layout/role-gate"
import WorkerShell from "@/components/layout/worker-shell"

/** Job detail and capture: no tab bar on phones, each screen has its own back or close button. */
export default function FlowLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WorkerShell>
      <RoleGate role="worker">{children}</RoleGate>
    </WorkerShell>
  )
}
