-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.konter (
  id text NOT NULL,
  nama text NOT NULL,
  lokasi text,
  perangkat_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT konter_pkey PRIMARY KEY (id),
  CONSTRAINT konter_perangkat_id_fkey FOREIGN KEY (perangkat_id) REFERENCES public.perangkat(id)
);
CREATE TABLE public.perangkat (
  id text NOT NULL,
  nama text NOT NULL,
  konter_id text NOT NULL,
  ip text,
  user_agent text,
  lokasi text,
  last_heartbeat timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perangkat_pkey PRIMARY KEY (id),
  CONSTRAINT perangkat_konter_id_fkey FOREIGN KEY (konter_id) REFERENCES public.konter(id)
);
CREATE TABLE public.transaksi (
  waktu timestamp with time zone NOT NULL,
  konter_nama text NOT NULL,
  provider text NOT NULL,
  device_id text,
  konter_id text,
  id_transaksi_provider text NOT NULL,
  sn text,
  jenis_transaksi text NOT NULL,
  nama_produk text,
  nomor_tujuan text,
  status text NOT NULL CHECK (status = ANY (ARRAY['sukses'::text, 'gagal'::text, 'pending'::text])),
  raw_notification_text text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nominal numeric CHECK (nominal >= 0::numeric),
  detail_tambahan jsonb,
  provider_seluler text,
  nama_pemilik text,
  perlu_review boolean NOT NULL DEFAULT false,
  CONSTRAINT transaksi_pkey PRIMARY KEY (id),
  CONSTRAINT transaksi_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.perangkat(id)
);
CREATE TABLE public.device_heartbeat (
  device_id text NOT NULL,
  konter_id text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['online'::text, 'offline'::text, 'menyiram'::text])),
  recorded_at timestamp with time zone NOT NULL,
  duration_minutes numeric,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT device_heartbeat_pkey PRIMARY KEY (id),
  CONSTRAINT device_heartbeat_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.perangkat(id),
  CONSTRAINT device_heartbeat_konter_id_fkey FOREIGN KEY (konter_id) REFERENCES public.konter(id)
);
CREATE TABLE public.kategori_transaksi_dinamis (
  kode text NOT NULL,
  label_tampilan text NOT NULL,
  contoh_header text,
  dikonfirmasi_manual boolean NOT NULL DEFAULT false,
  jumlah_kemunculan integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kategori_transaksi_dinamis_pkey PRIMARY KEY (kode)
);
CREATE TABLE public.notifikasi_diabaikan (
  provider text,
  konter_id text,
  raw_notification_text text,
  alasan text,
  waktu_capture timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifikasi_diabaikan_pkey PRIMARY KEY (id)
);