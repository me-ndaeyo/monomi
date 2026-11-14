import type { Report } from "verifier"

import { ESCROW } from "@/lib/near/contract"

const EXPLORER = "https://testnet.nearblocks.io"

export default function TechDetails({ report, jobId, tx }: Readonly<{ report: Report; jobId: number; tx: string | null }>) {
  const rows: [string, React.ReactNode][] = [
    ["Contract", <a key="c" href={`${EXPLORER}/address/${ESCROW}`}>{ESCROW}</a>],
    ["Job", `#${jobId}`],
    ["Resolve and payment tx", tx ? <a key="t" href={`${EXPLORER}/txns/${tx}`}>{tx.slice(0, 6)}…{tx.slice(-4)}</a> : "Not sent"],
    ["Checked by", `${report.model.name} on NEAR AI Cloud (TEE)`],
    ["Chat id", report.model.chat_id],
    ["Signing key", `${report.attestation.signing_address} (${report.attestation.signing_algo})`],
    ["Signature", report.attestation.signature_matches ? "matches the attested key" : "does not match"],
    ["Attestation report sha256", report.attestation.report_sha256],
    ["Report hash (on-chain)", report.report_hash],
  ]
  return (
    <details className="rounded-2xl border border-card-line bg-white p-4">
      <summary className="cursor-pointer text-[15px] font-semibold">Technical details for developers</summary>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 break-all font-mono text-[12px] sm:grid-cols-[200px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-light">{k}</dt>
            <dd className="m-0 mb-2">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-2 text-[12px] text-muted-light">
        What this proves: the model&apos;s answer was signed by the key in NEAR AI Cloud&apos;s attestation report, and the raw Intel TDX and NVIDIA report can be fetched from <a href={`https://cloud-api.near.ai/v1/attestation/report?model=${encodeURIComponent(report.model.name)}`}>NEAR AI</a> for independent checking. It does not prove the place is what the photos suggest beyond these checks.
      </p>
    </details>
  )
}
