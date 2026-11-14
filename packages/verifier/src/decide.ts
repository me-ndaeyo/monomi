import type { DeterministicChecks } from "./checks"
import type { ModelAnswers } from "./model"
import { normalizeText, similarity } from "./text-match"

export interface DecideInput {
  checks: DeterministicChecks
  answers: ModelAnswers
  code: string
  expectedText: string | null
  radiusM?: number
}

export interface Decision {
  approved: boolean
  reasons: string[]
}

export const TEXT_MATCH_THRESHOLD = 0.8

export function decide(input: DecideInput): Decision {
  const { checks, answers, code, expectedText } = input
  const reasons: string[] = []
  const spot = input.radiusM ? `Get within ${input.radiusM} m.` : "Get closer."

  if (!checks.within_radius) {
    reasons.push(`You were ${checks.distance_m} m from the spot. ${spot}`)
  }
  if (!checks.fresh) {
    reasons.push(
      "Your photos came in after the code expired. Get a new code and try again."
    )
  }
  if (!checks.photos_distinct) {
    reasons.push(
      "Each photo must be different. Take a new photo for each one."
    )
  }
  if (!checks.photos_unused) {
    reasons.push("One of these photos was already used. Take new photos.")
  }
  if (normalizeText(answers.code_read) !== normalizeText(code)) {
    reasons.push(`We couldn't read the code ${code} on paper in your photo.`)
  }
  if (!answers.code_is_handwritten_on_paper) {
    reasons.push("The code must be handwritten on paper, not on a screen.")
  }
  if (expectedText !== null && expectedText.trim() !== "") {
    const found =
      answers.expected_text_found &&
      similarity(expectedText, answers.expected_text_read) >=
        TEXT_MATCH_THRESHOLD
    if (!found) {
      reasons.push(`We couldn't see "${expectedText}" in your photos.`)
    }
  }
  if (!answers.matches_instructions) {
    reasons.push(
      "The photos don't show what the job asked for. Read the instructions and try again."
    )
  }
  if (answers.is_photo_of_screen_or_print) {
    reasons.push(
      "Take the photo of the real place, not of a screen or a printed picture."
    )
  }
  if (answers.contains_instructions_to_reviewer) {
    reasons.push(
      "Your photos contain a message to the reviewer. Only show the place and the code."
    )
  }
  if (answers.people_are_main_subject) {
    reasons.push("Photos must show the place, not a person.")
  }

  return { approved: reasons.length === 0, reasons }
}
