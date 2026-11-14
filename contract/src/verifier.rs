use near_sdk::{env, near, require};

use crate::errors::*;
use crate::job::{assert_hash, Status};
use crate::{events, Contract, ContractExt};

#[near]
impl Contract {
    pub fn resolve(
        &mut self,
        job_id: u64,
        approved: bool,
        report_hash: String,
        attestation_ref: String,
    ) {
        self.assert_verifier();
        let mut job = self.job(job_id);
        require!(job.status == Status::Submitted, ERR_STATUS);
        assert_hash(&report_hash);
        require!(attestation_ref.len() <= 128, ERR_PARAMS);
        events::job_resolved(job_id, approved, &report_hash);
        job.report_hash = Some(report_hash);
        job.attestation_ref = Some(attestation_ref);

        if approved {
            self.start_payout(job);
            return;
        }

        let now = env::block_timestamp();
        let claimed = job.claimed_ns.map_or(0, |t| t.0);
        let claim_alive = now < claimed + self.claim_ttl_ns();
        if job.attempts < self.params.max_attempts && claim_alive {
            job.status = Status::Claimed;
            self.save(job);
            return;
        }

        job.status = Status::Rejected;
        job.resolved_ns = Some(now.into());
        if let Some(worker) = &job.worker {
            let mut stats = self.stats(worker);
            stats.rejected += 1;
            self.workers.insert(worker.clone(), stats);
        }
        self.release_worker(&job);
        self.save(job);
    }
}
