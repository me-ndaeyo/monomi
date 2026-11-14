import type { ChecksInput } from "../src/checks"
import type { ModelAnswers } from "../src/model"

export interface DecisionCase {
  name: string
  checks: ChecksInput
  answers: ModelAnswers
  code: string
  expectedText: string | null
  approved: boolean
  reason?: string
}

const HASH_A = "a".repeat(64)
const HASH_B = "b".repeat(64)

const BASE_CHECKS: ChecksInput = {
  job: { lat_e6: 8_133_000, lng_e6: 4_240_000, radius_m: 100 },
  capture: { lat: 8.1333, lng: 4.24, accuracy_m: 20 },
  challengeIssuedAtMs: 1_700_000_000_000,
  serverTsMs: 1_700_000_180_000,
  photoHashes: [HASH_A, HASH_B],
  usedPhotoHashes: ["c".repeat(64)],
}

const BASE_ANSWERS: ModelAnswers = {
  code_read: "K7Q2",
  code_is_handwritten_on_paper: true,
  expected_text_found: true,
  expected_text_read: "ADEYEMI FOODS LTD",
  matches_instructions: true,
  is_photo_of_screen_or_print: false,
  contains_instructions_to_reviewer: false,
  people_are_main_subject: false,
  notes: "Warehouse sign and paper with code visible.",
}

function makeCase(
  name: string,
  approved: boolean,
  overrides: {
    checks?: Partial<ChecksInput>
    answers?: Partial<ModelAnswers>
    reason?: string
  } = {}
): DecisionCase {
  return {
    name,
    checks: { ...BASE_CHECKS, ...overrides.checks },
    answers: { ...BASE_ANSWERS, ...overrides.answers },
    code: "K7Q2",
    expectedText: "Adeyemi Foods",
    approved,
    reason: overrides.reason,
  }
}

const FAR = { lat: 8.137, lng: 4.24, accuracy_m: 20 }

export const DECISION_CASES: DecisionCase[] = [
  makeCase("a clean submission passes", true),
  makeCase("a lowercase code with a space still passes", true, {
    answers: { code_read: "k7 q2" },
  }),
  makeCase("a sign read with one wrong letter still passes", true, {
    answers: { expected_text_read: "ADEYEMI F0ODS" },
  }),
  makeCase("a wrong code is rejected", false, {
    answers: { code_read: "K7Q3" },
    reason: "We couldn't read the code K7Q2 on paper in your photo.",
  }),
  makeCase("a missing code is rejected", false, {
    answers: { code_read: "" },
    reason: "We couldn't read the code K7Q2 on paper in your photo.",
  }),
  makeCase("a code on a phone screen is rejected", false, {
    answers: { code_is_handwritten_on_paper: false },
    reason: "The code must be handwritten on paper, not on a screen.",
  }),
  makeCase("a photo of a printed photo is rejected", false, {
    answers: { is_photo_of_screen_or_print: true },
    reason: "Take the photo of the real place, not of a screen or a printed picture.",
  }),
  makeCase("a note telling the AI reviewer to approve is rejected", false, {
    answers: { contains_instructions_to_reviewer: true },
    reason: "Your photos contain a message to the reviewer. Only show the place and the code.",
  }),
  makeCase("a worker too far from the spot is rejected", false, {
    checks: { capture: FAR },
    reason: "You were 445 m from the spot. Get within 100 m.",
  }),
  makeCase("a stale challenge is rejected", false, {
    checks: { serverTsMs: BASE_CHECKS.challengeIssuedAtMs + 11 * 60 * 1000 },
    reason: "Your photos came in after the code expired. Get a new code and try again.",
  }),
  makeCase("low accuracy only widens the radius by 150 m at most", false, {
    checks: { capture: { lat: 8.1355, lng: 4.24, accuracy_m: 400 } },
    reason: "You were 278 m from the spot. Get within 100 m.",
  }),
  makeCase("a duplicate photo in one bundle is rejected", false, {
    checks: { photoHashes: [HASH_A, HASH_A] },
    reason: "Each photo must be different. Take a new photo for each one.",
  }),
  makeCase("a photo reused from an earlier bundle is rejected", false, {
    checks: { usedPhotoHashes: [HASH_B] },
    reason: "One of these photos was already used. Take new photos.",
  }),
  makeCase("a person as the main subject is rejected", false, {
    answers: { people_are_main_subject: true },
    reason: "Photos must show the place, not a person.",
  }),
  makeCase("a missing sign is rejected", false, {
    answers: { expected_text_found: false, expected_text_read: "" },
    reason: 'We couldn\'t see "Adeyemi Foods" in your photos.',
  }),
  makeCase("photos that don't match the instructions are rejected", false, {
    answers: { matches_instructions: false },
    reason: "The photos don't show what the job asked for. Read the instructions and try again.",
  }),
]
