-- Migration: Drop CHECK constraints on jenis_transaksi and provider
-- Reason: Both should be free-form strings, not enums
-- Date: 2024-01-03

-- Drop the CHECK constraint that limits jenis_transaksi to a closed list
ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS transaksi_jenis_transaksi_check;

-- Drop the CHECK constraint that limits provider to a closed list
ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS transaksi_provider_check;

-- Verify both columns are now plain TEXT without enum constraints
-- (no additional changes needed — columns already defined as TEXT NOT NULL)