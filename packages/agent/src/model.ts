import { z } from "zod"

import { TOOLS } from "./tools.js"
import { errorMessage, type Result } from "./types.js"

const CHAT_URL = "https://cloud-api.near.ai/v1/chat/completions"

const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({ name: z.string(), arguments: z.string() }),
})

export const assistantMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.string().nullable().default(null),
  tool_calls: z.array(toolCallSchema).optional(),
})

const completionSchema = z.object({
  choices: z.array(z.object({ message: assistantMessageSchema })).min(1),
})

export type AssistantMessage = z.infer<typeof assistantMessageSchema>

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | AssistantMessage
  | { role: "tool"; tool_call_id: string; content: string }

export type ChatModel = (
  messages: ChatMessage[]
) => Promise<Result<AssistantMessage>>

export const OPENAI_TOOLS = TOOLS.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: z.toJSONSchema(tool.input, { io: "input" }),
  },
}))

export function createNearAiModel(apiKey: string, model: string): ChatModel {
  return async (messages) => {
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          tools: OPENAI_TOOLS,
          temperature: 0,
        }),
      })
      if (!response.ok) {
        return {
          data: null,
          error: `NEAR AI Cloud answered HTTP ${response.status}.`,
        }
      }
      const parsed = completionSchema.safeParse(await response.json())
      if (!parsed.success) {
        return {
          data: null,
          error: "NEAR AI Cloud sent a reply we could not read.",
        }
      }
      const first = parsed.data.choices[0]
      return first
        ? { data: first.message, error: null }
        : { data: null, error: "NEAR AI Cloud sent no choices." }
    } catch (error) {
      return {
        data: null,
        error: `NEAR AI Cloud is unreachable: ${errorMessage(error)}`,
      }
    }
  }
}
