"use client"

import Link from "next/link"
import { useState } from "react"

import { MCP_CONFIG } from "@/config/mcp"
import { AgentVisual, BusinessVisual, EarnVisual } from "./tab-visuals"

const TABS = [
  {
    key: "earn",
    label: "I want to earn",
    title: "Get paid to check places near you.",
    steps: ["Open Monomi and pick a job near you. The pay is already set aside for you.", "Go there, write the code we show you on paper, and take the photos.", "When your photos check out, the money lands in your wallet. Cash out whenever you like."],
    primary: { label: "Find jobs near me", href: "/jobs" },
    secondary: { label: "How we keep you safe", href: "#safety" },
    Visual: EarnVisual,
  },
  {
    key: "agent",
    label: "I build AI agents",
    title: "Give your agent eyes on the ground.",
    steps: ["Add the Monomi MCP server to your agent. It's one config block.", "Your agent posts a job: where, what to photograph, and what it will pay. You set the spending limits.", "It gets back a verified report with the photos, then decides what to do next."],
    primary: { label: "Open the agent console", href: "/agent" },
    secondary: null,
    Visual: AgentVisual,
  },
  {
    key: "biz",
    label: "I run a business",
    title: "See it for yourself before you pay.",
    steps: ["Enter the address, what you need to see, and what you'll pay for the check.", "Someone nearby goes and photographs it, with a fresh code so the photos can't be old.", "You get a clear yes or no with the photos, and a report you can share. If nobody takes it, you get your money back."],
    primary: { label: "Post a check", href: "/checks/new" },
    secondary: { label: "See a sample report", href: "/report/sample" },
    Visual: BusinessVisual,
  },
] as const

export default function AudienceTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("earn")
  const [copied, setCopied] = useState(false)
  const tab = TABS.find((t) => t.key === active) ?? TABS[0]
  return (
    <section aria-label="Choose how you'll use Monomi" className="mx-auto mt-8 flex max-w-[1200px] flex-col gap-3.5 px-3 md:mt-12">
      <div role="tablist" aria-label="Who are you?" className="m-rise m-d3 flex gap-1.5 overflow-x-auto px-1 md:justify-center">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={active === t.key} aria-controls={`panel-${t.key}`} onClick={() => setActive(t.key)}
            className={`h-[46px] shrink-0 rounded-full px-[18px] text-[15px] font-semibold ${active === t.key ? "bg-kola text-ink" : "border border-line bg-ink-2 text-soft"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab.key} role="tabpanel" id={`panel-${tab.key}`} aria-labelledby={`tab-${tab.key}`} className="m-panel grid gap-6 rounded-[24px] bg-kola px-[22px] py-7 text-ink md:grid-cols-2 md:p-12">
        <div className="flex flex-col gap-6">
          <h2 className="display m-0 text-[36px] leading-[0.95] md:text-[56px]">{tab.title}</h2>
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {tab.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="display text-[22px] leading-none">{i + 1}</span><span className="text-[16px] leading-[1.45]">{s}</span></li>)}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Link href={tab.primary.href} className="m-btn flex h-14 items-center justify-center rounded-full bg-ink px-6 text-[16px] font-semibold text-bone no-underline">{tab.primary.label}</Link>
            {tab.secondary ? (
              <Link href={tab.secondary.href} className="flex h-14 items-center px-2 text-[16px] font-semibold text-ink underline">{tab.secondary.label}</Link>
            ) : (
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(MCP_CONFIG); setCopied(true) }} className="h-14 px-2 text-[16px] font-semibold underline">{copied ? "Copied" : "Copy MCP config"}</button>
            )}
          </div>
        </div>
        <tab.Visual />
      </div>
    </section>
  )
}
