import { LockIcon } from "@/components/ui/icons"
import { formatUsdc } from "@/lib/format/usdc"
import type { RankedJob } from "../_lib/rank-jobs"

const MAP_RADIUS_M = 2500
const W = 390
const H = 380

/** Schematic map: pins are placed at their real bearing and distance from you. */
export default function JobsMap({ jobs, here }: Readonly<{ jobs: RankedJob[]; here: { lat: number; lng: number } | null }>) {
  const project = (lat: number, lng: number) => {
    if (!here) return null
    const dx = (lng - here.lng) * 111_320 * Math.cos((here.lat * Math.PI) / 180)
    const dy = (lat - here.lat) * 110_540
    const scale = (W / 2 - 30) / MAP_RADIUS_M
    return { x: Math.max(30, Math.min(W - 60, W / 2 + dx * scale)), y: Math.max(70, Math.min(H - 60, H / 2 - dy * scale)) }
  }
  return (
    <div className="absolute inset-x-0 top-0 h-[380px] overflow-hidden bg-sand" aria-hidden="true">
      <svg width="100%" height="380" viewBox="0 0 390 380" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect x="22" y="40" width="70" height="56" rx="6" fill="#D8D1C0" />
        <rect x="118" y="30" width="96" height="40" rx="6" fill="#D8D1C0" />
        <rect x="250" y="48" width="110" height="64" rx="6" fill="#D8D1C0" />
        <rect x="30" y="150" width="80" height="80" rx="6" fill="#D8D1C0" />
        <rect x="140" y="150" width="70" height="52" rx="6" fill="#CFD8C2" />
        <rect x="262" y="170" width="100" height="70" rx="6" fill="#D8D1C0" />
        <rect x="40" y="270" width="110" height="60" rx="6" fill="#D8D1C0" />
        <path d="M-10 120 C 100 108, 230 140, 400 128" stroke="#F7F4EC" strokeWidth="16" />
        <path d="M-10 250 C 120 258, 260 236, 400 246" stroke="#F7F4EC" strokeWidth="11" />
        <path d="M110 -10 C 118 120, 104 240, 124 400" stroke="#F7F4EC" strokeWidth="10" />
        <path d="M236 -10 C 232 130, 248 250, 236 400" stroke="#F7F4EC" strokeWidth="13" />
        {here && <circle cx="195" cy="190" r="140" stroke="#3347C8" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 5" />}
      </svg>
      {here && (
        <div className="absolute h-4 w-4" style={{ left: "calc(50% - 8px)", top: 182 }}>
          <span className="j-halo absolute inset-0 rounded-full bg-indigo" />
          <span className="absolute inset-0 rounded-full border-[3px] border-white bg-indigo shadow-[0_2px_6px_rgba(11,12,10,0.3)]" />
        </div>
      )}
      {jobs.slice(0, 8).map((r, i) => {
        const p = project(r.job.spec.lat_e6 / 1e6, r.job.spec.lng_e6 / 1e6)
        if (!p) return null
        const selected = i === 0 && !r.locked
        return (
          <div
            key={r.job.id}
            className={`absolute flex flex-col items-center ${selected ? "j-bob z-10" : ""} ${r.locked ? "opacity-55" : ""}`}
            style={{ left: `calc(50% + ${p.x - W / 2}px)`, top: p.y - 30 }}
          >
            <span
              className={selected ? "display rounded-[12px] border-2 border-ink bg-kola px-[11px] py-[7px] text-[16px] text-ink shadow-[0_6px_14px_rgba(11,12,10,0.25)]" : "rounded-[10px] bg-ink px-[9px] py-[5px] text-[13px] font-bold text-bone"}
            >
              <span className="flex items-center gap-1">
                {r.locked && <LockIcon color="#EFEBE2" size={10} />}
                {formatUsdc(r.job.amount, false)}
              </span>
            </span>
            <span className="h-0 w-0 border-x-[7px] border-t-8 border-x-transparent border-t-ink" />
          </div>
        )
      })}
    </div>
  )
}
