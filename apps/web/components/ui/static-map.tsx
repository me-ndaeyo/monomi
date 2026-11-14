/** The job's pin and radius on a schematic street grid. */
export default function StaticMap({ label, height = 300 }: Readonly<{ label: string; height?: number }>) {
  return (
    <div className="relative overflow-hidden bg-sand" style={{ height }} aria-hidden="true">
      <svg width="100%" height={height} viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect x="30" y="40" width="90" height="60" rx="6" fill="#D8D1C0" />
        <rect x="250" y="30" width="110" height="70" rx="6" fill="#D8D1C0" />
        <rect x="150" y="150" width="96" height="70" rx="6" fill="#CFC6B2" stroke="#0B0C0A" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="20" y="190" width="90" height="70" rx="6" fill="#D8D1C0" />
        <rect x="280" y="170" width="90" height="60" rx="6" fill="#D8D1C0" />
        <path d="M-10 128 C 120 118, 250 140, 400 126" stroke="#F7F4EC" strokeWidth="16" />
        <path d="M136 -10 C 140 100, 128 200, 140 310" stroke="#F7F4EC" strokeWidth="11" />
        <path d="M262 -10 L 258 310" stroke="#F7F4EC" strokeWidth="9" />
        <circle cx="198" cy="185" r="62" fill="#F2A23A" fillOpacity="0.14" stroke="#F2A23A" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <div className="j-bob absolute flex flex-col items-center" style={{ left: "calc(50% - 26px)", top: 130 }}>
        <span className="display rounded-xl border-2 border-ink bg-kola px-[11px] py-[7px] text-[16px] text-ink shadow-[0_6px_14px_rgba(11,12,10,0.25)]">{label}</span>
        <span className="h-0 w-0 border-x-[7px] border-t-8 border-x-transparent border-t-ink" />
      </div>
    </div>
  )
}
