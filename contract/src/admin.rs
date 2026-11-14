use near_sdk::{env, near, require, AccountId};

use crate::errors::*;
use crate::job::{assert_hash, Status};
use crate::{Contract, ContractExt, Params};

#[near]
impl Contract {
    /// Decides a job that was appealed or that the verifier never resolved.
    pub fn admin_resolve(&mut self, job_id: u64, approved: bool, note_hash: String) {
        self.assert_owner();
        let mut job = self.job(job_id);
        require!(job.status == Status::UnderReview, ERR_STATUS);
        assert_hash(&note_hash);
        job.report_hash = Some(note_hash);
        if approved {
            self.start_payout(job);
            return;
        }
        self.release_worker(&job);
        job.resolved_ns = Some(env::block_timestamp().into());
        job.reopen();
        if env::block_timestamp() >= job.deadline_ns.0 {
            self.start_refund(job);
        } else {
            self.save(job);
        }
    }

    /// Moderation: removes an open job and refunds the poster.
    pub fn admin_cancel(&mut self, job_id: u64) {
        self.assert_owner();
        let mut job = self.job(job_id);
        require!(job.status == Status::Open, ERR_STATUS);
        job.cancelled = true;
        self.start_refund(job);
    }

    pub fn set_verifier(&mut self, account: AccountId) {
        self.assert_owner();
        self.verifier = account;
    }

    pub fn pause(&mut self) {
        self.assert_owner();
        self.paused = true;
    }

    pub fn unpause(&mut self) {
        self.assert_owner();
        self.paused = false;
    }

    pub fn set_params(&mut self, params: Params) {
        self.assert_owner();
        params.assert_valid();
        self.params = params;
    }
}
