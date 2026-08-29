-- =============================================================================
-- Add aksesoris to jenis_transaksi CHECK constraint
-- =============================================================================
-- This migration adds 'aksesoris' as a valid jenis_transaksi value
-- for manual transactions like accessories, cases, chargers, etc.

-- Drop the existing CHECK constraint
ALTER TABLE public.transaksi
DROP CONSTRAINT IF EXISTS transaksi_jenis_transaksi_check;

-- Add new CHECK constraint with aksesoris
ALTER TABLE public.transaksi
ADD CONSTRAINT transaksi_jenis_transaksi_check
CHECK (jenis_transaksi IN (
  'pulsa',
  'paket_data',
  'pln',
  'ewallet_dana',
  'voucher',
  'voucher_fisik',
  'pulsa_op',
  'aksesoris'
));