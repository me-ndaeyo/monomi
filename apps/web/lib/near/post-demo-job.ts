import "server-only"
import { teraToGas } from "near-api-js"

import { serverEnv } from "@/config/env/server"
import { ESCROW, USDC } from "./contract"
import { serverAccount } from "./server-account"

const DEMO_AMOUNT = "500000"

/** Posts a 0.50 tUSDC test job from the capped demo agent account. */
export async function postDemoJob(lat: number, lng: number) {
  const agent = serverAccount(serverEnv.DEMO_AGENT_ACCOUNT_ID, serverEnv.DEMO_AGENT_PRIVATE_KEY)
  const spec = {
    title: "Test check: the spot where you are",
    instructions:
      "Write MONOMI and the code we show you on a sheet of paper. Take one photo of the paper with the place around you in the shot.",
    lat_e6: Math.round(lat * 1e6),
    lng_e6: Math.round(lng * 1e6),
    radius_m: 150,
    expected_text: "MONOMI",
    duration_mins: 60,
    min_reputation: 0,
  }
  const outcome = await agent.callFunctionRaw({
    contractId: USDC,
    methodName: "ft_transfer_call",
    args: { receiver_id: ESCROW, amount: DEMO_AMOUNT, msg: JSON.stringify({ post_job: spec }) },
    deposit: 1n,
    gas: teraToGas(100),
  })
  for (const receipt of outcome.receipts_outcome) {
    for (const log of receipt.outcome.logs) {
      const match = /"event":"monomi_job_posted","data":\[\{"job_id":(\d+)/.exec(log)
      if (match?.[1]) return { data: Number(match[1]), error: null }
    }
  }
  return { data: null, error: "The test job was not created. Try again in a minute." }
}
