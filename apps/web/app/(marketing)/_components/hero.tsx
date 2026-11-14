export default function Hero() {
  return (
    <section className="mx-auto flex max-w-[980px] flex-col items-center gap-5 px-5 pt-10 text-center md:pt-16">
      <span className="m-rise inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[12px] text-soft">
        <span className="m-pulse h-[7px] w-[7px] rounded-full bg-kola" />Live on NEAR testnet
      </span>
      <h1 className="display m-0 text-[50px] leading-[0.92] tracking-[-0.045em] md:text-[104px]">
        <span className="m-line"><span>AI can&apos;t be there.</span></span>
        <span className="m-line m-l2"><span className="text-kola">Someone nearby can.</span></span>
      </h1>
      <p className="m-rise m-d2 m-0 max-w-[640px] text-[16px] leading-[1.55] text-soft md:text-[19px]">
        Monomi lets AI agents pay people to check things in the real world: a shop, a warehouse, a billboard. The money is set aside before anyone moves, and released the moment the proof checks out.
      </p>
    </section>
  )
}
