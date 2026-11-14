import { createClient } from "./client.js"
import { loadConfig } from "./config.js"
import { runDemo } from "./demo.js"
import { createDryClient, createScriptedModel } from "./dry-client.js"
import { createNearAiModel } from "./model.js"
import { scenarioMessages } from "./scenario.js"
import { createSpendingGuard } from "./spending-guard.js"
import type { ToolDeps } from "./tools.js"

const args = process.argv.slice(2)
const dry = args.includes("--dry")
const log = (line: string) => console.log(`  ${line}`)

function liveSetup() {
  const config = loadConfig()
  if (!config.data) return { data: null, error: config.error }
  if (!config.data.NEARAI_API_KEY) {
    return {
      data: null,
      error: "Set NEARAI_API_KEY to run the live agent, or pass --dry.",
    }
  }
  const deps: ToolDeps = {
    client: createClient(config.data),
    guard: createSpendingGuard({
      perJobCapUsd: config.data.AGENT_PER_JOB_CAP_USD,
      dailyCapUsd: config.data.AGENT_DAILY_CAP_USD,
    }),
  }
  const model = createNearAiModel(
    config.data.NEARAI_API_KEY,
    config.data.NEARAI_AGENT_MODEL
  )
  return { data: { deps, model }, error: null }
}

function drySetup() {
  const scenario = args.includes("--reject") ? "rejected" : "approved"
  const deps: ToolDeps = {
    client: createDryClient(scenario),
    guard: createSpendingGuard({ perJobCapUsd: 25, dailyCapUsd: 50 }),
  }
  return { data: { deps, model: createScriptedModel() }, error: null }
}

const setup = dry ? drySetup() : liveSetup()
if (!setup.data) {
  console.error(`[demo-agent] ${setup.error}`)
  process.exit(1)
}

console.log(
  dry
    ? "Monomi demo agent (dry run, fixtures only)"
    : "Monomi demo agent (testnet)"
)
console.log(`Task: ${scenarioMessages()[1]?.content ?? ""}`)
const result = await runDemo({ ...setup.data, log })
if (!result.data) {
  console.error(`[demo-agent] ${result.error}`)
  process.exit(1)
}
console.log(`Agent: ${result.data.summary}`)
console.log(`Decision: ${result.data.decision}`)
