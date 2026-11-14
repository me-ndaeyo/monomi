mod admin;
mod errors;
mod events;
mod housekeeping;
mod job;
mod payout;
mod post;
mod verifier;
mod views;
mod worker;

use near_sdk::store::{IterableMap, LookupMap, LookupSet};
use near_sdk::{env, near, require, AccountId, BorshStorageKey, PanicOnDefault};

pub use crate::job::{Job, JobSpec, Status, WorkerStats};
use crate::errors::{ERR_NOT_OWNER, ERR_NOT_VERIFIER, ERR_NO_JOB, ERR_PARAMS};

const MINUTE_NS: u64 = 60_000_000_000;
const MAX_OPEN_JOBS_PER_POSTER: u32 = 20;

#[near(serializers = [borsh])]
#[derive(BorshStorageKey)]
enum StorageKey {
    Jobs,
    Workers,
    UsedProofs,
    OpenJobs,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct Params {
    pub min_amount: near_sdk::json_types::U128,
    pub max_amount: near_sdk::json_types::U128,
    pub claim_ttl_mins: u32,
    pub verify_timeout_mins: u32,
    pub appeal_window_mins: u32,
    pub max_attempts: u8,
}

impl Params {
    fn assert_valid(&self) {
        let (min, max) = (self.min_amount.0, self.max_amount.0);
        require!(min >= 100_000 && min <= max, ERR_PARAMS);
        require!(max <= 1_000_000_000, ERR_PARAMS);
        require!((5..=1440).contains(&self.claim_ttl_mins), ERR_PARAMS);
        require!((5..=1440).contains(&self.verify_timeout_mins), ERR_PARAMS);
        require!((5..=1440).contains(&self.appeal_window_mins), ERR_PARAMS);
        require!((1..=5).contains(&self.max_attempts), ERR_PARAMS);
    }
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    owner: AccountId,
    verifier: AccountId,
    usdc: AccountId,
    paused: bool,
    params: Params,
    next_id: u64,
    jobs: IterableMap<u64, Job>,
    workers: LookupMap<AccountId, WorkerStats>,
    used_proofs: LookupSet<String>,
    open_jobs: LookupMap<AccountId, u32>,
}

#[near]
impl Contract {
    #[init]
    pub fn new(owner: AccountId, verifier: AccountId, usdc: AccountId) -> Self {
        Self {
            owner,
            verifier,
            usdc,
            paused: false,
            params: Params {
                min_amount: 500_000.into(),
                max_amount: 25_000_000.into(),
                claim_ttl_mins: 45,
                verify_timeout_mins: 30,
                appeal_window_mins: 15,
                max_attempts: 2,
            },
            next_id: 0,
            jobs: IterableMap::new(StorageKey::Jobs),
            workers: LookupMap::new(StorageKey::Workers),
            used_proofs: LookupSet::new(StorageKey::UsedProofs),
            open_jobs: LookupMap::new(StorageKey::OpenJobs),
        }
    }
}

impl Contract {
    fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.owner, ERR_NOT_OWNER);
    }

    fn assert_verifier(&self) {
        require!(env::predecessor_account_id() == self.verifier, ERR_NOT_VERIFIER);
    }

    fn job(&self, job_id: u64) -> Job {
        self.jobs.get(&job_id).cloned().unwrap_or_else(|| env::panic_str(ERR_NO_JOB))
    }

    fn save(&mut self, job: Job) {
        self.jobs.insert(job.id, job);
    }

    fn stats(&self, account: &AccountId) -> WorkerStats {
        self.workers.get(account).cloned().unwrap_or_default()
    }

    /// Clears the worker's active job if it points at this job.
    fn release_worker(&mut self, job: &Job) {
        let Some(worker) = &job.worker else { return };
        let mut stats = self.stats(worker);
        if stats.active_job == Some(job.id) {
            stats.active_job = None;
            self.workers.insert(worker.clone(), stats);
        }
    }

    fn change_open_count(&mut self, poster: &AccountId, up: bool) {
        let count = self.open_jobs.get(poster).copied().unwrap_or(0);
        let next = if up { count + 1 } else { count.saturating_sub(1) };
        self.open_jobs.insert(poster.clone(), next);
    }

    fn claim_ttl_ns(&self) -> u64 {
        u64::from(self.params.claim_ttl_mins) * MINUTE_NS
    }
}
