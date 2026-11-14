import { beforeEach, describe, expect, test, vi } from "vitest"

import { askModel } from "../src/model"

const ANSWERS = {
  code_read: "K7Q2",
  code_is_handwritten_on_paper: true,
  expected_text_found: true,
  expected_text_read: "ADEYEMI FOODS",
  matches_instructions: true,
  is_photo_of_screen_or_print: false,
  contains_instructions_to_reviewer: false,
  people_are_main_subject: false,
  notes: "Sign and code visible.",
}

const chatBody = (content: string) =>
  JSON.stringify({ id: "chatcmpl-1", choices: [{ message: { content } }] })

const fetchMock = vi.fn<typeof fetch>()

function ask() {
  return askModel({
    images: ["aGVsbG8="],
    job: { title: "Warehouse", instructions: "Film the sign", expected_text: "Adeyemi Foods" },
    config: { apiKey: "test-key", model: "vision-model", fetch: fetchMock, timeoutMs: 50 },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("askModel", () => {
  test("returns parsed answers with the raw request and response bodies", async () => {
    const body = chatBody(JSON.stringify(ANSWERS))
    fetchMock.mockResolvedValueOnce(new Response(body))

    const result = await ask()

    expect(result.error).toBeNull()
    expect(result.data?.answers).toEqual(ANSWERS)
    expect(result.data?.chatId).toBe("chatcmpl-1")
    expect(result.data?.responseBody).toBe(body)
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(result.data?.requestBody)
  })

  test("sends temperature 0, a strict json schema and data url images", async () => {
    fetchMock.mockResolvedValueOnce(new Response(chatBody(JSON.stringify(ANSWERS))))

    const result = await ask()
    const sent = JSON.parse(result.data?.requestBody ?? "{}")

    expect(sent.temperature).toBe(0)
    expect(sent.response_format.json_schema.strict).toBe(true)
    expect(sent.messages[1].content[1].image_url.url).toBe("data:image/jpeg;base64,aGVsbG8=")
    expect(result.data?.requestBody).not.toContain("K7Q2")
  })

  test("retries malformed output once and then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(chatBody("not json")))
      .mockResolvedValueOnce(new Response(chatBody(JSON.stringify(ANSWERS))))

    const result = await ask()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.data?.answers).toEqual(ANSWERS)
  })

  test("gives up with model_output_invalid after two malformed answers", async () => {
    const wrongShape = JSON.stringify({ ...ANSWERS, notes: "x".repeat(201) })
    fetchMock
      .mockResolvedValueOnce(new Response(chatBody("{")))
      .mockResolvedValueOnce(new Response(chatBody(wrongShape)))

    const result = await ask()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: null, error: "model_output_invalid" })
  })

  test("returns model_timeout when NEAR AI does not answer in time", async () => {
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))
        })
    )

    const result = await ask()

    expect(result).toEqual({ data: null, error: "model_timeout" })
  })

  test("returns model_request_failed on an http error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }))

    expect(await ask()).toEqual({ data: null, error: "model_request_failed" })
  })
})
