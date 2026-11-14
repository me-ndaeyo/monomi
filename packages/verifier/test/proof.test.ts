import { describe, expect, test } from "vitest"

import {
  CODE_ALPHABET,
  canonicalJson,
  computeProofHash,
  generateCode,
  sha256Hex,
} from "../src/proof"

const BUNDLE = {
  job_id: 7,
  worker: "tunde.testnet",
  code: "K7Q2",
  photo_sha256s: ["a".repeat(64)],
  lat: 8.1333,
  lng: 4.24,
  accuracy_m: 20,
  server_ts: 1_700_000_000_000,
}

describe("canonicalJson", () => {
  test("sorts keys at every level and drops whitespace", () => {
    const value = { b: 1, a: { d: [3, { z: 1, y: 2 }], c: "x" } }
    expect(canonicalJson(value)).toBe('{"a":{"c":"x","d":[3,{"y":2,"z":1}]},"b":1}')
  })

  test("gives the same string whatever the key insertion order", () => {
    expect(canonicalJson({ x: 1, y: null })).toBe(canonicalJson({ y: null, x: 1 }))
  })

  test("leaves out undefined object values", () => {
    expect(canonicalJson({ a: undefined, b: true })).toBe('{"b":true}')
  })
})

describe("sha256Hex", () => {
  test("hashes the empty string to the known digest", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
  })

  test("hashes bytes the same as the equal string", () => {
    expect(sha256Hex(new TextEncoder().encode("monomi"))).toBe(sha256Hex("monomi"))
  })
})

describe("computeProofHash", () => {
  test("is stable for the same bundle in any key order", () => {
    const reordered = Object.fromEntries(Object.entries(BUNDLE).reverse())
    const hash = computeProofHash(BUNDLE)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(computeProofHash({ ...BUNDLE, ...reordered })).toBe(hash)
    expect(hash).toBe(sha256Hex(canonicalJson(BUNDLE)))
  })

  test("changes when any field changes", () => {
    expect(computeProofHash({ ...BUNDLE, code: "K7Q3" })).not.toBe(
      computeProofHash(BUNDLE)
    )
  })
})

describe("generateCode", () => {
  test("returns 4 characters from the alphabet without look-alikes", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCode()
      expect(code).toHaveLength(4)
      for (const char of code) expect(CODE_ALPHABET).toContain(char)
    }
    expect(CODE_ALPHABET).not.toMatch(/[01ILO]/)
  })
})
