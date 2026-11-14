import Link from "next/link"

export default function Wordmark({ tone = "light", size = 22 }: Readonly<{ tone?: "light" | "dark"; size?: number }>) {
  const ink = tone === "light" ? "#EFEBE2" : "#0B0C0A"
  return (
    <Link href="/" className="flex items-center gap-2 no-underline" style={{ color: ink }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="12" stroke={ink} strokeWidth="2.2" />
        <circle cx="17.5" cy="11.5" r="4" fill="#F2A23A" />
      </svg>
      <span className="font-display text-[20px] font-bold tracking-[-0.03em]">monomi</span>
    </Link>
  )
}
