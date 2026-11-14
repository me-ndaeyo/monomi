use near_sdk::serde_json::{json, Value};
use near_sdk::{env, AccountId};

fn emit(event: &str, data: Value) {
    let log = json!({
        "standard": "monomi",
        "version": "1.0.0",
        "event": event,
        "data": [data],
    });
    env::log_str(&format!("EVENT_JSON:{log}"));
}

pub fn job_posted(job_id: u64, poster: &AccountId, amount: u128) {
    emit(
        "monomi_job_posted",
        json!({ "job_id": job_id, "poster": poster, "amount": amount.to_string() }),
    );
}

pub fn job_claimed(job_id: u64, worker: &AccountId) {
    emit("monomi_job_claimed", json!({ "job_id": job_id, "worker": worker }));
}

pub fn proof_submitted(job_id: u64, proof_hash: &str) {
    emit(
        "monomi_proof_submitted",
        json!({ "job_id": job_id, "proof_hash": proof_hash }),
    );
}

pub fn job_resolved(job_id: u64, approved: bool, report_hash: &str) {
    emit(
        "monomi_job_resolved",
        json!({ "job_id": job_id, "approved": approved, "report_hash": report_hash }),
    );
}

pub fn job_paid(job_id: u64, worker: &AccountId, amount: u128) {
    emit(
        "monomi_job_paid",
        json!({ "job_id": job_id, "worker": worker, "amount": amount.to_string() }),
    );
}

pub fn job_refunded(job_id: u64, poster: &AccountId, amount: u128) {
    emit(
        "monomi_job_refunded",
        json!({ "job_id": job_id, "poster": poster, "amount": amount.to_string() }),
    );
}

pub fn payout_failed(job_id: u64, recipient: &AccountId) {
    emit(
        "monomi_payout_failed",
        json!({ "job_id": job_id, "recipient": recipient }),
    );
}
