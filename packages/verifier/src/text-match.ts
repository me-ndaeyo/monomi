export function normalizeText(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost
      )
    }
    previous = current
  }
  return previous[b.length] ?? 0
}

export function similarity(expected: string, read: string): number {
  const a = normalizeText(expected)
  const b = normalizeText(read)
  if (a.length === 0 && b.length === 0) return 1
  if (a.length > 0 && b.includes(a)) return 1
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length)
}
