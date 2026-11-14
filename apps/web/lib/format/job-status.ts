import type { JobStatus } from "@/lib/near/contract"

/** Plain words for the console and reports. */
export const STATUS_LABEL: Record<JobStatus, string> = {
  Open: "Waiting for someone",
  Claimed: "Someone is on the way",
  Submitted: "Being checked",
  Rejected: "Didn't pass",
  UnderReview: "A person is reviewing",
  PayingOut: "Passed, paying",
  Paid: "Yes, checked and paid",
  PayoutFailed: "Passed, payment retrying",
  Refunding: "Refunding you",
  Refunded: "Refunded to you",
  RefundFailed: "Refund retrying",
}
