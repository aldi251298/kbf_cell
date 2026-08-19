-- Migration: Make konter_id nullable and drop FK constraint
-- Changes:
--   - Make transaksi.konter_id nullable (no longer required)
--   - Drop FK constraint to allow unknown/invalid konter_id values
--   - Data principle: never reject transactions due to missing/invalid konter_id

-- Make konter_id nullable
ALTER TABLE public.transaksi ALTER COLUMN konter_id DROP NOT NULL;

-- Drop FK constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transaksi_konter_id_fkey'
      AND conrelid = 'public.transaksi'::regclass
  ) THEN
    ALTER TABLE public.transaksi DROP CONSTRAINT transaksi_konter_id_fkey;
  END IF;
END;
$$;