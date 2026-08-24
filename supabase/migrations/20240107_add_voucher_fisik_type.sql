-- =============================================================================
-- Add voucher_fisik to jenis_transaksi CHECK constraint
-- =============================================================================
-- This migration adds 'voucher_fisik' as a valid jenis_transaksi value
-- to distinguish physical voucher transactions from regular voucher transactions.

-- Drop the existing CHECK constraint
ALTER TABLE public.transaksi
DROP CONSTRAINT IF EXISTS transaksi_jenis_transaksi_check;

-- Add new CHECK constraint with voucher_fisik
ALTER TABLE public.transaksi
ADD CONSTRAINT transaksi_jenis_transaksi_check
CHECK (jenis_transaksi IN (
  'pulsa',
  'paket_data',
  'pln',
  'ewallet_dana',
  'voucher',
  'voucher_fisik',
  'pulsa_op'
));