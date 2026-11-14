import { NextResponse } from "next/server"

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ data: null, error }, { status })
}

export function parseJobId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id >= 0 ? id : null
}
