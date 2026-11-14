import type { SendStage } from "../_hooks/use-capture-flow"

const STEPS: { stage: SendStage; label: string }[] = [
  { stage: "uploading", label: "Sending your photos" },
  { stage: "signing", label: "Saving the proof on NEAR" },
  { stage: "checking", label: "Checking place, time, code and sign" },
]

export default function CheckingStep({ stage }: Readonly<{ stage: SendStage }>) {
  const current = STEPS.findIndex((s) => s.stage === stage)
  return (
    <div className="flex min-h-dvh flex-col md:min-h-[calc(100dvh-64px)] gap-8 bg-bone px-5 pt-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="ck-spin h-14 w-14 rounded-full border-4 border-sand border-t-ink" aria-hidden="true" />
        <h1 className="display m-0 text-[34px] leading-none">Checking your photos</h1>
        <p className="m-0 text-[15px] text-muted-light">This takes about 30 seconds. Keep this page open; your wallet may ask you to approve.</p>
      </div>
      <ol className="rise-rows m-0 flex list-none flex-col gap-3 p-0">
        {STEPS.map((s, i) => (
          <li key={s.stage} className="flex items-center gap-3 rounded-2xl border border-card-line bg-white px-4 py-3.5 text-[15px]">
            <span className={`h-3 w-3 rounded-full ${i < current ? "bg-pass-light" : i === current ? "bg-kola" : "bg-sand"}`} />
            <span className={i <= current ? "font-semibold" : "text-muted-light"}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="text-center text-[13px] text-muted-light">Checked in NEAR AI Cloud, inside a secure enclave. The decision is made by code, not the AI.</p>
    </div>
  )
}
