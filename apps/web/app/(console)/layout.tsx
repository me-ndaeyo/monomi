import RoleGate from "@/components/layout/role-gate"
import ConsoleSidebar from "@/components/layout/console-sidebar"

export default function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-bone text-ink md:flex">
      <ConsoleSidebar />
      <main className="mx-auto w-full max-w-[1000px] px-4 py-8 md:px-10">
        <RoleGate role="client">{children}</RoleGate>
      </main>
    </div>
  )
}
