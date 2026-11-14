"use client"

import { useCallback, useState } from "react"

export type LocationState =
  | { status: "idle" | "loading" | "denied" | "unavailable" }
  | { status: "ready"; lat: number; lng: number; accuracy: number }

export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" })

  const request = useCallback(() => {
    if (!navigator.geolocation) return setState({ status: "unavailable" })
    setState({ status: "loading" })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setState({ status: "ready", lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      (error) => setState({ status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    )
  }, [])

  return { location: state, request }
}
