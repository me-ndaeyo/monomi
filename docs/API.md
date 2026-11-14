# Monomi HTTP API

Base URL: the hosted web app (`MONOMI_API_URL`, default `http://localhost:3000`). Every response is `{ "data": T | null, "error": string | null }`.

Amounts are strings in USDC base units (6 decimals). Job state lives on-chain in `escrow.monomi.testnet`; read it with the contract views (`get_job`, `get_jobs`).

## Auth (NEP-413)

1. `POST /api/auth/nonce` returns `{ data: { nonce: string } }`. The nonce is single use and expires after 5 minutes.
2. The client signs a NEP-413 payload with an access key of its NEAR account:
   - `message`: `monomi:<action>:<job_id>:<nonce>`, where action is `challenge`, `proof`, `verify` or `report`
   - `recipient`: `monomi`
   - `nonce`: 32 random bytes
   - signature over `sha256(borsh(u32 2147484061, message, nonce[32], recipient, None))` with ed25519
3. The request carries the header `Authorization: NEP413 <base64(JSON)>` where the JSON is
   `{ "accountId", "publicKey": "ed25519:...", "signature": "<base64>", "nonce": "<base64 of the 32 bytes>", "message" }`.

The server checks the signature, that `publicKey` is a current access key of `accountId` (RPC `view_access_key`), and that the server nonce is unused and under 5 minutes old.

## Routes

| Method and path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/nonce` | none | Server nonce |
| `POST /api/jobs/:id/challenge` | worker | New 4-character code for a `Claimed` job, `{ code, expires_at }` |
| `POST /api/jobs/:id/proof` | worker | Multipart: `photos` (1 to 3 JPEGs), `lat`, `lng`, `accuracy_m`. Returns `{ proof_hash }` |
| `POST /api/jobs/:id/verify` | worker | Body `{ tx_hash }`. Runs the checks once and resolves on-chain. Returns `{ status, approved?, reasons? }` |
| `GET /api/jobs/:id/report` | poster | `{ report, photos: [{ url }] }`, signed photo URLs valid 10 minutes |
| `GET /api/report/:id` | none | Public report: no photos, location rounded to 2 decimals |
| `POST /api/demo-job` | none (rate limited) | Judge mode: posts a 0.50 tUSDC job at `{ lat, lng }` from the demo agent |
| `POST /api/cashout/quote` | none | 1Click dry quote, `{ chain, address, amount }` |

## Report

```json
{
  "version": 1,
  "job_id": 0,
  "approved": true,
  "reasons": [],
  "checks": {
    "distance_m": 41,
    "within_radius": true,
    "freshness_s": 180,
    "fresh": true,
    "photos_distinct": true,
    "photos_unused": true
  },
  "model": {
    "name": "Qwen/Qwen3-VL-30B-A3B-Instruct",
    "chat_id": "chatcmpl-...",
    "answers": {}
  },
  "attestation": {
    "signing_address": "0x...",
    "signing_algo": "ecdsa",
    "report_sha256": "...",
    "signature": "0x...",
    "signature_matches": true
  },
  "location": { "lat": 8.13, "lng": 4.24 },
  "timestamps": { "challenge_issued": "...", "captured": "...", "verified": "..." },
  "report_hash": "<sha256 of the canonical JSON of everything above>"
}
```
