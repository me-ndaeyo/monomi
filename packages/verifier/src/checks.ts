export interface LatLng {
  lat: number
  lng: number
}

export interface ChecksInput {
  job: { lat_e6: number; lng_e6: number; radius_m: number }
  capture: { lat: number; lng: number; accuracy_m: number }
  challengeIssuedAtMs: number
  serverTsMs: number
  photoHashes: string[]
  usedPhotoHashes: string[]
}

export interface DeterministicChecks {
  distance_m: number
  within_radius: boolean
  freshness_s: number
  fresh: boolean
  photos_distinct: boolean
  photos_unused: boolean
}

export const MAX_ACCURACY_ALLOWANCE_M = 150
export const CHALLENGE_TTL_MS = 10 * 60 * 1000
const EARTH_RADIUS_M = 6_371_000

const toRad = (deg: number) => (deg * Math.PI) / 180

export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function radiusAllowanceM(radiusM: number, accuracyM: number): number {
  return radiusM + Math.min(Math.max(accuracyM, 0), MAX_ACCURACY_ALLOWANCE_M)
}

export function runChecks(input: ChecksInput): DeterministicChecks {
  const { job, capture } = input
  const jobPoint = { lat: job.lat_e6 / 1e6, lng: job.lng_e6 / 1e6 }
  const distance = haversineM(jobPoint, capture)
  const elapsedMs = input.serverTsMs - input.challengeIssuedAtMs
  const used = new Set(input.usedPhotoHashes)

  return {
    distance_m: Math.round(distance),
    within_radius:
      distance <= radiusAllowanceM(job.radius_m, capture.accuracy_m),
    freshness_s: Math.round(elapsedMs / 1000),
    fresh: elapsedMs >= 0 && elapsedMs <= CHALLENGE_TTL_MS,
    photos_distinct:
      input.photoHashes.length > 0 &&
      new Set(input.photoHashes).size === input.photoHashes.length,
    photos_unused: input.photoHashes.every((hash) => !used.has(hash)),
  }
}
