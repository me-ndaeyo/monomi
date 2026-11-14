import { describe, expect, test } from "vitest"

import { haversineM, runChecks } from "../src/checks"

const BASE = {
  job: { lat_e6: 8_133_000, lng_e6: 4_240_000, radius_m: 100 },
  capture: { lat: 8.133, lng: 4.24, accuracy_m: 10 },
  challengeIssuedAtMs: 0,
  serverTsMs: 60_000,
  photoHashes: ["a".repeat(64)],
  usedPhotoHashes: [],
}

describe("haversineM", () => {
  test("returns zero for the same point", () => {
    expect(haversineM({ lat: 8.1, lng: 4.2 }, { lat: 8.1, lng: 4.2 })).toBe(0)
  })

  test("measures one degree of latitude as about 111.2 km", () => {
    const distance = haversineM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
    expect(distance).toBeCloseTo(111_195, -1)
  })

  test("measures Lagos to Abuja as about 526 km", () => {
    const distance = haversineM(
      { lat: 6.5244, lng: 3.3792 },
      { lat: 9.0765, lng: 7.3986 }
    )
    expect(Math.round(distance / 1000)).toBe(526)
  })
})

describe("runChecks", () => {
  test("passes a capture at the spot with a fresh code", () => {
    expect(runChecks(BASE)).toEqual({
      distance_m: 0,
      within_radius: true,
      freshness_s: 60,
      fresh: true,
      photos_distinct: true,
      photos_unused: true,
    })
  })

  test("adds the reported accuracy to the radius", () => {
    const capture = { lat: 8.1342, lng: 4.24, accuracy_m: 40 }
    expect(runChecks({ ...BASE, capture }).within_radius).toBe(true)
  })

  test("caps the accuracy allowance at 150 m", () => {
    const near = { lat: 8.13515, lng: 4.24, accuracy_m: 400 }
    const far = { lat: 8.1355, lng: 4.24, accuracy_m: 400 }
    expect(runChecks({ ...BASE, capture: near }).within_radius).toBe(true)
    expect(runChecks({ ...BASE, capture: far }).within_radius).toBe(false)
  })

  test("accepts a capture exactly 10 minutes after the code", () => {
    expect(runChecks({ ...BASE, serverTsMs: 600_000 }).fresh).toBe(true)
    expect(runChecks({ ...BASE, serverTsMs: 600_001 }).fresh).toBe(false)
  })

  test("rejects a capture timestamped before the code was issued", () => {
    expect(runChecks({ ...BASE, serverTsMs: -1 }).fresh).toBe(false)
  })

  test("flags an empty photo list as not distinct", () => {
    expect(runChecks({ ...BASE, photoHashes: [] }).photos_distinct).toBe(false)
  })
})
