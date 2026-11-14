/** Phone-first column on the bone background; a centered 480 px column on desktop. */
export default function WorkerShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-sand">
      <div className="relative mx-auto min-h-dvh max-w-[480px] overflow-hidden bg-bone text-ink">{children}</div>
    </div>
  )
}
