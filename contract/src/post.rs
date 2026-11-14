use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::json_types::U128;
use near_sdk::serde::Deserialize;
use near_sdk::serde_json;
use near_sdk::{env, near, require, AccountId, PromiseOrValue};

use crate::errors::*;
use crate::job::{Job, JobSpec, Status};
use crate::{events, Contract, ContractExt, MAX_OPEN_JOBS_PER_POSTER, MINUTE_NS};

#[derive(Deserialize)]
#[serde(crate = "near_sdk::serde", deny_unknown_fields)]
struct PostMsg {
    post_job: JobSpec,
}

#[near]
impl FungibleTokenReceiver for Contract {
    /// Any panic here makes the token contract refund the full amount.
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        require!(env::predecessor_account_id() == self.usdc, ERR_WRONG_TOKEN);
        require!(!self.paused, ERR_PAUSED);
        let PostMsg { post_job: spec } =
            serde_json::from_str(&msg).unwrap_or_else(|_| env::panic_str(ERR_BAD_MSG));
        let range = self.params.min_amount.0..=self.params.max_amount.0;
        require!(range.contains(&amount.0), ERR_AMOUNT);
        spec.assert_valid();
        require!(
            sender_id != self.verifier && sender_id != self.owner,
            ERR_POSTER_NOT_ALLOWED
        );
        let open = self.open_jobs.get(&sender_id).copied().unwrap_or(0);
        require!(open < MAX_OPEN_JOBS_PER_POSTER, ERR_TOO_MANY_OPEN);

        let now = env::block_timestamp();
        let id = self.next_id;
        self.next_id += 1;
        let deadline = now + u64::from(spec.duration_mins) * MINUTE_NS;
        self.save(Job {
            id,
            poster: sender_id.clone(),
            amount,
            spec,
            created_ns: now.into(),
            deadline_ns: deadline.into(),
            status: Status::Open,
            cancelled: false,
            worker: None,
            claimed_ns: None,
            attempts: 0,
            excluded: Vec::new(),
            proof_hash: None,
            submitted_ns: None,
            report_hash: None,
            attestation_ref: None,
            resolved_ns: None,
        });
        self.change_open_count(&sender_id, true);
        events::job_posted(id, &sender_id, amount.0);
        PromiseOrValue::Value(U128(0))
    }
}
