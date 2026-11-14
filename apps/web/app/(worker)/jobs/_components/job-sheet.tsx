import type { LocationState } from "@/hooks/use-location"
import type { RankedJob, SortKey } from "../_lib/rank-jobs"
import { FeaturedJobCard, JobRow } from "./job-cards"

interface JobSheetProps {
  ranked: RankedJob[]
  now: number
  approved: number
  sort: SortKey
  onSort: (sort: SortKey) => void
  isLoading: boolean
  error: Error | null
  locationStatus: LocationState["status"]
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "closest", label: "Closest" },
  { key: "pay", label: "Best pay" },
  { key: "ending", label: "Ending soon" },
]

export default function JobSheet({ ranked, now, approved, sort, onSort, isLoading, error, locationStatus }: Readonly<JobSheetProps>) {
  const [first, ...rest] = ranked
  const subtitle =
    locationStatus === "denied"
      ? "Allow location to see distances. We need it to check you are at the spot."
      : locationStatus === "ready"
        ? "Sorted from where you are"
        : "Finding where you are…"
  return (
    <section className="relative z-10 flex min-h-[calc(100dvh-330px)] flex-col gap-3.5 rounded-t-[28px] bg-bone px-4 pt-2.5 shadow-[0_-10px_30px_rgba(11,12,10,0.12)] md:min-h-0 md:rounded-none md:border-l md:border-card-line md:px-6 md:pt-6 md:shadow-none">
      <span aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-[#C9C3B3] md:hidden" />
      <div className="flex flex-col gap-0.5 px-1">
        <h1 className="display m-0 text-[30px] leading-none tracking-[-0.035em]">
          {isLoading ? "Looking for jobs" : `${ranked.length} ${ranked.length === 1 ? "job" : "jobs"} near you`}
        </h1>
        <span className="text-[14px] text-muted-light">{subtitle}</span>
      </div>
      <div role="group" aria-label="Sort jobs" className="grid grid-cols-3 rounded-xl bg-sand p-1">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={sort === s.key}
            onClick={() => onSort(s.key)}
            className={`h-9 rounded-[9px] text-[14px] ${sort === s.key ? "bg-white font-semibold shadow-[0_1px_3px_rgba(11,12,10,0.1)]" : "text-[#3D3B33]"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-40 animate-pulse rounded-[20px] bg-sand" />
          <div className="h-16 animate-pulse rounded-[18px] bg-sand" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-fail-light/40 bg-fail-light/10 p-5 text-center text-[14px] text-fail-light">
          Could not load jobs from NEAR. {error.message}
        </p>
      ) : !first ? (
        <p className="rounded-2xl border border-card-line bg-white p-6 text-center text-[14px] text-muted-light">
          No open jobs right now. New checks show up here as soon as an agent posts them.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {first.locked ? <JobRow item={first} now={now} approved={approved} /> : <FeaturedJobCard item={first} now={now} />}
          {rest.map((item) => (
            <JobRow key={item.job.id} item={item} now={now} approved={approved} />
          ))}
        </div>
      )}
    </section>
  )
}
