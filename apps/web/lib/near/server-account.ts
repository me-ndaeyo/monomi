import "server-only"
import { Account, JsonRpcProvider, KeyPairSigner, type KeyPairString } from "near-api-js"

import { serverEnv } from "@/config/env/server"

export function serverAccount(accountId: string, privateKey: string) {
  const provider = new JsonRpcProvider({ url: serverEnv.NEAR_RPC_URL })
  const signer = KeyPairSigner.fromSecretKey(privateKey as KeyPairString)
  return new Account(accountId, provider, signer)
}
