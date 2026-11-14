"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { WORKER_TABS } from "@/config/routes"
import { isTabActive } from "./active-tab"
import TabIcon from "./tab-icon"

export default function TabBar() {
  const pathname = usePathname()
  return (
    <nav aria-label="App" className="fixed inset-x-3 bottom-4 z-20 mx-auto grid md:hidden max-w-[456px] grid-cols-4 rounded-[22px] bg-ink p-2 shadow-[0_10px_30px_rgba(11,12,10,0.3)]">
      {WORKER_TABS.map((tab) => {
        const active = isTabActive(tab.url, pathname)
        return (
          <Link
            key={tab.url}
            href={tab.url}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-[3px] rounded-[15px] py-2 text-[12px] no-underline ${active ? "bg-kola font-bold text-ink" : "text-muted"}`}
          >
            <TabIcon name={tab.name} color={active ? "#0B0C0A" : "#9A9886"} />
            {tab.name}
          </Link>
        )
      })}
    </nav>
  )
}
