import WorkerShell from "@/components/layout/worker-shell"

/** Job detail and capture: no tab bar, each screen has its own back or close button. */
export default function FlowLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkerShell>{children}</WorkerShell>
}
