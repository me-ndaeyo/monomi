"use client"

import { useState } from "react"

export default function ShareButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
      }}
      className="h-11 rounded-full border border-card-line bg-white px-4 text-[14px] font-semibold"
    >
      {copied ? "Link copied" : "Share report"}
    </button>
  )
}
