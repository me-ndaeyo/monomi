import type { z } from "zod"

import { NEARAI_BASE_URL } from "./model"

export interface EndpointConfig {
  model: string
  apiKey: string
  fetch?: typeof fetch
  baseUrl?: string
}

export interface Result<T> {
  data: T | null
  error: string | null
}

export async function getText(config: EndpointConfig, path: string) {
  const doFetch = config.fetch ?? fetch
  try {
    const url = `${config.baseUrl ?? NEARAI_BASE_URL}${path}`
    const response = await doFetch(url, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    const body = await response.text()
    return response.ok ? body : null
  } catch {
    return null
  }
}

export function parseJson<T>(schema: z.ZodType<T>, body: string): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(body))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
