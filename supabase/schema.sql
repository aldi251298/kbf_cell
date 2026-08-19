-- =============================================================================
-- Dashboard Konter Pulsa — Database Schema (Supabase / PostgreSQL)
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor) or via the
-- Supabase CLI migration system. The schema is designed to align with the
-- TypeScript domain types already used by the frontend (see src/types/*).
--
-- Tables:
--   konter            — 3 counter locations
--   perangkat         — devices (1:1 with konter), heartbeat tracked
--   transaksi         — transactions from Android ingest
--   device_heartbeat  — status change log for uptime history
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: konter
-- -----------------------------------------------------------------------------
create table if not exists public.konter (
  id           text primary key,
  nama         text not null,
  lokasi       text,
  perangkat_id text,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Table: perangkat
-- -----------------------------------------------------------------------------
-- Status (online/offline/menyiram) is NOT stored as a static column — it is
-- computed from last_heartbeat at read time (see src/lib/constants.ts).
create table if not exists public.perangkat (
  id             text primary key,
  nama           text not null,
  konter_id      text not null,
  ip             text,
  user_agent     text,
  lokasi         text,
  last_heartbeat timestamptz,
  created_at     timestamptz not null default now()
);

-- Link konter.perangkat_id -> perangkat.id (1:1)
-- Made DEFERRABLE so seed can insert both rows in any order within a transaction
alter table public.konter
  add constraint konter_perangkat_id_fkey
  foreign key (perangkat_id) references public.perangkat(id) on delete set null
  deferrable initially deferred;

-- perangkat.konter_id -> konter.id (also deferrable to break circular seed dependency)
-- Idempotent: only add if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'perangkat_konter_id_fkey'
      and conrelid = 'public.perangkat'::regclass
  ) then
    alter table public.perangkat
      add constraint perangkat_konter_id_fkey
      foreign key (konter_id) references public.konter(id) on delete cascade
      deferrable initially deferred;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Table: transaksi
-- -----------------------------------------------------------------------------
create table if not exists public.transaksi (
  id                      uuid primary key default gen_random_uuid(),
  waktu                   timestamptz not null,
  device_id               text not null references public.perangkat(id) on delete cascade,
  konter_id               text not null references public.konter(id) on delete cascade,
  konter_nama             text not null,
  -- Provider & dedup — provider is free-form string (no enum check, new providers may be added)
  provider                text not null,
  id_transaksi_provider  text not null,
  sn                      text,
  -- Transaction classification — jenis_transaksi is free-form string (no enum check)
  jenis_transaksi         text not null,
  nama_produk             text,
  nominal                 numeric not null check (nominal >= 0),
  nomor_tujuan            text,
  status                  text not null check (status in ('sukses','gagal','pending')),
  -- Raw & audit
  raw_notification_text   text not null,
  detail_tambahan         jsonb,
  created_at              timestamptz not null default now(),
  -- Unique constraint: prevents duplicate ingest per provider + provider transaction id
  constraint transaksi_provider_unique unique (provider, id_transaksi_provider)
);

-- Indexes for common dashboard filters / sorts
create index if not exists idx_transaksi_waktu        on public.transaksi (waktu desc);
create index if not exists idx_transaksi_status       on public.transaksi (status);
create index if not exists idx_transaksi_konter_id    on public.transaksi (konter_id);
create index if not exists idx_transaksi_device_id    on public.transaksi (device_id);
create index if not exists idx_transaksi_konter_waktu on public.transaksi (konter_id, waktu desc);

-- -----------------------------------------------------------------------------
-- Table: device_heartbeat (uptime history)
-- -----------------------------------------------------------------------------
create table if not exists public.device_heartbeat (
  id               uuid primary key default gen_random_uuid(),
  device_id        text not null references public.perangkat(id) on delete cascade,
  konter_id        text not null references public.konter(id) on delete cascade,
  status           text not null check (status in ('online','offline','menyiram')),
  recorded_at      timestamptz not null,
  duration_minutes numeric
);

create index if not exists idx_heartbeat_device_recorded on public.device_heartbeat (device_id, recorded_at desc);
create index if not exists idx_heartbeat_konter_recorded  on public.device_heartbeat (konter_id, recorded_at desc);

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Only 1 owner account. Authenticated users (the owner) can read all data.
-- Writes from the Android app go through the service-role client in API routes
-- (which bypass RLS), NOT through the anon key, so RLS on INSERT protects
-- against anonymous writes via the anon key.
-- =============================================================================

alter table public.konter            enable row level security;
alter table public.perangkat         enable row level security;
alter table public.transaksi         enable row level security;
alter table public.device_heartbeat  enable row level security;

-- konter: owner can read; no direct anon writes
create policy "konter_read_authenticated" on public.konter
  for select to authenticated using (true);

-- perangkat: owner can read; no direct anon writes
create policy "perangkat_read_authenticated" on public.perangkat
  for select to authenticated using (true);

-- transaksi: owner can read; no direct anon writes
create policy "transaksi_read_authenticated" on public.transaksi
  for select to authenticated using (true);

-- device_heartbeat: owner can read; no direct anon writes
create policy "heartbeat_read_authenticated" on public.device_heartbeat
  for select to authenticated using (true);

-- =============================================================================
-- Realtime
-- =============================================================================
-- Enable realtime publication for transaksi & perangkat so the dashboard
-- receives push updates. Run once:
-- =============================================================================

alter publication supabase_realtime add table public.transaksi;
alter publication supabase_realtime add table public.perangkat;
alter publication supabase_realtime add table public.device_heartbeat;

-- =============================================================================
-- Seed data — 3 konter + 3 perangkat (matching frontend constants)
-- =============================================================================
-- Run this block once after creating the tables. Safe to re-run (idempotent
-- via on conflict do nothing).
-- Wrapped in a transaction so deferrable FK constraints are checked at commit.
-- =============================================================================

begin;

insert into public.perangkat (id, nama, konter_id, ip, user_agent, lokasi, last_heartbeat)
values
  ('DEV-001', 'Maju Jaya - Jakarta',  'KONTER-001', null, null, 'Jakarta Selatan', now()),
  ('DEV-002', 'Berkah Mandiri - Tangerang', 'KONTER-002', null, null, 'Tangerang', now()),
  ('DEV-003', 'Sumber Rejeki - Bekasi', 'KONTER-003', null, null, 'Bekasi', now())
on conflict (id) do nothing;

insert into public.konter (id, nama, lokasi, perangkat_id)
values
  ('KONTER-001', 'KBF Cell Pasar Baru', 'Jakarta Pusat', 'DEV-001'),
  ('KONTER-002', 'KBF Cell Jawi Jawi',  'Jawi Jawi',    'DEV-002'),
  ('KONTER-003', 'KBF Cell Cupak',      'Cupak',        'DEV-003')
on conflict (id) do nothing;

commit;
