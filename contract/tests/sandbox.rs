mod common;

use common::*;
use serde_json::json;

// 1
#[tokio::test]
async fn post_job_creates_job_and_holds_funds() -> TestResult {
    let env = Env::new().await?;
    let id = env.post(0).await?;
    assert_eq!(env.status(id).await?, "Open");
    assert_eq!(env.balance(env.escrow.as_account()).await?, PAY);
    assert_eq!(env.balance(&env.poster).await?, 25 * USDC - PAY);
    Ok(())
}

// 2
#[tokio::test]
async fn bad_posts_refund_poster_and_create_nothing() -> TestResult {
    let env = Env::new().await?;
    env.call(
        &env.owner,
        "set_params",
        json!({ "params": {
            "min_amount": "500000", "max_amount": "10000000",
            "claim_ttl_mins": 45, "verify_timeout_mins": 30,
            "appeal_window_mins": 15, "max_attempts": 2
        }}),
    )
    .await?
    .into_result()?;
    let start = env.balance(&env.poster).await?;
    let bad = [
        (PAY, json!({ "nope": 1 })),
        (100_000, json!({ "post_job": spec(0) })),
        (11 * USDC, json!({ "post_job": spec(0) })),
    ];
    for (amount, msg) in bad {
        let _ = env.post_as(&env.poster, amount, msg).await?;
        assert_eq!(env.balance(&env.poster).await?, start);
    }
    let direct = env
        .call(
            &env.poster,
            "ft_on_transfer",
            json!({ "sender_id": env.poster.id(), "amount": PAY.to_string(),
                    "msg": json!({ "post_job": spec(0) }).to_string() }),
        )
        .await?;
    assert!(fails_with(&direct, "This token is not accepted"));
    assert_eq!(env.total_jobs().await?, 0);
    assert_eq!(env.balance(env.escrow.as_account()).await?, 0);
    Ok(())
}

// 3
#[tokio::test]
async fn claim_rules() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    let second = env.post(0).await?;
    let gated = env.post(5).await?;

    let own = env.call(&env.poster, "claim", json!({ "job_id": job })).await?;
    assert!(fails_with(&own, "You cannot take your own job"));
    let low = env.call(&env.bob, "claim", json!({ "job_id": gated })).await?;
    assert!(fails_with(&low, "Not enough finished jobs"));

    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;
    assert_eq!(env.status(job).await?, "Claimed");
    let twice = env.call(&env.alice, "claim", json!({ "job_id": second })).await?;
    assert!(fails_with(&twice, "Finish your current job first"));

    env.call(&env.alice, "abandon", json!({ "job_id": job })).await?.into_result()?;
    let excluded = env.call(&env.alice, "claim", json!({ "job_id": job })).await?;
    assert!(fails_with(&excluded, "You cannot take this job again"));
    Ok(())
}

// 4
#[tokio::test]
async fn submit_rules() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    let other = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;

    let stranger = env.submit(&env.bob, job, HASH_A).await?;
    assert!(fails_with(&stranger, "Only the worker on this job"));
    env.submit(&env.alice, job, HASH_A).await?.into_result()?;

    env.call(&env.bob, "claim", json!({ "job_id": other })).await?.into_result()?;
    let reused = env.submit(&env.bob, other, HASH_A).await?;
    assert!(fails_with(&reused, "This proof was already used"));

    env.advance_mins(46).await?;
    let late = env.submit(&env.bob, other, HASH_B).await?;
    assert!(fails_with(&late, "Your time on this job ran out"));
    Ok(())
}

// 5
#[tokio::test]
async fn resolve_rules() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;

    let early = env.resolve(&env.verifier, job, true).await?;
    assert!(fails_with(&early, "not in the right state"));
    env.submit(&env.alice, job, HASH_A).await?.into_result()?;
    let impostor = env.resolve(&env.alice, job, true).await?;
    assert!(fails_with(&impostor, "Only the verifier"));

    env.resolve(&env.verifier, job, true).await?.into_result()?;
    let again = env.resolve(&env.verifier, job, true).await?;
    assert!(fails_with(&again, "not in the right state"));
    Ok(())
}

// 6
#[tokio::test]
async fn approve_pays_exact_amount_and_updates_stats() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;
    env.submit(&env.alice, job, HASH_A).await?.into_result()?;
    env.resolve(&env.verifier, job, true).await?.into_result()?;

    assert_eq!(env.status(job).await?, "Paid");
    assert_eq!(env.balance(&env.alice).await?, PAY);
    assert_eq!(env.balance(env.escrow.as_account()).await?, 0);
    let stats = env.worker_stats(&env.alice).await?;
    assert_eq!(stats["approved"], 1);
    assert!(stats["active_job"].is_null());
    Ok(())
}

