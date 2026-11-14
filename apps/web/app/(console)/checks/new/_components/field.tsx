export default function Field({ label, hint, error, children }: Readonly<{ label: string; hint?: string; error?: string; children: React.ReactNode }>) {
  return (
    <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
      {label}
      {children}
      {error ? <span className="font-normal text-fail-light">{error}</span> : hint ? <span className="font-normal text-muted-light">{hint}</span> : null}
    </label>
  )
}

export const INPUT = "h-12 rounded-xl border border-card-line bg-white px-3 text-[15px] font-normal"
