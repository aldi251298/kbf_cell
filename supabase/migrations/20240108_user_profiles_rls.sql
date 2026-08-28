-- Fase 3.0: User Profiles, Roles, and RLS Policies
-- Run this in Supabase SQL Editor with postgres/superuser role

-- 1. Create user_profiles table linking to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  konter_id TEXT REFERENCES public.konter(id), -- NULL for admin, required for operator
  nama_lengkap TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Constraint: operator MUST have konter_id, admin does NOT need it
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS operator_wajib_konter;
ALTER TABLE public.user_profiles ADD CONSTRAINT operator_wajib_konter
  CHECK (
    (role = 'operator' AND konter_id IS NOT NULL) OR
    (role = 'admin')
  );

-- 2. Enable RLS on transaksi table
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

-- Policy: admin can SELECT all rows
DROP POLICY IF EXISTS admin_lihat_semua ON public.transaksi;
CREATE POLICY admin_lihat_semua ON public.transaksi
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- Policy: operator can only SELECT rows with their konter_id
DROP POLICY IF EXISTS operator_lihat_konter_sendiri ON public.transaksi;
CREATE POLICY operator_lihat_konter_sendiri ON public.transaksi
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'operator'
      AND user_profiles.konter_id = public.transaksi.konter_id
    )
  );

-- 3. Enable RLS on notifikasi_diabaikan (admin only for debugging)
ALTER TABLE public.notifikasi_diabaikan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_lihat_notifikasi_diabaikan ON public.notifikasi_diabaikan;
CREATE POLICY admin_lihat_notifikasi_diabaikan ON public.notifikasi_diabaikan
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- 4. Enable RLS on konter table (admin sees all, operator sees their own)
ALTER TABLE public.konter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_lihat_semua_konter ON public.konter;
CREATE POLICY admin_lihat_semua_konter ON public.konter
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS operator_lihat_konter_sendiri ON public.konter;
CREATE POLICY operator_lihat_konter_sendiri ON public.konter
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'operator'
      AND user_profiles.konter_id = public.konter.id
    )
  );

-- 5. Enable RLS on perangkat table (admin sees all, operator sees their konter's devices)
ALTER TABLE public.perangkat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_lihat_semua_perangkat ON public.perangkat;
CREATE POLICY admin_lihat_semua_perangkat ON public.perangkat
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS operator_lihat_perangkat_konter_sendiri ON public.perangkat;
CREATE POLICY operator_lihat_perangkat_konter_sendiri ON public.perangkat
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'operator'
      AND user_profiles.konter_id = public.perangkat.konter_id
    )
  );

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.transaksi TO authenticated;
GRANT SELECT ON public.notifikasi_diabaikan TO authenticated;
GRANT SELECT ON public.konter TO authenticated;
GRANT SELECT ON public.perangkat TO authenticated;