// 7
#[tokio::test]
async fn payout_to_unregistered_worker_fails_then_retry_pays() -> TestResult {
    let env = Env::new().await?;
    let carol = account(&env.sandbox, "carol").await?;
    let job = env.post(0).await?;
    env.call(&carol, "claim", json!({ "job_id": job })).await?.into_result()?;
    env.submit(&carol, job, HASH_A).await?.into_result()?;
    env.resolve(&env.verifier, job, true).await?.into_result()?;
    assert_eq!(env.status(job).await?, "PayoutFailed");
    assert_eq!(env.balance(env.escrow.as_account()).await?, PAY);

    env.register(&carol).await?;
    env.call(&env.bob, "retry_transfer", json!({ "job_id": job })).await?.into_result()?;
    assert_eq!(env.status(job).await?, "Paid");
    assert_eq!(env.balance(&carol).await?, PAY);
    Ok(())
}

// 8
#[tokio::test]
async fn reject_retry_appeal_and_close() -> TestResult {
    let env = Env::new().await?;
    let appealed = env.post(0).await?;
    let closed = env.post(0).await?;
    let attempts = [(&env.alice, appealed, HASH_A, HASH_B), (&env.bob, closed, HASH_C, REPORT)];
    for (who, job, first, second) in attempts {
        env.call(who, "claim", json!({ "job_id": job })).await?.into_result()?;
        env.submit(who, job, first).await?.into_result()?;
        env.resolve(&env.verifier, job, false).await?.into_result()?;
        assert_eq!(env.status(job).await?, "Claimed");
        env.submit(who, job, second).await?.into_result()?;
        env.resolve(&env.verifier, job, false).await?.into_result()?;
        assert_eq!(env.status(job).await?, "Rejected");
        assert_eq!(env.worker_stats(who).await?["rejected"], 1);
    }

    env.call(&env.alice, "appeal", json!({ "job_id": appealed })).await?.into_result()?;
    assert_eq!(env.status(appealed).await?, "UnderReview");

    env.advance_mins(16).await?;
    let late = env.call(&env.bob, "appeal", json!({ "job_id": closed })).await?;
    assert!(fails_with(&late, "The appeal window has closed"));
    env.call(&env.alice, "close_rejected", json!({ "job_id": closed })).await?.into_result()?;
    let reopened = env.job(closed).await?;
    assert_eq!(reopened["status"], "Open");
    assert_eq!(reopened["excluded"][0], env.bob.id().as_str());
    Ok(())
}

// 9
#[tokio::test]
async fn escalate_after_verifier_timeout_and_admin_pays() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;
    env.submit(&env.alice, job, HASH_A).await?.into_result()?;

    let early = env.call(&env.alice, "escalate", json!({ "job_id": job })).await?;
    assert!(fails_with(&early, "The verifier still has time"));
    env.advance_mins(31).await?;
    env.call(&env.alice, "escalate", json!({ "job_id": job })).await?.into_result()?;
    assert_eq!(env.status(job).await?, "UnderReview");

    let args = json!({ "job_id": job, "approved": true, "note_hash": REPORT });
    let not_owner = env.call(&env.alice, "admin_resolve", args.clone()).await?;
    assert!(fails_with(&not_owner, "Only the owner"));
    env.call(&env.owner, "admin_resolve", args).await?.into_result()?;
    assert_eq!(env.status(job).await?, "Paid");
    assert_eq!(env.balance(&env.alice).await?, PAY);
    Ok(())
}

