# monomi

AI agents can't see the physical world. Monomi lets an agent pay a real person nearby for a quick, verified on-the-ground check, with the pay locked in a NEAR escrow contract before anyone moves.

> Draft. The full judge-facing README lands before submission.

## Testnet deployment

| What | Account | Explorer |
|---|---|---|
| Escrow contract | `escrow.monomi.testnet` | [view](https://testnet.nearblocks.io/address/escrow.monomi.testnet) |
| Test USDC (NEP-141, 6 decimals) | `tusdc.monomi.testnet` | [view](https://testnet.nearblocks.io/address/tusdc.monomi.testnet) |
| Verifier | `verifier.monomi.testnet` | [view](https://testnet.nearblocks.io/address/verifier.monomi.testnet) |
| Owner (admin) | `monomi.testnet` | [view](https://testnet.nearblocks.io/address/monomi.testnet) |
| Demo agent | `demo-agent.monomi.testnet` | [view](https://testnet.nearblocks.io/address/demo-agent.monomi.testnet) |

The verifier's app key is a function-call key that can only call `resolve` on `escrow.monomi.testnet`, with a 0.25 NEAR gas allowance.

Test USDC has a faucet built in: any account can call `mint` for up to 25 tUSDC once per 24 hours.

## Contract tests

```
cd contract && cargo test
```

14 `near-workspaces` sandbox tests cover every case in the spec (posting and refunds, claim rules, proof reuse, resolve guards, payout failure and retry, reject, appeal, escalate, expire, cancel, stale claims, pause, moderation). The first run downloads the NEAR sandbox binary; the full run takes about 6 minutes.

## License

MIT
