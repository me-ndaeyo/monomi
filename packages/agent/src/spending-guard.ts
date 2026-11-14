export interface SpendingGuardParams {
  perJobCapUsd: number
  dailyCapUsd: number
  now?: () => Date
}

export interface SpendingGuard {
  check(amountUsd: number): string | null
  record(amountUsd: number): void
}

// Daily total is kept in memory per process and resets at 00:00 UTC.
// Restarting the server resets it, so the on-chain balance of the capped
// agent account is the hard limit.
export function createSpendingGuard({
  perJobCapUsd,
  dailyCapUsd,
  now = () => new Date(),
}: SpendingGuardParams): SpendingGuard {
  const capCents = Math.round(dailyCapUsd * 100)
  let day = ""
  let spentCents = 0

  const rollDay = () => {
    const today = now().toISOString().slice(0, 10)
    if (today !== day) {
      day = today
      spentCents = 0
    }
  }

  return {
    check(amountUsd) {
      rollDay()
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
        return "The amount must be a positive number of USDC."
      }
      if (amountUsd > perJobCapUsd) {
        return `This job is ${amountUsd.toFixed(2)} USDC, above the ${perJobCapUsd.toFixed(2)} USDC limit per job.`
      }
      const leftCents = capCents - spentCents
      if (Math.round(amountUsd * 100) > leftCents) {
        return `Daily limit reached: ${(leftCents / 100).toFixed(2)} USDC left of ${dailyCapUsd.toFixed(2)} USDC today.`
      }
      return null
    },
    record(amountUsd) {
      rollDay()
      spentCents += Math.round(amountUsd * 100)
    },
  }
}
