import type { ChatMessage } from "./model.js"

export const WAREHOUSE_ADDRESS =
  "Iseyin Road, Ogbomosho, Oyo State, Nigeria (lat 8.1335, lng 4.2405)"

const SYSTEM_PROMPT = [
  "You are a payments agent for a small business.",
  "Before money moves you verify facts in the physical world with the Monomi tools.",
  "Post exactly one Monomi job for the place, paying 15 USDC, with the business name as expected_text.",
  "Then call monomi_get_report with wait_seconds 1800 and summarise what the report says in one or two sentences.",
  "Never invent report contents.",
].join(" ")

export function scenarioMessages(): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Before wiring a $20,000 deposit to Adeyemi Foods, verify their warehouse at ${WAREHOUSE_ADDRESS} is real and stocked.`,
    },
  ]
}
