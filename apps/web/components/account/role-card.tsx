import Link from "next/link"

import { CheckDot } from "@/components/ui/icons"
import type { Role } from "@/hooks/use-role"

export interface RoleCardAction {
  label: string
  onClick?: () => void
  href?: string
  busy?: boolean
}

export const ROLE_COPY: Record<Role, { tag: string; title: string; points: string[]; area: string; areaHref: string }> = {
  worker: {
    tag: "WORKER ACCOUNT",
    title: "Get paid to check places near you.",
    points: ["Pick a job near you. The pay is already set aside.", "Write the code we show you on paper and take the photos.", "Paid in USDC the moment your photos check out."],
    area: "Find jobs",
    areaHref: "/jobs",
  },
  client: {
    tag: "CLIENT ACCOUNT",
    title: "See it for yourself before you pay.",
    points: ["Post a check yourself, or let your AI agent post it.", "Someone nearby photographs it with a fresh code.", "Get a clear yes or no and a report you can share."],
    area: "Your checks",
    areaHref: "/agent",
  },
}

/** One side of the account setup screen. `highlight` marks the area being opened. */
export default function RoleCard({ role, highlight, status, action }: Readonly<{ role: Role; highlight: boolean; status?: string; action: RoleCardAction | null }>) {
  const copy = ROLE_COPY[role]
  const button = `m-btn flex h-14 w-full items-center justify-center rounded-full text-[16px] font-semibold no-underline disabled:opacity-60 ${highlight ? "bg-ink text-bone" : "bg-bone text-ink"}`
  return (
    <div className={`flex flex-col gap-6 rounded-[24px] p-7 md:p-9 ${highlight ? "bg-kola text-ink" : "bg-ink text-bone"}`}>
      <span className={`font-mono text-[12px] tracking-[0.08em] ${highlight ? "text-ink/70" : "text-muted"}`}>{copy.tag}</span>
      <h2 className="display m-0 text-[34px] leading-[0.95] md:text-[44px]">{copy.title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {copy.points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-[16px] leading-[1.45]"><span className="mt-0.5 shrink-0"><CheckDot ok size={18} /></span>{p}</li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        {status && <p className={`m-0 text-[14px] ${highlight ? "text-[#2B2414]" : "text-soft"}`}>{status}</p>}
        {action &&
          (action.href ? (
            <Link href={action.href} className={button}>{action.label}</Link>
          ) : (
            <button type="button" className={button} disabled={action.busy} onClick={action.onClick}>{action.busy ? "Confirm in your wallet…" : action.label}</button>
          ))}
      </div>
    </div>
  )
}
