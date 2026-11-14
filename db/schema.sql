-- Monomi schema for Postgres (Neon). Run once in the Neon SQL editor.
-- Only the server reads or writes these tables.

create table if not exists auth_nonces (
  nonce text primary key,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists challenges (
  id bigint generated always as identity primary key,
  job_id bigint not null,
  worker text not null,
  code text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false,
  superseded boolean not null default false
);
create index if not exists challenges_job_idx on challenges (job_id, worker);

create table if not exists proof_bundles (
  proof_hash text primary key,
  job_id bigint not null,
  worker text not null,
  challenge_id bigint not null references challenges (id),
  photo_sha256s text[] not null,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision not null,
  server_ts timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists proof_bundles_job_idx on proof_bundles (job_id);

-- Photos stay private in the database, EXIF stripped. db/cleanup.sql clears the
-- image bytes 14 days after upload; the hash row stays so a photo can never be reused.
create table if not exists photos (
  sha256 text primary key,
  proof_hash text not null references proof_bundles (proof_hash),
  position int not null,
  jpeg bytea,
  created_at timestamptz not null default now()
);

-- status: running | approved | rejected | needs_review | failed
create table if not exists verifications (
  proof_hash text primary key references proof_bundles (proof_hash),
  job_id bigint not null,
  status text not null,
  reasons text[] not null default '{}',
  resolve_tx text,
  error text,
  locked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  job_id bigint not null,
  proof_hash text primary key references proof_bundles (proof_hash),
  report jsonb not null,
  report_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists reports_job_idx on reports (job_id, created_at desc);

create table if not exists moderation (
  job_id bigint primary key,
  allowed boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  key text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (key, day)
);

create table if not exists cashouts (
  deposit_address text primary key,
  account text not null,
  chain text not null,
  recipient text not null,
  amount text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Atomic counter for rate limits. Returns the new count.
create or replace function bump_rate_limit(p_key text) returns int
language sql as $$
  insert into rate_limits (key, day, count) values (p_key, current_date, 1)
  on conflict (key, day) do update set count = rate_limits.count + 1
  returning count;
$$;
