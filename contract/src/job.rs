use near_sdk::json_types::{U128, U64};
use near_sdk::{near, require, AccountId};

use crate::errors::{ERR_HASH, ERR_SPEC};

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, PartialEq)]
pub struct JobSpec {
    pub title: String,
    pub instructions: String,
    pub lat_e6: i32,
    pub lng_e6: i32,
    pub radius_m: u32,
    pub expected_text: Option<String>,
    pub duration_mins: u32,
    pub min_reputation: u32,
}

impl JobSpec {
    pub fn assert_valid(&self) {
        let title = self.title.trim().chars().count();
        let instructions = self.instructions.trim().chars().count();
        require!((1..=80).contains(&title), ERR_SPEC);
        require!((1..=600).contains(&instructions), ERR_SPEC);
        require!((-90_000_000..=90_000_000).contains(&self.lat_e6), ERR_SPEC);
        require!((-180_000_000..=180_000_000).contains(&self.lng_e6), ERR_SPEC);
        require!((25..=2000).contains(&self.radius_m), ERR_SPEC);
        require!((30..=1440).contains(&self.duration_mins), ERR_SPEC);
        require!(self.min_reputation <= 1000, ERR_SPEC);
        if let Some(text) = &self.expected_text {
            let len = text.trim().chars().count();
            require!((1..=60).contains(&len), ERR_SPEC);
        }
    }
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Status {
    Open,
    Claimed,
    Submitted,
    Rejected,
    UnderReview,
    PayingOut,
    Paid,
    PayoutFailed,
    Refunding,
    Refunded,
    RefundFailed,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug)]
pub struct Job {
    pub id: u64,
    pub poster: AccountId,
    pub amount: U128,
    pub spec: JobSpec,
    pub created_ns: U64,
    pub deadline_ns: U64,
    pub status: Status,
    pub cancelled: bool,
    pub worker: Option<AccountId>,
    pub claimed_ns: Option<U64>,
    pub attempts: u8,
    pub excluded: Vec<AccountId>,
    pub proof_hash: Option<String>,
    pub submitted_ns: Option<U64>,
    pub report_hash: Option<String>,
    pub attestation_ref: Option<String>,
    pub resolved_ns: Option<U64>,
}

const MAX_EXCLUDED: usize = 10;

impl Job {
    pub fn exclude(&mut self, account: AccountId) {
        if self.excluded.contains(&account) {
            return;
        }
        if self.excluded.len() == MAX_EXCLUDED {
            self.excluded.remove(0);
        }
        self.excluded.push(account);
    }

    /// Back to Open with the current worker excluded and attempt data cleared.
    pub fn reopen(&mut self) {
        if let Some(worker) = self.worker.take() {
            self.exclude(worker);
        }
        self.status = Status::Open;
        self.claimed_ns = None;
        self.attempts = 0;
        self.proof_hash = None;
        self.submitted_ns = None;
    }
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Debug, Default)]
pub struct WorkerStats {
    pub approved: u32,
    pub rejected: u32,
    pub active_job: Option<u64>,
}

pub fn assert_hash(hash: &str) {
    let ok = hash.len() == 64
        && hash
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b));
    require!(ok, ERR_HASH);
}
