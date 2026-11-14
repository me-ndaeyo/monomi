"use client"

import { useQuery } from "@tanstack/react-query"

import { useJob, useWorker } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { APPEAL_WINDOW_MS } from "@/lib/near/contract"
import { useCaptureFlow } from "../_hooks/use-capture-flow"
import { latestVerification } from "../_lib/api"
import CameraStep from "./camera-step"
import CheckingStep from "./checking-step"
import PaidStep from "./paid-step"
import StatusStep from "./status-step"

const VERIFY_TIMEOUT_MS = 30 * 60_000

/** Every step is derived from the chain plus the stored check, so a reload resumes here. */
export default function CaptureFlow({ jobId }: Readonly<{ jobId: number }>) {
  const wallet = useWallet()
  const { data: job, isLoading } = useJob(jobId, 8_000)
  const worker = useWorker(wallet.accountId)
  const flow = useCaptureFlow(jobId)
  const verification = useQuery({ queryKey: ["verification", jobId, job?.status, flow.result], queryFn: () => latestVerification(jobId) })
  const last = flow.result ?? verification.data ?? null
  const base = { jobId, error: flow.error }

  if (isLoading) return <div className="h-dvh animate-pulse bg-sand" />
  if (!job || job.worker !== wallet.accountId)
    return <StatusStep {...base} tone="neutral" title="This isn't your job" body="Take a job from the list first." primary={{ label: "See the job", href: `/jobs/${jobId}` }} />
  if (flow.stage !== "idle") return <CheckingStep stage={flow.stage} />

  const now = Date.now()
  switch (job.status) {
    case "Paid":
    case "PayingOut":
      return <PaidStep jobId={jobId} amount={job.amount} title={job.spec.title} approved={worker.data?.approved ?? 1} />
    case "PayoutFailed":
      return <StatusStep {...base} tone="fail" title="Your pay bounced" body="Your photos passed, but the payment could not reach your wallet. The money is safe in the contract. Send it again." primary={{ label: "Send my pay again", onClick: () => void flow.chain("retry_transfer") }} />
    case "UnderReview":
      return <StatusStep {...base} tone="neutral" title="A person is reviewing it" body="Your photos went to a Monomi reviewer. You'll get a decision within 24 hours, and the pay stays set aside until then." secondary={{ label: "Back to jobs", href: "/jobs" }} />
    case "Submitted": {
      const canEscalate = job.submitted_ns !== null && now > job.submitted_ns + VERIFY_TIMEOUT_MS
      if (last?.status === "needs_review")
        return <StatusStep {...base} tone="neutral" title="We couldn't finish the check" body="Something on our side failed, not your photos. If it isn't fixed within 30 minutes of sending, ask a person to review it." primary={canEscalate ? { label: "Ask for a review", onClick: () => void flow.chain("escalate") } : undefined} secondary={{ label: "Try the check again", onClick: () => void flow.check() }} />
      return <StatusStep {...base} tone="neutral" title="Photos sent" body="Your proof is saved on NEAR. Run the check to get paid." primary={{ label: "Check my photos", onClick: () => void flow.check() }} />
    }
    case "Rejected": {
      const canAppeal = job.resolved_ns !== null && now <= job.resolved_ns + APPEAL_WINDOW_MS
      return <StatusStep {...base} tone="fail" title="The photos didn't pass" body={canAppeal ? "No attempts left. If you think this is wrong, you have 15 minutes to appeal." : "No attempts left and the appeal window has closed."} reasons={last?.reasons} primary={canAppeal ? { label: "Appeal", onClick: () => void flow.chain("appeal") } : { label: "Back to jobs", href: "/jobs" }} />
    }
    case "Claimed": {
      if (flow.code) return <CameraStep jobId={jobId} code={flow.code.code} expiresAt={flow.code.expiresAt} busy={false} onSend={(p, pos) => void flow.send(p, pos)} />
      const retry = job.attempts > 0 && last?.status === "rejected"
      return (
        <StatusStep
          {...base}
          tone={retry ? "fail" : "neutral"}
          title={retry ? "Not quite. Try again." : "Ready when you are"}
          body={retry ? "You have one more attempt. You'll get a new code." : "When you're at the spot, get your code, write it on paper and take the photos within 10 minutes."}
          reasons={retry ? last?.reasons : undefined}
          primary={{ label: retry ? "Try again" : "Show my code", onClick: () => void flow.getCode() }}
          secondary={{ label: "Drop this job", onClick: () => void flow.chain("abandon") }}
        />
      )
    }
    default:
      return <StatusStep {...base} tone="neutral" title="This job is closed" body="It was refunded to the poster." primary={{ label: "Find another job", href: "/jobs" }} />
  }
}
