-- =============================================================================
-- Fase 2.3.1: Dynamic Transaction Categories & Ignored Notifications
-- =============================================================================
-- This migration adds two new tables:
-- 1. kategori_transaksi_dinamis - for tracking dynamically discovered transaction categories
-- 2. notifikasi_diabaikan - for archiving non-transaction notifications (promo, info, top-up saldo sendiri)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: kategori_transaksi_dinamis
-- -----------------------------------------------------------------------------
-- Stores dynamically discovered transaction categories.
-- First occurrence of a new category is flagged for review (perlu_review=true).
-- Subsequent occurrences are auto-recognized without review.
-- -----------------------------------------------------------------------------
create table if not exists public.kategori_transaksi_dinamis (
  kode                    text primary key,
  label_tampilan          text not null,
  contoh_header           text,
  dikonfirmasi_manual     boolean not null default false,
  jumlah_kemunculan       integer not null default 1,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists idx_kategori_dinamis_kode on public.kategori_transaksi_dinamis (kode);

-- -----------------------------------------------------------------------------
-- Table: notifikasi_diabaikan
-- -----------------------------------------------------------------------------
-- Archives notifications that are NOT customer transactions:
-- - Promo/Info/Announcements
-- - Top-up saldo aplikasi sendiri (Digipos/Alpines/LinkAja/etc)
-- - Notifications without any transaction elements (no phone number, no reference, no nominal)
-- -----------------------------------------------------------------------------
create table if not exists public.notifikasi_diabaikan (
  id                      uuid primary key default gen_random_uuid(),
  provider                text,
  konter_id               text,
  raw_notification_text   text,
  alasan                  text,
  waktu_capture           timestamptz,
  created_at              timestamptz not null default now()
);

-- Indexes for dashboard monitoring
create index if not exists idx_notif_diabaikan_waktu on public.notifikasi_diabaikan (waktu_capture desc);
create index if not exists idx_notif_diabaikan_konter on public.notifikasi_diabaikan (konter_id);
create index if not exists idx_notif_diabaikan_alasan on public.notifikasi_diabaikan (alasan);
create index if not exists idx_notif_diabaikan_provider on public.notifikasi_diabaikan (provider);

-- -----------------------------------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------------------------------
alter table public.kategori_transaksi_dinamis enable row level security;
alter table public.notifikasi_diabaikan enable row level security;

-- Owner can read all
create policy "kategori_dinamis_read_authenticated" on public.kategori_transaksi_dinamis
  for select to authenticated using (true);

create policy "notif_diabaikan_read_authenticated" on public.notifikasi_diabaikan
  for select to authenticated using (true);

-- Service role (API routes) can insert/update
create policy "kategori_dinamis_write_service" on public.kategori_transaksi_dinamis
  for all to service_role using (true);

create policy "notif_diabaikan_write_service" on public.notifikasi_diabaikan
  for all to service_role using (true);

-- -----------------------------------------------------------------------------
-- Realtime (optional - for monitoring dashboard)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.kategori_transaksi_dinamis;
alter publication supabase_realtime add table public.notifikasi_diabaikan;