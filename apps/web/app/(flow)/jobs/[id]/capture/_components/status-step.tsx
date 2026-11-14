import Link from "next/link"

import { CloseIcon } from "@/components/ui/icons"

interface StatusAction {
  label: string
  onClick?: () => void
  href?: string
}

interface StatusStepProps {
  jobId: number
  tone: "fail" | "neutral"
  title: string
  body: string
  reasons?: string[]
  primary?: StatusAction
  secondary?: StatusAction
  error?: string | null
}

const PRIMARY = "flex h-[58px] w-full items-center justify-center rounded-[18px] bg-ink text-[17px] font-semibold text-bone no-underline"
const SECONDARY = "flex h-[52px] w-full items-center justify-center rounded-2xl border-[1.5px] border-ink text-[15px] font-semibold text-ink no-underline"

function Action({ action, className }: Readonly<{ action: StatusAction; className: string }>) {
  return action.href ? (
    <Link href={action.href} className={className}>{action.label}</Link>
  ) : (
    <button type="button" onClick={action.onClick} className={className}>{action.label}</button>
  )
}

/** Code request, rejection, review and payout states share this screen. */
export default function StatusStep({ jobId, tone, title, body, reasons = [], primary, secondary, error }: Readonly<StatusStepProps>) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 bg-bone px-5 pb-6 pt-[18px]">
      <Link href={`/jobs/${jobId}`} aria-label="Close" className="flex h-[46px] w-[46px] items-center justify-center self-end rounded-full bg-ink/10"><CloseIcon color="#0B0C0A" /></Link>
      <div className="flex flex-col gap-3">
        <h1 className={`display m-0 text-[36px] leading-[0.95] ${tone === "fail" ? "text-fail-light" : ""}`}>{title}</h1>
        <p className="m-0 text-[16px] leading-[1.5] text-[#3D3B33]">{body}</p>
      </div>
      {reasons.length > 0 && (
        <ul className="rise-rows m-0 flex list-none flex-col gap-2 p-0">
          {reasons.map((r) => (
            <li key={r} className="rounded-2xl border border-fail-light/30 bg-white px-4 py-3 text-[15px] leading-snug">{r}</li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="m-0 text-[14px] text-fail-light">{error}</p>}
      <div className="mt-auto flex flex-col gap-2.5">
        {primary && <Action action={primary} className={PRIMARY} />}
        {secondary && <Action action={secondary} className={SECONDARY} />}
      </div>
    </div>
  )
}
