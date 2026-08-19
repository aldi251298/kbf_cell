# Backup & Restore

Supabase free tier tidak menyediakan backup otomatis. Project ini menyediakan
mekanisme export terjadwal mingguan via endpoint cron, plus prosedur restore
manual.

## 1. Backup Otomatis (Vercel Cron Job)

Endpoint: `GET /api/cron/backup`

Endpoint ini dilindungi oleh env var `CRON_SECRET`. Ia mengekspor seluruh data
tabel `transaksi`, `perangkat`, dan `konter` sebagai file JSON.

### Setup di Vercel

1. Set env var `CRON_SECRET` di Vercel (Project > Settings > Environment
   Variables) dengan string acak yang kuat, mis. `openssl rand -hex 32`.
2. Buat file `vercel.json` di root project (sudah disediakan) dengan konfigurasi
   cron job yang memanggil endpoint tiap minggu.
3. Deploy. Vercel akan menjalankan cron otomatis sesuai jadwal.

### Penyimpanan Hasil Backup

Secara default, endpoint mengembalikan JSON sebagai attachment download. Untuk
penyimpanan otomatis, modifikasi endpoint agar juga mengunggah hasil ke:
- **Vercel Blob** (`@vercel/blob`), atau
- **S3 / R2 / GCS**, atau
- **Email** (kirim JSON sebagai lampiran via Resend/Mailgun).

Pilih satu sesuai preferensi. Untuk skala 3 device, Vercel Blob (free tier)
cukup memadai.

## 2. Backup Manual (On-Demand)

Jalankan perintah berikut dari terminal (ganti `<CRON_SECRET>` dan
`<DOMAIN>`):

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://<DOMAIN>/api/cron/backup \
  -o backup-$(date +%Y-%m-%d).json
```

## 3. Restore Manual

Jika data perlu dipulihkan dari file backup JSON:

### Langkah-langkah

1. **Siapkan file backup** (mis. `backup-2025-01-15.json`) dengan struktur:
   ```json
   {
     "exported_at": "...",
     "tables": {
       "transaksi": [...],
       "perangkat": [...],
       "konter": [...]
     }
   }
   ```

2. **Buka Supabase Dashboard > SQL Editor** (atau gunakan `psql` / Supabase
   CLI).

3. **Restore tabel konter & perangkat** (urutan penting karena ada foreign key):
   ```sql
   -- Konter (idempotent)
   insert into public.konter (id, nama, lokasi, perangkat_id)
   values
     ('KONTER-001', 'KBF Cell Pasar Baru', 'Jakarta Pusat', 'DEV-001'),
     ('KONTER-002', 'KBF Cell Jawi Jawi',  'Jawi Jawi',    'DEV-002'),
     ('KONTER-003', 'KBF Cell Cupak',      'Cupak',        'DEV-003')
   on conflict (id) do nothing;

   -- Perangkat
   insert into public.perangkat (id, nama, konter_id, ip, user_agent, lokasi, last_heartbeat)
   values
     ('DEV-001', 'Maju Jaya - Jakarta', 'KONTER-001', null, null, 'Jakarta Selatan', now()),
     ('DEV-002', 'Berkah Mandiri - Tangerang', 'KONTER-002', null, null, 'Tangerang', now()),
     ('DEV-003', 'Sumber Rejeki - Bekasi', 'KONTER-003', null, null, 'Bekasi', now())
   on conflict (id) do nothing;
   ```

4. **Restore tabel transaksi** — gunakan script Node/Python yang membaca file
   JSON dan melakukan insert via Supabase client (service role). Contoh script
   Node:
   ```js
   const { createClient } = require("@supabase/supabase-js");
   const fs = require("fs");

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY,
   );

   const backup = JSON.parse(fs.readFileSync("backup-2025-01-15.json", "utf8"));

   (async () => {
     const { error } = await supabase
       .from("transaksi")
       .upsert(backup.tables.transaksi, { onConflict: "dedup_key" });
     if (error) console.error(error);
     else console.log("Restore selesai:", backup.tables.transaksi.length, "baris");
   })();
   ```

5. **Verifikasi** — buka dashboard dan pastikan data transaksi muncul kembali.

### Catatan

- `upsert` dengan `onConflict: "dedup_key"` memastikan tidak ada duplikat saat
  restore.
- Jika tabel sudah ada data, restore tidak akan menimpa baris yang ada (karena
  `on conflict do nothing` / `upsert`).
- Selalu uji restore di project Supabase staging sebelum produksi.
