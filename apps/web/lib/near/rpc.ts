import { z } from "zod"

import { clientEnv } from "@/config/env/client"

const RpcResponse = z.object({
  result: z.unknown().optional(),
  error: z.unknown().optional(),
})

async function rpc(method: string, params: unknown): Promise<unknown> {
  const response = await fetch(clientEnv.NEXT_PUBLIC_NEAR_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "monomi", method, params }),
    cache: "no-store",
  })
  const body = RpcResponse.parse(await response.json())
  if (body.error !== undefined) {
    throw new Error(`NEAR RPC error: ${JSON.stringify(body.error)}`)
  }
  return body.result
}

const CallResult = z.union([
  z.object({ result: z.array(z.number()) }),
  z.object({ error: z.string() }),
])

export async function viewFunction(
  contractId: string,
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const result = await rpc("query", {
    request_type: "call_function",
    finality: "final",
    account_id: contractId,
    method_name: methodName,
    args_base64: btoa(JSON.stringify(args)),
  })
  const call = CallResult.parse(result)
  if ("error" in call) throw new Error(call.error)
  const bytes = Uint8Array.from(call.result)
  return JSON.parse(new TextDecoder().decode(bytes))
}

/** True when `publicKey` is a current access key of `accountId`. */
export async function hasAccessKey(accountId: string, publicKey: string) {
  try {
    await rpc("query", {
      request_type: "view_access_key",
      finality: "final",
      account_id: accountId,
      public_key: publicKey,
    })
    return true
  } catch {
    return false
  }
}

const TxStatus = z.object({
  transaction: z.object({ signer_id: z.string(), receiver_id: z.string() }),
  status: z.record(z.string(), z.unknown()),
})

export async function getTxStatus(txHash: string, senderId: string) {
  const result = await rpc("tx", {
    tx_hash: txHash,
    sender_account_id: senderId,
    wait_until: "FINAL",
  })
  return TxStatus.parse(result)
}
