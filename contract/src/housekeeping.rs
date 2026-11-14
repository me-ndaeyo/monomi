use near_sdk::{env, near, require};

use crate::errors::*;
use crate::job::Status;
use crate::{Contract, ContractExt, MINUTE_NS};

#[near]
impl Contract {
    /// Poster cancels before anyone has claimed the job.
    pub fn cancel(&mut self, job_id: u64) {
        let mut job = self.job(job_id);
        require!(env::predecessor_account_id() == job.poster, ERR_NOT_POSTER);
        require!(job.status == Status::Open, ERR_STATUS);
        job.cancelled = true;
        self.start_refund(job);
    }

    pub fn release_stale_claim(&mut self, job_id: u64) {
        let mut job = self.job(job_id);
        require!(job.status == Status::Claimed, ERR_STATUS);
        let claimed = job.claimed_ns.map_or(0, |t| t.0);
        require!(
            env::block_timestamp() > claimed + self.claim_ttl_ns(),
            ERR_CLAIM_ACTIVE
        );
        self.release_worker(&job);
        job.reopen();
        self.save(job);
    }

    pub fn close_rejected(&mut self, job_id: u64) {
        let mut job = self.job(job_id);
        require!(job.status == Status::Rejected, ERR_STATUS);
        let now = env::block_timestamp();
        let window = u64::from(self.params.appeal_window_mins) * MINUTE_NS;
        let resolved = job.resolved_ns.map_or(0, |t| t.0);
        require!(now > resolved + window, ERR_APPEAL_OPEN);
        job.reopen();
        if now >= job.deadline_ns.0 {
            self.start_refund(job);
        } else {
            self.save(job);
        }
    }

    /// Never touches Submitted, Rejected or UnderReview: a worker may be owed.
    pub fn expire(&mut self, job_id: u64) {
        let job = self.job(job_id);
        require!(env::block_timestamp() > job.deadline_ns.0, ERR_NOT_EXPIRED);
        require!(
            matches!(job.status, Status::Open | Status::Claimed),
            ERR_STATUS
        );
        self.start_refund(job);
    }
}
