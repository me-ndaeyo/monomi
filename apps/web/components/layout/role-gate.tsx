"use client"

import { useRole, type Role } from "@/hooks/use-role"
import { useWallet } from "@/hooks/use-wallet"

const COPY: Record<Role, { title: string; body: string; choose: string; other: string }> = {
  worker: {
    title: "Earn with Monomi",
    body: "Take checks near you and get paid in USDC. This wallet account will be your worker account.",
    choose: "Use this account to earn",
    other: "This account posts checks, so it can't take jobs. Sign out and connect a separate wallet account to earn.",
  },
  client: {
    title: "Post checks",
    body: "Pay someone nearby to check a place, yourself or through your AI agent. This wallet account will be your client account.",
    choose: "Use this account to post checks",
    other: "This account is a worker account, so it can't post checks. Sign out and connect a separate wallet account to post.",
  },
}

/** One wallet account, one role: workers can't post and clients can't take jobs. */
export default function RoleGate({ role, tone = "light", children }: Readonly<{ role: Role; tone?: "light" | "dark"; children: React.ReactNode }>) {
  const wallet = useWallet()
  const current = useRole()
  const copy = COPY[role]
  if (current.isLoading) return <div className="m-6 h-48 animate-pulse rounded-[20px] bg-sand" aria-busy="true" />
  const card = (body: React.ReactNode) => (
    <div className={`mx-auto my-16 flex max-w-[460px] flex-col gap-4 rounded-[24px] p-6 ${tone === "light" ? "border border-card-line bg-white text-ink" : "bg-ink-2 text-bone"}`}>
      <h1 className="display m-0 text-[32px] leading-none">{copy.title}</h1>
      {body}
      {current.error && <p role="alert" className="m-0 text-[14px] text-fail-light">{current.error}</p>}
    </div>
  )
  const button = "h-[52px] rounded-full bg-ink text-[16px] font-semibold text-bone"
  if (!wallet.accountId)
    return card(<><p className="m-0 text-[15px] text-muted-light">{copy.body}</p><button type="button" className={button} onClick={wallet.connect}>Connect wallet</button></>)
  if (current.role === null)
    return card(<><p className="m-0 text-[15px] text-muted-light">{copy.body} You choose once per account.</p><button type="button" className={button} onClick={() => void current.choose(role)}>{copy.choose}</button></>)
  if (current.role !== role)
    return card(<><p className="m-0 text-[15px] text-muted-light">{copy.other}</p><button type="button" className={button} onClick={() => void wallet.disconnect()}>Sign out</button></>)
  return <>{children}</>
}
