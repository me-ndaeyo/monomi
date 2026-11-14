import { CheckDot } from "@/components/ui/icons"

/** Illustrations for the landing tabs (approved designs, not live data). */
export function EarnVisual() {
  return (
    <div className="relative mx-auto h-[330px] w-full max-w-[320px]" aria-hidden="true">
      <div className="m-float absolute left-1/2 top-0 -ml-[110px] h-[330px] w-[220px] rounded-t-[34px] bg-ink p-[9px] pb-0">
        <div className="flex h-full flex-col overflow-hidden rounded-t-[26px] bg-bone">
          <div className="relative h-[120px] bg-sand">
            <span className="absolute left-[92px] top-[66px] h-3 w-3 rounded-full border-[3px] border-white bg-indigo" />
            <span className="absolute left-[124px] top-[22px] rounded-[7px] bg-ink px-1.5 py-[3px] text-[10px] font-bold text-kola">15.00</span>
          </div>
          <div className="flex flex-col gap-2 px-2.5 py-3 text-ink">
            <div className="flex flex-col gap-1 rounded-xl bg-kola p-2.5"><span className="display text-[19px]">15.00 USDC</span><span className="text-[12px] font-medium">Is Adeyemi Foods&apos; warehouse real?</span></div>
            <div className="flex flex-col gap-1 rounded-xl border border-card-line bg-white p-2.5"><span className="display text-[16px]">4.00 USDC</span><span className="text-[12px] font-medium">Is Mama Bisi Pharmacy open?</span></div>
          </div>
        </div>
      </div>
      <div className="m-toast absolute bottom-[30px] right-0 flex items-center gap-2.5 rounded-2xl bg-ink px-3.5 py-3 text-bone">
        <CheckDot ok size={24} />
        <span className="flex flex-col"><span className="display text-[18px] text-kola">+15.00 USDC</span><span className="text-[12px] text-soft">Your photos checked out</span></span>
      </div>
    </div>
  )
}

export function AgentVisual() {
  return (
    <div className="flex flex-col gap-3 text-[15px]" aria-hidden="true">
      <div className="m-rise m-d4 self-end rounded-2xl bg-ink px-4 py-3 text-bone"><span className="block font-mono text-[11px] text-muted">YOUR AGENT</span>Before I send the $20,000 deposit, is Adeyemi Foods&apos; warehouse in Ogbomosho real and stocked?</div>
      <div className="m-rise rounded-2xl bg-bone px-4 py-3 text-ink" style={{ animationDelay: "1.95s" }}>
        <div className="flex justify-between font-mono text-[11px] text-muted-light"><span>MONOMI · 12 MIN LATER</span><span className="text-pass-light">Verified</span></div>
        Yes. The sign matches, stock is visible inside the gate, and the photos were taken 41 m from the address.
      </div>
      <div className="m-rise self-end rounded-2xl bg-ink px-4 py-3 text-bone" style={{ animationDelay: "2.7s" }}>Confirmed. Sending the deposit.</div>
    </div>
  )
}

export function BusinessVisual() {
  const rows = ["Taken at the address, 41 m away", "Taken today, 2 minutes after the code", "The sign reads ADEYEMI FOODS"]
  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-bone p-5 text-ink" aria-hidden="true">
      <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-muted-light">CHECK REPORT</span><span className="m-stamp rounded-md border-2 border-pass-light px-2 py-0.5 font-mono text-[12px] font-bold text-pass-light">Yes, it&apos;s real</span></div>
      <span className="text-[17px] font-semibold">Adeyemi Foods warehouse, Ogbomosho</span>
      <ul className="rise-rows m-0 flex list-none flex-col gap-2 p-0 text-[14px]">
        {rows.map((r) => <li key={r} className="flex items-center gap-2"><CheckDot ok size={18} />{r}</li>)}
      </ul>
      <div className="flex justify-between border-t border-card-line pt-3 text-[13px]"><span>Paid 15.00 USDC</span><span className="text-indigo">Share report</span></div>
    </div>
  )
}
