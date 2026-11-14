/** "38 min left", "1 h 5 min left", or "Ended". */
export function timeLeft(untilMs: number, nowMs = Date.now()): string {
  const mins = Math.floor((untilMs - nowMs) / 60_000)
  if (mins <= 0) return "Ended"
  if (mins < 60) return `${mins} min left`
  return `${Math.floor(mins / 60)} h ${mins % 60} min left`
}

/** Walking time at 5 km/h. */
export function walkTime(meters: number): string {
  return `${Math.max(1, Math.round(meters / 83))} min walk`
}
