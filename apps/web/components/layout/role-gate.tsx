"use client"

import { useState } from "react"

import RoleCard, { ROLE_COPY, type RoleCardAction } from "@/components/account/role-card"
import { useRole, type Role } from "@/hooks/use-role"
import { useWallet } from "@/hooks/use-wallet"

const OTHER: Record<Role, Role> = { worker: "client", client: "worker" }

/** One wallet account, one role: workers can't post checks and clients can't take jobs. */
export default function RoleGate({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  const wallet = useWallet()
  const current = useRole()
  const [choosing, setChoosing] = useState<Role | null>(null)

  if (current.isLoading) return <div className="m-6 h-[60dvh] animate-pulse rounded-[24px] bg-sand" aria-busy="true" />
  if (wallet.accountId && current.role === role) return <>{children}</>

  const account = wallet.accountId
  const choose = async (r: Role) => {
    setChoosing(r)
    await current.choose(r)
    setChoosing(null)
  }
  const actionFor = (r: Role): RoleCardAction | null => {
    if (!account) return { label: "Connect a wallet", onClick: wallet.connect }
    if (current.role === null) return { label: r === "worker" ? "Use this account to earn" : "Use this account to post checks", onClick: () => void choose(r), busy: choosing === r }
    if (current.role === r) return { label: ROLE_COPY[r].area, href: ROLE_COPY[r].areaHref }
    return { label: "Switch wallet account", onClick: () => void wallet.disconnect() }
  }
  const statusFor = (r: Role): string | undefined => {
    if (!account || current.role === null) return undefined
    return current.role === r ? `${account} is set up for this.` : `${account} is a ${current.role} account, so it can't do this.`
  }

  const heading = !account
    ? "Connect a wallet to continue."
    : current.role === null
      ? "What will this account do?"
      : `This is a ${current.role} account.`
  const sub = !account
    ? "Your NEAR wallet is your Monomi account. No names, emails or phone numbers."
    : current.role === null
      ? "You choose once. Monomi keeps the people who pay for checks and the people who do them on separate accounts, so nobody can check their own job."
      : `To ${role === "worker" ? "take jobs" : "post checks"}, connect a different wallet account. Each account does one of the two.`

  return (
    <section className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-10 md:py-16">
      <div className="flex max-w-[720px] flex-col gap-3">
        <span className="font-mono text-[12px] tracking-[0.08em] text-muted-light">{account ? account.toUpperCase() : "NEAR TESTNET"}</span>
        <h1 className="display m-0 text-[40px] leading-[0.95] md:text-[64px]">{heading}</h1>
        <p className="m-0 text-[16px] leading-relaxed text-muted-light md:text-[18px]">{sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[role, OTHER[role]].map((r) => (
          <RoleCard key={r} role={r} highlight={r === role} status={statusFor(r)} action={actionFor(r)} />
        ))}
      </div>
      {current.error && <p role="alert" className="m-0 text-[14px] text-fail-light">{current.error}</p>}
    </section>
  )
}
