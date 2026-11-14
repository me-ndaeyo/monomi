use near_contract_standards::fungible_token::core::ext_ft_core;
use near_sdk::{env, near, require, AccountId, Gas, NearToken, PromiseError};

use crate::errors::ERR_STATUS;
use crate::job::{Job, Status};
use crate::{events, Contract, ContractExt};

const TRANSFER_GAS: Gas = Gas::from_tgas(10);
const CALLBACK_GAS: Gas = Gas::from_tgas(10);

impl Contract {
    /// Checks-effects-interactions: all state is final before the transfer.
    pub(crate) fn start_payout(&mut self, mut job: Job) {
        let worker = job.worker.clone().unwrap_or_else(|| env::panic_str(ERR_STATUS));
        let mut stats = self.stats(&worker);
        stats.approved += 1;
        if stats.active_job == Some(job.id) {
            stats.active_job = None;
        }
        self.workers.insert(worker.clone(), stats);
        self.change_open_count(&job.poster, false);
        job.status = Status::PayingOut;
        job.resolved_ns = Some(env::block_timestamp().into());
        let (id, amount) = (job.id, job.amount);
        self.save(job);
        self.send(id, worker, amount.0, true);
    }

    pub(crate) fn start_refund(&mut self, mut job: Job) {
        self.release_worker(&job);
        self.change_open_count(&job.poster, false);
        job.status = Status::Refunding;
        let (id, poster, amount) = (job.id, job.poster.clone(), job.amount);
        self.save(job);
        self.send(id, poster, amount.0, false);
    }

    pub(crate) fn send(&self, job_id: u64, to: AccountId, amount: u128, payout: bool) {
        let callback = Self::ext(env::current_account_id()).with_static_gas(CALLBACK_GAS);
        let callback = if payout {
            callback.on_payout(job_id)
        } else {
            callback.on_refund(job_id)
        };
        ext_ft_core::ext(self.usdc.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(TRANSFER_GAS)
            .ft_transfer(to, amount.into(), Some(format!("monomi job {job_id}")))
            .then(callback)
            .detach();
    }
}

#[near]
impl Contract {
    #[private]
    pub fn on_payout(&mut self, job_id: u64, #[callback_result] result: Result<(), PromiseError>) {
        let mut job = self.job(job_id);
        require!(job.status == Status::PayingOut, ERR_STATUS);
        let worker = job.worker.clone().unwrap_or_else(|| env::panic_str(ERR_STATUS));
        if result.is_ok() {
            job.status = Status::Paid;
            events::job_paid(job_id, &worker, job.amount.0);
        } else {
            job.status = Status::PayoutFailed;
            events::payout_failed(job_id, &worker);
        }
        self.save(job);
    }

    #[private]
    pub fn on_refund(&mut self, job_id: u64, #[callback_result] result: Result<(), PromiseError>) {
        let mut job = self.job(job_id);
        require!(job.status == Status::Refunding, ERR_STATUS);
        if result.is_ok() {
            job.status = Status::Refunded;
            events::job_refunded(job_id, &job.poster, job.amount.0);
        } else {
            job.status = Status::RefundFailed;
            events::payout_failed(job_id, &job.poster);
        }
        self.save(job);
    }

    /// Anyone can resend a failed transfer to the same recipient.
    pub fn retry_transfer(&mut self, job_id: u64) {
        let mut job = self.job(job_id);
        let (status, to, payout) = match job.status {
            Status::PayoutFailed => (
                Status::PayingOut,
                job.worker.clone().unwrap_or_else(|| env::panic_str(ERR_STATUS)),
                true,
            ),
            Status::RefundFailed => (Status::Refunding, job.poster.clone(), false),
            _ => env::panic_str(ERR_STATUS),
        };
        job.status = status;
        let amount = job.amount.0;
        self.save(job);
        self.send(job_id, to, amount, payout);
    }
}
