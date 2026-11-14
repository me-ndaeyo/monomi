import DesktopNav from "./desktop-nav"

/** Phone-first worker screens; on desktop a top nav and wider layouts take over. */
export default function WorkerShell({ children, wide = false }: Readonly<{ children: React.ReactNode; wide?: boolean }>) {
  return (
    <div className="min-h-dvh bg-bone text-ink">
      <DesktopNav />
      <div className={`relative mx-auto min-h-dvh max-w-[480px] md:min-h-[calc(100dvh-64px)] ${wide ? "md:max-w-none" : "md:max-w-[720px]"}`}>{children}</div>
    </div>
  )
}
