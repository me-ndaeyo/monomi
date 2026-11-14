use near_sdk::{env, near, require};

use crate::errors::*;
use crate::job::{assert_hash, Job, Status};
use crate::{events, Contract, ContractExt, MINUTE_NS};

impl Contract {
    fn worker_job(&self, job_id: u64, status: Status) -> Job {
        let job = self.job(job_id);
        require!(
            job.worker.as_ref() == Some(&env::predecessor_account_id()),
            ERR_NOT_WORKER
        );
        require!(job.status == status, ERR_STATUS);
        job
    }
}

#[near]
impl Contract {
    pub fn claim(&mut self, job_id: u64) {
        require!(!self.paused, ERR_PAUSED);
        let mut job = self.job(job_id);
        let caller = env::predecessor_account_id();
        let now = env::block_timestamp();
        require!(job.status == Status::Open, ERR_STATUS);
        require!(now < job.deadline_ns.0, ERR_DEADLINE);
        require!(caller != job.poster, ERR_OWN_JOB);
        require!(!job.excluded.contains(&caller), ERR_EXCLUDED);
        let mut stats = self.stats(&caller);
        require!(stats.active_job.is_none(), ERR_ACTIVE_JOB);
        require!(stats.approved >= job.spec.min_reputation, ERR_REPUTATION);

        stats.active_job = Some(job_id);
        self.workers.insert(caller.clone(), stats);
        job.status = Status::Claimed;
        job.worker = Some(caller.clone());
        job.claimed_ns = Some(now.into());
        job.attempts = 0;
        self.save(job);
        events::job_claimed(job_id, &caller);
    }

    pub fn submit_proof(&mut self, job_id: u64, proof_hash: String) {
        let mut job = self.worker_job(job_id, Status::Claimed);
        let now = env::block_timestamp();
        let claimed = job.claimed_ns.map_or(0, |t| t.0);
        require!(now < claimed + self.claim_ttl_ns(), ERR_CLAIM_EXPIRED);
        require!(now < job.deadline_ns.0, ERR_DEADLINE);
        require!(job.attempts < self.params.max_attempts, ERR_ATTEMPTS);
        assert_hash(&proof_hash);
        require!(self.used_proofs.insert(proof_hash.clone()), ERR_PROOF_USED);

        job.status = Status::Submitted;
        job.submitted_ns = Some(now.into());
        job.attempts += 1;
        job.proof_hash = Some(proof_hash.clone());
        self.save(job);
        events::proof_submitted(job_id, &proof_hash);
    }

    pub fn abandon(&mut self, job_id: u64) {
        let mut job = self.worker_job(job_id, Status::Claimed);
        self.release_worker(&job);
        job.reopen();
        self.save(job);
    }

    pub fn appeal(&mut self, job_id: u64) {
        let mut job = self.worker_job(job_id, Status::Rejected);
        let window = u64::from(self.params.appeal_window_mins) * MINUTE_NS;
        let resolved = job.resolved_ns.map_or(0, |t| t.0);
        require!(env::block_timestamp() <= resolved + window, ERR_APPEAL_CLOSED);
        job.status = Status::UnderReview;
        self.save(job);
    }

    pub fn escalate(&mut self, job_id: u64) {
        let mut job = self.worker_job(job_id, Status::Submitted);
        let timeout = u64::from(self.params.verify_timeout_mins) * MINUTE_NS;
        let submitted = job.submitted_ns.map_or(0, |t| t.0);
        require!(env::block_timestamp() > submitted + timeout, ERR_TOO_EARLY);
        job.status = Status::UnderReview;
        self.save(job);
    }
}