// 10
#[tokio::test]
async fn expire_refunds_open_and_claimed_only() -> TestResult {
    let env = Env::new().await?;
    let open = env.post(0).await?;
    let claimed = env.post(0).await?;
    let submitted = env.post(0).await?;
    let rejected = env.post(0).await?;
    let review = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": claimed })).await?.into_result()?;
    env.call(&env.bob, "claim", json!({ "job_id": submitted })).await?.into_result()?;
    env.submit(&env.bob, submitted, HASH_A).await?.into_result()?;

    let early = env.call(&env.bob, "expire", json!({ "job_id": open })).await?;
    assert!(fails_with(&early, "Job deadline has not passed"));

    let carol = account(&env.sandbox, "carol").await?;
    env.call(&carol, "claim", json!({ "job_id": rejected })).await?.into_result()?;
    env.submit(&carol, rejected, HASH_B).await?.into_result()?;
    env.resolve(&env.verifier, rejected, false).await?.into_result()?;
    env.submit(&carol, rejected, HASH_C).await?.into_result()?;
    env.resolve(&env.verifier, rejected, false).await?.into_result()?;

    let dave = account(&env.sandbox, "dave").await?;
    env.call(&dave, "claim", json!({ "job_id": review })).await?.into_result()?;
    env.submit(&dave, review, REPORT).await?.into_result()?;

    env.advance_mins(121).await?;
    env.call(&dave, "escalate", json!({ "job_id": review })).await?.into_result()?;
    let before = env.balance(&env.poster).await?;
    for id in [open, claimed] {
        env.call(&env.bob, "expire", json!({ "job_id": id })).await?.into_result()?;
        assert_eq!(env.status(id).await?, "Refunded");
    }
    assert_eq!(env.balance(&env.poster).await?, before + 2 * PAY);
    assert!(env.worker_stats(&env.alice).await?["active_job"].is_null());
    for id in [submitted, rejected, review] {
        let refused = env.call(&env.bob, "expire", json!({ "job_id": id })).await?;
        assert!(fails_with(&refused, "not in the right state"));
    }
    Ok(())
}

// 11
#[tokio::test]
async fn cancel_only_by_poster_while_open() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    let stranger = env.call(&env.bob, "cancel", json!({ "job_id": job })).await?;
    assert!(fails_with(&stranger, "Only the poster"));
    let claimed = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": claimed })).await?.into_result()?;
    let after_claim = env.call(&env.poster, "cancel", json!({ "job_id": claimed })).await?;
    assert!(fails_with(&after_claim, "not in the right state"));

    let before = env.balance(&env.poster).await?;
    env.call(&env.poster, "cancel", json!({ "job_id": job })).await?.into_result()?;
    let cancelled = env.job(job).await?;
    assert_eq!(cancelled["status"], "Refunded");
    assert_eq!(cancelled["cancelled"], true);
    assert_eq!(env.balance(&env.poster).await?, before + PAY);
    Ok(())
}

// 12
#[tokio::test]
async fn stale_claim_is_released_and_worker_excluded() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;
    let early = env.call(&env.bob, "release_stale_claim", json!({ "job_id": job })).await?;
    assert!(fails_with(&early, "The claim has not timed out yet"));

    env.advance_mins(46).await?;
    env.call(&env.bob, "release_stale_claim", json!({ "job_id": job })).await?.into_result()?;
    let reopened = env.job(job).await?;
    assert_eq!(reopened["status"], "Open");
    assert_eq!(reopened["excluded"][0], env.alice.id().as_str());
    assert!(env.worker_stats(&env.alice).await?["active_job"].is_null());
    Ok(())
}

// 13
#[tokio::test]
async fn paused_blocks_posting_and_claiming_only() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    let other = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": job })).await?.into_result()?;
    env.submit(&env.alice, job, HASH_A).await?.into_result()?;
    env.call(&env.owner, "pause", json!({})).await?.into_result()?;

    let before = env.total_jobs().await?;
    let _ = env.post_as(&env.poster, PAY, json!({ "post_job": spec(0) })).await?;
    assert_eq!(env.total_jobs().await?, before);
    let claim = env.call(&env.bob, "claim", json!({ "job_id": other })).await?;
    assert!(fails_with(&claim, "Monomi is paused"));

    env.resolve(&env.verifier, job, true).await?.into_result()?;
    assert_eq!(env.status(job).await?, "Paid");
    env.call(&env.poster, "cancel", json!({ "job_id": other })).await?.into_result()?;
    assert_eq!(env.status(other).await?, "Refunded");
    Ok(())
}

// 14
#[tokio::test]
async fn admin_cancel_refunds_open_jobs_only() -> TestResult {
    let env = Env::new().await?;
    let job = env.post(0).await?;
    let claimed = env.post(0).await?;
    env.call(&env.alice, "claim", json!({ "job_id": claimed })).await?.into_result()?;

    let not_owner = env.call(&env.bob, "admin_cancel", json!({ "job_id": job })).await?;
    assert!(fails_with(&not_owner, "Only the owner"));
    let wrong_state = env.call(&env.owner, "admin_cancel", json!({ "job_id": claimed })).await?;
    assert!(fails_with(&wrong_state, "not in the right state"));

    env.call(&env.owner, "admin_cancel", json!({ "job_id": job })).await?.into_result()?;
    assert_eq!(env.status(job).await?, "Refunded");
    assert_eq!(env.job(job).await?["cancelled"], true);
    Ok(())
}
