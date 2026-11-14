const HOW = [
  ["Money set aside", "Before anyone moves, the pay is locked away. Once someone takes the job, nobody can pull it back."],
  ["Someone nearby takes it", "They see the pay, how far it is, and exactly what to photograph before they agree."],
  ["The photos are checked", "Right place, taken just now, a fresh code on paper, the right sign. Checked automatically and privately."],
  ["Paid on the spot", "The moment it passes, the money lands in their wallet, and whoever asked gets the answer."],
] as const

const SAFETY = [
  ["Places, not people", "Jobs are for shops, sites and public places. Anything about a private home or a person is taken down and refunded."],
  ["Walk away any time", "If a place feels wrong, drop the job. You'll never be asked to go anywhere you aren't let in."],
  ["Your photos stay private", "Only whoever paid for the check sees them, and they're deleted after 14 days. No names or phone numbers needed."],
] as const

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto flex max-w-[1200px] scroll-mt-6 flex-col gap-10 px-5 py-20 md:py-28">
      <div className="flex max-w-[640px] flex-col gap-4">
        <h2 className="display m-0 text-[36px] leading-[0.95] md:text-[64px]">How every check stays honest</h2>
        <p className="m-0 text-[17px] leading-relaxed text-soft">Nobody has to trust anybody. The rules are written into the app and the payment, and they apply to everyone.</p>
      </div>
      <div className="relative">
        <div aria-hidden="true" className="absolute left-[22px] right-[22px] top-[22px] hidden h-0.5 bg-line md:block" />
        <div aria-hidden="true" className="m-fill absolute left-[22px] right-[22px] top-[22px] hidden h-0.5 bg-kola md:block" />
        <ol className="m-how relative m-0 grid list-none gap-8 p-0 md:grid-cols-4">
          {HOW.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-3">
              <span className="m-node display flex h-11 w-11 items-center justify-center rounded-full bg-kola text-[18px] text-ink">{i + 1}</span>
              <h3 className="m-0 text-[19px] font-semibold">{title}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Safety() {
  return (
    <section id="safety" className="mx-auto flex max-w-[1200px] scroll-mt-6 flex-col gap-8 px-5 pb-24">
      <h2 className="display m-0 max-w-[640px] text-[36px] leading-[0.95] md:text-[64px]">Safe for the people doing the work.</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {SAFETY.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-3 rounded-[20px] border border-line bg-ink-2 p-6 transition-transform hover:-translate-y-1">
            <h3 className="m-0 text-[20px] font-semibold">{title}</h3>
            <p className="m-0 text-[15px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
