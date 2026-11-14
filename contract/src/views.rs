use near_sdk::{near, AccountId};

use crate::job::{Job, Status, WorkerStats};
use crate::{Contract, ContractExt, Params};

const MAX_PAGE: u64 = 100;

#[near(serializers = [json])]
pub struct Config {
    owner: AccountId,
    verifier: AccountId,
    usdc: AccountId,
    paused: bool,
    params: Params,
    total_jobs: u64,
}

#[near]
impl Contract {
    pub fn get_job(&self, job_id: u64) -> Option<Job> {
        self.jobs.get(&job_id).cloned()
    }

    /// Newest first. `from_index` counts back from the newest job.
    pub fn get_jobs(
        &self,
        from_index: Option<u64>,
        limit: Option<u64>,
        status: Option<Status>,
        poster: Option<AccountId>,
    ) -> Vec<Job> {
        let limit = limit.unwrap_or(50).min(MAX_PAGE) as usize;
        (0..self.next_id)
            .rev()
            .filter_map(|id| self.jobs.get(&id))
            .filter(|job| status.is_none_or(|s| job.status == s))
            .filter(|job| poster.as_ref().is_none_or(|p| &job.poster == p))
            .skip(from_index.unwrap_or(0) as usize)
            .take(limit)
            .cloned()
            .collect()
    }

    pub fn get_worker(&self, account: AccountId) -> WorkerStats {
        self.stats(&account)
    }

    pub fn get_open_job_count(&self, poster: AccountId) -> u32 {
        self.open_jobs.get(&poster).copied().unwrap_or(0)
    }

    pub fn get_config(&self) -> Config {
        Config {
            owner: self.owner.clone(),
            verifier: self.verifier.clone(),
            usdc: self.usdc.clone(),
            paused: self.paused,
            params: self.params.clone(),
            total_jobs: self.next_id,
        }
    }
}
