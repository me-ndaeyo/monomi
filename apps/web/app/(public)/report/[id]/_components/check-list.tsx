import type { Report } from "verifier"

import { CheckDot } from "@/components/ui/icons"

/** The five plain-language checks a business reads. */
export default function CheckList({ report, expectedText }: Readonly<{ report: Report; expectedText: string | null }>) {
  const a = report.model.answers
  const rows = [
    { ok: report.checks.within_radius, label: "Taken at the address", value: `${Math.round(report.checks.distance_m)} m away` },
    { ok: report.checks.fresh, label: "Taken at the time of the check, not before", value: `${Math.max(1, Math.round(report.checks.freshness_s / 60))} min after the code` },
    { ok: a.code_is_handwritten_on_paper && a.code_read.length > 0, label: "Fresh code handwritten in the photo", value: a.code_read || "Not found" },
    ...(expectedText ? [{ ok: a.expected_text_found, label: "The sign matches", value: a.expected_text_read || expectedText }] : []),
    { ok: !a.is_photo_of_screen_or_print && report.checks.photos_distinct && report.checks.photos_unused, label: "Real photos, not a screen or a printout", value: a.is_photo_of_screen_or_print ? "Failed" : "Passed" },
  ]
  const passed = rows.filter((r) => r.ok).length
  return (
    <section aria-label="Checks" className="flex flex-col gap-3">
      <h2 className="m-0 text-[18px] font-semibold">{passed} of {rows.length} checks passed</h2>
      <ul className="rise-rows m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[20px_1fr_auto] items-center gap-3 rounded-2xl border border-card-line bg-white px-4 py-3 text-[15px]">
            <CheckDot ok={r.ok} />
            <span>{r.label}</span>
            <span className="font-mono text-[13px] text-muted-light">{r.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
