-- Stored procedure untuk seed data konter + perangkat dalam satu transaction
-- Jalankan SQL ini di Supabase SQL Editor sebelum memanggil /api/seed

create or replace function public.seed_konter_perangkat()
returns void
language plpgsql
security definer
as $$
begin
  insert into public.perangkat (id, nama, konter_id, lokasi)
  values
    ('DEV-001', 'Maju Jaya - Jakarta',     'KONTER-001', 'Jakarta Selatan'),
    ('DEV-002', 'Berkah Mandiri - Tangerang', 'KONTER-002', 'Tangerang'),
    ('DEV-003', 'Sumber Rejeki - Bekasi',  'KONTER-003', 'Bekasi')
  on conflict (id) do nothing;

  insert into public.konter (id, nama, lokasi, perangkat_id)
  values
    ('KONTER-001', 'KBF Cell Pasar Baru', 'Jakarta Pusat', 'DEV-001'),
    ('KONTER-002', 'KBF Cell Jawi Jawi',  'Jawi Jawi',    'DEV-002'),
    ('KONTER-003', 'KBF Cell Cupak',      'Cupak',        'DEV-003')
  on conflict (id) do nothing;
end;
$$;