-- Migration: Add pengisian_saldo_alpines table for WhatsApp Alpines top-up history
-- Date: 2024-01-10

CREATE TABLE pengisian_saldo_alpines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  konter_id TEXT NOT NULL,
  raw_notification_text TEXT NOT NULL,
  nominal_penambahan NUMERIC,
  saldo_sebelum NUMERIC,
  saldo_sesudah NUMERIC,
  waktu_capture TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Mencegah duplikat kalau WhatsApp/Android kirim notifikasi yang sama lebih dari sekali
CREATE UNIQUE INDEX IF NOT EXISTS idx_pengisian_saldo_dedup
  ON pengisian_saldo_alpines (konter_id, raw_notification_text);

-- Index untuk query cepat by konter_id dan waktu
CREATE INDEX IF NOT EXISTS idx_pengisian_saldo_konter_waktu
  ON pengisian_saldo_alpines (konter_id, waktu_capture DESC);