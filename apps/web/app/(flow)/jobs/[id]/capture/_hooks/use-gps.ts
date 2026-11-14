"use client"

import { useEffect, useState } from "react"

export type GpsState = { status: "waiting" | "denied" } | { status: "ok"; accuracy: number }

/** Live accuracy for the GPS chip. Green under 50 m, amber under 150 m, red above. */
export function useGps() {
  const [gps, setGps] = useState<GpsState>({ status: "waiting" })
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => setGps({ status: "ok", accuracy: Math.round(coords.accuracy) }),
      (error) => error.code === error.PERMISSION_DENIED && setGps({ status: "denied" }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])
  return gps
}

export function gpsColor(gps: GpsState) {
  if (gps.status !== "ok") return "#E5484D"
  return gps.accuracy < 50 ? "#3FB67A" : gps.accuracy <= 150 ? "#F2A23A" : "#E5484D"
}
