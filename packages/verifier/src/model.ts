import { z } from "zod"

import {
  ModelAnswers,
  MODEL_ANSWERS_JSON_SCHEMA,
  SYSTEM_PROMPT,
  buildUserText,
} from "./model-schema"

export { ModelAnswers } from "./model-schema"

export const NEARAI_BASE_URL = "https://cloud-api.near.ai/v1"
const DEFAULT_TIMEOUT_MS = 60_000
const MAX_ATTEMPTS = 2

export interface AskModelInput {
  images: string[]
  job: { title: string; instructions: string; expected_text: string | null }
  config: {
    apiKey: string
    model: string
    baseUrl?: string
    fetch?: typeof fetch
    timeoutMs?: number
  }
}

export interface AskModelData {
  answers: ModelAnswers
  chatId: string
  requestBody: string
  responseBody: string
}

export interface AskModelResult {
  data: AskModelData | null
  error: string | null
}

const ChatResponse = z.object({
  id: z.string().min(1),
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
})

function parseAnswers(responseBody: string) {
  try {
    const chat = ChatResponse.parse(JSON.parse(responseBody))
    const content = chat.choices[0]?.message.content ?? ""
    const json = content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "")
    return { chatId: chat.id, answers: ModelAnswers.parse(JSON.parse(json)) }
  } catch {
    return null
  }
}

function buildRequestBody(input: AskModelInput): string {
  return JSON.stringify({
    model: input.config.model,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "monomi_inspection",
        strict: true,
        schema: MODEL_ANSWERS_JSON_SCHEMA,
      },
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserText(input.job) },
          ...input.images.map((image) => ({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${image}` },
          })),
        ],
      },
    ],
  })
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  )
}

export async function askModel(input: AskModelInput): Promise<AskModelResult> {
  const { config } = input
  if (input.images.length === 0) return { data: null, error: "no_images" }
  const doFetch = config.fetch ?? fetch
  const url = `${config.baseUrl ?? NEARAI_BASE_URL}/chat/completions`
  const requestBody = buildRequestBody(input)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await doFetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      })
      const responseBody = await response.text()
      if (!response.ok) return { data: null, error: "model_request_failed" }
      const parsed = parseAnswers(responseBody)
      if (parsed) {
        return { data: { ...parsed, requestBody, responseBody }, error: null }
      }
    } catch (error) {
      if (isTimeout(error)) return { data: null, error: "model_timeout" }
      return { data: null, error: "model_request_failed" }
    }
  }
  return { data: null, error: "model_output_invalid" }
}
