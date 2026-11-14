import type { Metadata } from "next"

import SlimFooter from "@/components/layout/slim-footer"
import SlimHeader from "@/components/layout/slim-header"
import TrySteps from "./_components/try-steps"

export const metadata: Metadata = { title: "Try it where you are" }

export default function TryPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-bone">
      <SlimHeader tone="light" action={<span className="rounded-full border border-line px-3 py-1.5 font-mono text-[12px] text-soft">Test mode · NEAR testnet</span>} />
      <main className="mx-auto w-full flex-1 grid max-w-[1200px] gap-10 px-4 py-10 lg:grid-cols-[1fr_520px]">
        <div className="flex flex-col gap-5">
          <h1 className="display m-rise m-0 text-[52px] leading-[0.92] sm:text-[72px]">Try the whole loop where you are.</h1>
          <p className="m-rise m-d1 m-0 max-w-[520px] text-[17px] leading-relaxed text-soft">You'll play both sides: someone who needs a place checked, and the person who checks it. It runs on NEAR testnet with test money, and takes about five minutes.</p>
          <div className="m-rise m-d2 flex max-w-[520px] flex-col gap-1 rounded-[20px] border border-line p-5">
            <span className="text-[15px] font-semibold">What you'll need</span>
            <span className="text-[15px] leading-relaxed text-soft">A NEAR testnet wallet, your phone's camera, and a pen and paper. You'll write MONOMI and a short code on the paper, then photograph it where you are.</span>
          </div>
        </div>
        <TrySteps />
      </main>
      <SlimFooter tone="light" />
    </div>
  )
}
