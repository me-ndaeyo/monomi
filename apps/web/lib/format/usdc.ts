/** `"15000000"` (base units, 6 decimals) to `"15.00 USDC"`. */
export function formatUsdc(baseUnits: string, withUnit = true): string {
  const value = BigInt(baseUnits)
  const whole = value / 1_000_000n
  const cents = (value % 1_000_000n) / 10_000n
  const text = `${whole}.${cents.toString().padStart(2, "0")}`
  return withUnit ? `${text} USDC` : text
}

export function usdToBaseUnits(usd: number): string {
  return BigInt(Math.round(usd * 100) * 10_000).toString()
}
