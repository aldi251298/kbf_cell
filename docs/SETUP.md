# Setup Guide — Supabase + Vercel

Panduan langkah demi langkah untuk menghubungkan project ini ke Supabase dan
mendeploy ke Vercel.

## 1. Buat Project Supabase

1. Buka https://supabase.com dan buat akun (atau login).
2. Klik **New Project**:
   - Name: `dashboard-konter-pulsa`
   - Database Password: simpan di tempat aman
   - Region: pilih yang terdekat (mis. Singapore / Jakarta)
3. Tunggu project selesai dibuat (~2 menit).

## 2. Dapatkan Kredensial Supabase

Di Supabase Dashboard > Project Settings > API:

| Variable | Lokasi | Contoh |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://xxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | `eyJhbG...` (RAHASIA) |

## 3. Setup Database

1. Buka Supabase Dashboard > SQL Editor.
2. Copy seluruh isi file `supabase/schema.sql` dan paste ke SQL Editor.
3. Klik **Run**. Anda akan melihat 3 baris inserted di tabel `konter` dan
   `perangkat`.
4. (Opsional) Aktifkan Realtime: Supabase biasanya sudah aktif, tapi pastikan
   tabel `transaksi` dan `perangkat` ada di daftar Realtime (Dashboard >
   Database > Replication).

## 4. Buat Akun Pemilik (1 akun)

1. Buka Supabase Dashboard > Authentication > Users.
2. Klik **Add user** > **Create new user**.
3. Isi email dan password untuk pemilik dashboard.
4. Jangan buat akun lain — sistem hanya mendukung 1 akun pemilik.

## 5. Konfigurasi Environment Variables

### Local Development

Copy `.env.example` menjadi `.env.local` dan isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
INGEST_API_KEY=<generate-dengan-openssl-rand-hex-32>
HEARTBEAT_OFFLINE_MINUTES=5
CRON_SECRET=<generate-dengan-openssl-rand-hex-32>
```

Generate API key yang kuat:
```bash
openssl rand -hex 32
```

### Vercel Production

1. Push project ke GitHub/GitLab.
2. Import project di Vercel.
3. Set environment variables di Vercel (Project > Settings > Environment
   Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` — **Public** (expose to browser)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Public** (expose to browser)
   - `SUPABASE_SERVICE_ROLE_KEY` — **Server only** (JANGAN expose)
   - `INGEST_API_KEY` — **Server only** (JANGAN expose)
   - `HEARTBEAT_OFFLINE_MINUTES` — **Server only** (opsional, default 5)
   - `CRON_SECRET` — **Server only** (untuk backup cron)
4. Deploy.

## 6. Konfigurasi Android App (di luar scope, tapi catatan)

Android app yang mengirim data ke endpoint ingest harus dikonfigurasi dengan:
- Base URL: `https://<your-vercel-domain>.vercel.app`
- API Key: nilai `INGEST_API_KEY` yang sama
- Endpoint transaksi: `POST /api/ingest/transaksi`
- Endpoint heartbeat: `POST /api/ingest/heartbeat`

## 7. Konfigurasi Vercel Cron (Backup)

File `vercel.json` sudah disediakan dengan cron job yang memanggil
`/api/cron/backup` setiap Senin jam 3 pagi. Setelah deploy ke Vercel, cron
akan berjalan otomatis.

Untuk menguji cron secara manual:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-domain>/api/cron/backup
```

## 8. Verifikasi Setup

1. Buka `https://<your-domain>/login` — seharusnya muncul halaman login.
2. Login dengan akun pemilik yang dibuat di langkah 4.
3. Dashboard akan menampilkan data kosong (belum ada transaksi).
4. Test ingest: kirim POST request ke `/api/ingest/transaksi` dengan header
   `x-api-key: <INGEST_API_KEY>` dan body JSON yang valid.
5. Transaksi baru harus muncul di dashboard (tanpa refresh jika realtime aktif).

## Catatan Keamanan

- **JANGAN** commit `.env.local` atau file dengan kredensial asli.
- `SUPABASE_SERVICE_ROLE_KEY` dan `INGEST_API_KEY` hanya untuk server.
- RLS aktif di semua tabel — anon key hanya bisa baca data milik user
  terautentikasi.
- Ingest endpoint menggunakan `service_role` client (bypass RLS) tapi
  dilindungi oleh `INGEST_API_KEY` yang hanya diketahui oleh Android app.