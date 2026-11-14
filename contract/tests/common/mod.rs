use near_workspaces::network::Sandbox;
use near_workspaces::result::ExecutionFinalResult;
use near_workspaces::types::NearToken;
use near_workspaces::{Account, Contract, Worker};
use serde_json::{json, Value};
use tokio::sync::OnceCell;

pub const USDC: u128 = 1_000_000;
pub const PAY: u128 = 5 * USDC;
pub const HASH_A: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
pub const HASH_B: &str = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
pub const HASH_C: &str = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
pub const REPORT: &str = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";

pub struct Env {
    pub sandbox: Worker<Sandbox>,
    pub token: Contract,
    pub escrow: Contract,
    pub owner: Account,
    pub verifier: Account,
    pub poster: Account,
    pub alice: Account,
    pub bob: Account,
}

pub type TestResult = anyhow::Result<()>;

static TOKEN_WASM: OnceCell<Vec<u8>> = OnceCell::const_new();
static ESCROW_WASM: OnceCell<Vec<u8>> = OnceCell::const_new();

/// Builds each contract once per test run.
async fn wasm(cell: &'static OnceCell<Vec<u8>>, path: &str) -> anyhow::Result<&'static [u8]> {
    let bytes = cell
        .get_or_try_init(|| async { near_workspaces::compile_project(path).await })
        .await?;
    Ok(bytes)
}

pub async fn account(sandbox: &Worker<Sandbox>, name: &str) -> anyhow::Result<Account> {
    let root = sandbox.root_account()?;
    Ok(root
        .create_subaccount(name)
        .initial_balance(NearToken::from_near(20))
        .transact()
        .await?
        .into_result()?)
}

impl Env {
    pub async fn new() -> anyhow::Result<Self> {
        let sandbox = near_workspaces::sandbox().await?;
        let token = sandbox.dev_deploy(wasm(&TOKEN_WASM, "./tusdc").await?).await?;
        token.call("new").transact().await?.into_result()?;
        let escrow = sandbox.dev_deploy(wasm(&ESCROW_WASM, "./").await?).await?;
        let owner = account(&sandbox, "owner").await?;
        let verifier = account(&sandbox, "verifier").await?;
        let poster = account(&sandbox, "poster").await?;
        let alice = account(&sandbox, "alice").await?;
        let bob = account(&sandbox, "bob").await?;
        escrow
            .call("new")
            .args_json(json!({ "owner": owner.id(), "verifier": verifier.id(), "usdc": token.id() }))
            .transact()
            .await?
            .into_result()?;
        let env = Self { sandbox, token, escrow, owner, verifier, poster, alice, bob };
        env.register(env.escrow.as_account()).await?;
        env.register(&env.alice).await?;
        env.register(&env.bob).await?;
        env.poster
            .call(env.token.id(), "mint")
            .args_json(json!({ "amount": (25 * USDC).to_string() }))
            .transact()
            .await?
            .into_result()?;
        Ok(env)
    }

    pub async fn register(&self, acc: &Account) -> TestResult {
        acc.call(self.token.id(), "storage_deposit")
            .args_json(json!({}))
            .deposit(NearToken::from_millinear(10))
            .transact()
            .await?
            .into_result()?;
        Ok(())
    }

    pub async fn post_as(&self, from: &Account, amount: u128, msg: Value) -> anyhow::Result<ExecutionFinalResult> {
        Ok(from
            .call(self.token.id(), "ft_transfer_call")
            .args_json(json!({
                "receiver_id": self.escrow.id(),
                "amount": amount.to_string(),
                "msg": msg.to_string(),
            }))
            .deposit(NearToken::from_yoctonear(1))
            .max_gas()
            .transact()
            .await?)
    }

    /// Posts a valid job and returns its id.
    pub async fn post(&self, min_reputation: u32) -> anyhow::Result<u64> {
        let before = self.total_jobs().await?;
        self.post_as(&self.poster, PAY, json!({ "post_job": spec(min_reputation) }))
            .await?
            .into_result()?;
        assert_eq!(self.total_jobs().await?, before + 1, "job was not created");
        Ok(before)
    }

    pub async fn call(&self, from: &Account, method: &str, args: Value) -> anyhow::Result<ExecutionFinalResult> {
        Ok(from.call(self.escrow.id(), method).args_json(args).max_gas().transact().await?)
    }

    pub async fn job(&self, id: u64) -> anyhow::Result<Value> {
        Ok(self.escrow.view("get_job").args_json(json!({ "job_id": id })).await?.json()?)
    }

    pub async fn status(&self, id: u64) -> anyhow::Result<String> {
        Ok(self.job(id).await?["status"].as_str().unwrap_or_default().to_string())
    }

    pub async fn total_jobs(&self) -> anyhow::Result<u64> {
        let config: Value = self.escrow.view("get_config").await?.json()?;
        Ok(config["total_jobs"].as_u64().unwrap_or_default())
    }

    pub async fn worker_stats(&self, acc: &Account) -> anyhow::Result<Value> {
        Ok(self.escrow.view("get_worker").args_json(json!({ "account": acc.id() })).await?.json()?)
    }

    pub async fn balance(&self, acc: &Account) -> anyhow::Result<u128> {
        let v: String = self
            .token
            .view("ft_balance_of")
            .args_json(json!({ "account_id": acc.id() }))
            .await?
            .json()?;
        Ok(v.parse()?)
    }

    pub async fn submit(&self, who: &Account, id: u64, hash: &str) -> anyhow::Result<ExecutionFinalResult> {
        self.call(who, "submit_proof", json!({ "job_id": id, "proof_hash": hash })).await
    }

    pub async fn resolve(&self, who: &Account, id: u64, approved: bool) -> anyhow::Result<ExecutionFinalResult> {
        self.call(
            who,
            "resolve",
            json!({ "job_id": id, "approved": approved, "report_hash": REPORT, "attestation_ref": "chat-1" }),
        )
        .await
    }

    /// Advances chain time by at least `mins` minutes.
    pub async fn advance_mins(&self, mins: u64) -> TestResult {
        let target = self.now_ns().await? + mins * 60_000_000_000;
        while self.now_ns().await? < target {
            self.sandbox.fast_forward(1000).await?;
        }
        Ok(())
    }

    async fn now_ns(&self) -> anyhow::Result<u64> {
        Ok(self.sandbox.view_block().await?.timestamp())
    }
}

pub fn spec(min_reputation: u32) -> Value {
    json!({
        "title": "Photograph the warehouse sign",
        "instructions": "Film the front sign and the loading bay.",
        "lat_e6": 8_133_000,
        "lng_e6": 4_240_000,
        "radius_m": 100,
        "expected_text": "ADEYEMI FOODS",
        "duration_mins": 120,
        "min_reputation": min_reputation,
    })
}

pub fn fails_with(result: &ExecutionFinalResult, message: &str) -> bool {
    result.is_failure() && format!("{:?}", result.clone().into_result()).contains(message)
}
