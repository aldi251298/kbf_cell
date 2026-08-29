# Laporan Audit Menyeluruh Source Code Project KBF Dashboard

**Tanggal Audit:** 29 Agustus 2026  
**Versi Project:** 0.1.0  
**Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Supabase (PostgreSQL), Tailwind CSS 4

---

## 📋 Ringkasan Eksekutif

Project ini adalah dashboard monitoring konter pulsa dengan arsitektur **Next.js App Router** + **Supabase** sebagai backend. Codebase memiliki fondasi yang solid dengan:
- ✅ TypeScript strict mode enabled
- ✅ Row Level Security (RLS) di database
- ✅ Parser notifikasi yang robust dengan handling edge cases
- ✅ Realtime updates via Supabase Realtime
- ✅ Export Excel profesional dengan ExcelJS

Namun ditemukan **23 temuan** mulai dari **Critical** hingga **Low** yang perlu diperbaiki.

---

## 🔴 CRITICAL (4 Temuan)

### C-01: Service Role Key Digunakan di Semua API Routes
**File:** `src/lib/supabase/server.ts` (line 45-60), semua route di `src/app/api/**/route.ts`

```typescript
// DIGUNAKAN DI SEMUA ENDPOINT
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // BYPASS RLS TOTAL
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}
```

**Masalah:** Service role key **mengabaikan seluruh RLS policies**. Semua endpoint API (`/api/transaksi`, `/api/laporan`, `/api/ringkasan`, `/api/perangkat`, `/api/konter`) menggunakan service role client, sehingga **RLS yang sudah dikonfigurasi di migration `20240108_user_profiles_rls.sql` TIDAK BERFUNGSI sama sekali**.

**Dampak:** Operator bisa melihat data konter lain, admin/operator separation tidak work, data bocor antar konter.

**Solusi:** Gunakan `createServerClientFromCookies()` (user session) untuk endpoint yang butuh RLS. Hanya gunakan service role untuk:
- Ingest endpoints (Android app, authenticated via `INGEST_API_SECRET`)
- Cron backup
- Seed endpoint

---

### C-02: Middleware Tidak Melindungi Semua Route Sensitif
**File:** `src/middleware.ts` (line 30-35)

```typescript
const isApiIngest =
  req.nextUrl.pathname.startsWith("/api/ingest") ||
  req.nextUrl.pathname.startsWith("/api/health");

if (isApiIngest) return res;  // BYPASS AUTH TOTAL
```

**Masalah:** `/api/health` dibiarkan tanpa auth (OK untuk health check), TAPI `/api/seed`, `/api/cron/backup`, `/api/kategori-dinamis` **tidak dilindungi middleware** karena tidak di-include di `isApiIngest` dan tidak ada check session.

**Dampak:** Siapa saja bisa akses `/api/seed` (dengan `INGEST_API_SECRET` yang mungkin bocor), `/api/cron/backup` (dengan `CRON_SECRET`), dan `/api/kategori-dinamis` tanpa login.

**Solusi:** Tambahkan proteksi auth di middleware untuk semua route `/api/*` kecuali yang memang public (`/api/ingest/*`, `/api/health`).

---

### C-03: Seed & Cron Endpoint Hanya Pakai Shared Secret (No Rotation, No Audit)
**File:** `src/app/api/seed/route.ts` (line 10-14), `src/app/api/cron/backup/route.ts` (line 17-29)

```typescript
// Seed - hanya cek x-api-key header
const secret = req.headers.get("x-api-key");
if (secret !== process.env.INGEST_API_SECRET) { return 401; }

// Cron - hanya cek Authorization: Bearer CRON_SECRET
if (authHeader !== `Bearer ${expected}`) { return 401; }
```

**Masalah:**
- Shared secret statis, tidak ada rotasi
- Tidak ada rate limiting
- Tidak ada audit log siapa/apan menjalankan
- `INGEST_API_SECRET` dipakai untuk seed DAN ingest Android — **blast radius terlalu besar** kalau bocor

**Solusi:** 
- Pisahkan secret: `SEED_API_SECRET`, `CRON_API_SECRET`, `INGEST_API_SECRET`
- Tambah rate limiting (misal: 5 req/menit per IP)
- Log audit ke tabel `admin_audit_log` (buat baru)

---

### C-04: SQL Injection Potential di Dynamic Query Building
**File:** `src/app/api/transaksi/route.ts` (line 68-70)

```typescript
if (search) {
  query = query.or(
    `nomor_tujuan.ilike.%${search}%,produk_nama.ilike.%${search}%,konter_nama.ilike.%${search}%`,
  );
}
```

**Masalah:** `search` parameter langsung di-interpolasi ke string query Supabase `.or()`. Meskipun Supabase PostgREST escape otomatis, pattern `ilike.%${search}%` rentan **wildcard injection** (user input `%` atau `_` mengubah semantik query).

**Solusi:** Sanitize input: `search.replace(/[%_]/g, '\\$&')` sebelum dipakai.

---

## 🟠 HIGH (5 Temuan)

### H-01: Tidak Ada Rate Limiting di Semua Public Endpoint
**File:** Semua `src/app/api/**/route.ts`

**Masalah:** Endpoint `/api/ingest/transaksi`, `/api/ingest/heartbeat`, `/api/transaksi/manual`, `/api/seed` tidak punya rate limiting. Android app atau attacker bisa flood request.

**Dampak:** DoS, biaya Supabase naik, database penuh spam.

**Solusi:** Implement rate limiting (misal `@vercel/rate-limit` atau custom middleware dengan Redis/Upstash):
- `/api/ingest/*`: 60 req/menit per device_id
- `/api/transaksi/manual`: 30 req/menit per user
- `/api/seed`: 5 req/menit per IP

---

### H-02: Input Validation Minimal di Ingest Endpoint
**File:** `src/app/api/ingest/transaksi/route.ts` (line 34-75)

```typescript
// Hanya validasi field wajib ada, TIDAK validasi format/panjang
if (!body.provider || !["digipos", "alpines"].includes(body.provider)) { ... }
if (!body.konter_id || typeof body.konter_id !== "string" || body.konter_id.trim() === "") { ... }
```

**Masalah:**
- `raw_notification_text` tidak dibatasi panjang (bisa > 1MB → DoS memory)
- `waktu_capture` tidak divalidasi range (bisa tahun 1970 atau 2099)
- `konter_id` tidak dicek apakah exist di DB
- Tidak ada sanitasi XSS pada `raw_notification_text` (meski disimpan sebagai text, tapi ditampilkan di dashboard)

**Solusi:** Tambah validasi ketat:
- `raw_notification_text`: max 10KB, strip control chars
- `waktu_capture`: harus dalam range ±24 jam dari now
- `konter_id`: cek exist di tabel `konter` sebelum proses

---

### H-03: Unique Constraint Duplikasi Hanya untuk Alpines (Digipos Tidak Dilindungi)
**File:** `supabase/migrations/20240106_fase_231_dynamic_categories_and_ignored_notifications.sql` (komentar line 26-28), `src/app/api/ingest/transaksi/route.ts` (line 205-228)

```sql
-- Hanya untuk Alpines
CREATE UNIQUE INDEX idx_transaksi_dedup_alpines 
ON public.transaksi (konter_id, raw_notification_text) 
WHERE provider = 'alpines';
```

**Masalah:** Digipos **tidak punya dedup constraint**. Komentar di kode: "Digipos excluded (no double-send issue, no constraint)" — **asumsi berbahaya**. Jika Android app kirim ulang (retry network), Digipos akan insert duplikat.

**Solusi:** Tambah unique constraint universal:
```sql
CREATE UNIQUE INDEX idx_transaksi_dedup_all 
ON public.transaksi (provider, konter_id, id_transaksi_provider);
```
Gunakan `id_transaksi_provider` (sudah ada di schema) sebagai deduplication key alami.

---

### H-04: Realtime Subscription Leak di `useTransaksiRealtime`
**File:** `src/hooks/useTransaksiRealtime.ts` (line 31-66)

```typescript
useEffect(() => {
  const supabase = createClient();
  const channel = supabase.channel("transaksi-realtime").on(...).subscribe();
  return () => { supabase.removeChannel(channel); };
}, [enabled]);
```

**Masalah:** `createClient()` dipanggil **di dalam useEffect** → setiap re-render (enabled berubah) bikin client baru + channel baru. Cleanup `removeChannel` pake `channel` yang beda instance kalau `enabled` toggle cepat.

**Dampak:** Memory leak, multiple subscriptions, duplicate notifications.

**Solusi:** Pindah `createClient()` ke luar hook (module level) atau gunakan `useRef` untuk singleton client.

---

### H-05: Hardcoded Konter Mapping di Frontend (Bukan dari DB)
**File:** `src/app/(dashboard)/page.tsx` (line 242-250), `src/components/layout/header.tsx` (line 34-42)

```typescript
function namaKonter(id: string | null | undefined): string {
  const map: Record<string, string> = {
    "KONTER-001": "KBF Cell Pasar Baru",
    "KONTER-002": "Konter 2",  // TYPO: seharusnya "KBF Cell Jawi Jawi"
    "KONTER-003": "Konter 3",  // TYPO: seharusnya "KBF Cell Cupak"
  };
  return map[id] ?? id;
}
```

**Masalah:** Data konter hardcoded di 2 tempat, tidak sync dengan DB. Kalau tambah konter baru → harus update code + deploy.

**Solusi:** Fetch konter list dari `/api/konter` saat init, cache di context/state.

---

## 🟡 MEDIUM (8 Temuan)

### M-01: N+1 Query di `/api/transaksi` (Fetch Konter per Request)
**File:** `src/app/api/transaksi/route.ts` (line 46-58)

```typescript
// Fetch konter list SETIAP request transaksi
const { data: konterRows } = await supabase
  .from("konter")
  .select("id, nama")
  .order("id");
konterMap = new Map((konterRows ?? []).map((k) => [k.id, k.nama]));
```

**Masalah:** Query konter dijalankan **setiap request transaksi** (pagination, filter, search). Konter cuma 3 row tapi query tetap jalan setiap kali.

**Solusi:** Cache konter map di memory (module-level variable dengan TTL 5 menit) atau gunakan Supabase `join` (`.select("*, konter(nama)")`) — tapi perlu cek apakah RLS allow join.

---

### M-02: In-Memory Aggregation untuk Laporan (Tidak Scale)
**File:** `src/app/api/laporan/route.ts` (line 72-79), `src/app/api/ringkasan/route.ts` (line 248-266)

```typescript
// Ambil SEMUA transaksi di range, lalu aggregate di memory
const { data } = await supabase
  .from("transaksi")
  .select("*", { count: "exact" })
  .gte("waktu", rangeStart.toISOString())
  .lt("waktu", rangeEnd.toISOString())
  .order("waktu", { ascending: true });

// Lalu loop di JS: rows.forEach(...), Map, reduce, dll
```

**Masalah:** Saat data transaksi > 100k rows, memory & CPU server akan habis. Saat ini "data volume is small (3 devices)" tapi **tidak future-proof**.

**Solusi:** 
- Gunakan PostgreSQL aggregation (`GROUP BY`, `SUM`, `COUNT`) via Supabase RPC / Postgres function
- Atau buat materialized view `daily_summary` yang di-refresh via cron

---

### M-03: Duplicate `getTodayWIBDateString` & `getRentangWaktuWIB` di Multiple Files
**File:** `src/lib/utils.ts` (line 373-387, 346-367), `src/services/transaksiService.ts` (line 230-244), `src/app/(dashboard)/page.tsx` (line 536-543)

**Masalah:** Logic timezone WIB (UTC+7) duplikat di 3 tempat. Kalau ada bug/perubahan (misal DST), harus fix 3x.

**Solusi:** Centralize di `src/lib/utils.ts` saja, import di mana butuh. Hapus duplikat di service & component.

---

### M-04: Error Handling Inconsistent (Try-Catch vs Throw)
**File:** `src/app/api/ingest/transaksi/route.ts` (line 120-147) vs `src/app/api/transaksi/manual/route.ts` (line 90-97)

```typescript
// Ingest: try-catch parser, fallback ke "belum_dikenal" dengan perlu_review=true
try { parseResult = await parseNotifikasiUniversal(...) } catch (e) {
  parseResult = { parsed: { ..., perlu_review: true, detail_tambahan: { parser_error: e.message } } }
}

// Manual: throw error langsung ke caller
const { error } = await supabase.from("transaksi").insert(payload);
if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
```

**Masalah:** Ingest "never reject" (filosofi baik), tapi manual insert gagal → return 500 tanpa detail yang actionable. Tidak ada logging terstruktur (hanya `console.error`).

**Solusi:** Standarisasi error handling:
- Buat `ApiError` class dengan `code`, `status`, `details`
- Gunakan structured logging (JSON) dengan `pino` atau `winston`
- Ingest: log parser error ke `notifikasi_diabaikan` dengan `alasan: "parser_error"`

---

### M-05: Parser Complexity Tinggi (Cyclomatic Complexity > 50)
**File:** `src/lib/parser/index.ts` (`parseNotifikasiUniversal` 461 lines), `src/lib/parser/universal.ts` (`extractNominalAlpines` 291 lines)

**Masalah:** Fungsi terlalu panjang, nested conditionals dalam, sulit test & maintain. `parseNotifikasiUniversal` handle: saldo separation, filtering, dynamic category, nominal extraction, status, detail fields — **single responsibility violation**.

**Solusi:** Refactor jadi pipeline kecil:
```typescript
// Pipeline stages
const pipeline = [
  normalizeWhitespace,
  separateAppBalance,
  classifyTransaction,
  detectCategory,      // async DB lookup
  extractFields,       // nominal, nomor, produk, dll
  applyAdminFee,
  buildResult,
];
```

---

### M-06: Magic Numbers & Strings di Parser & Admin Fee
**File:** `src/lib/parser/adminKonter.ts` (line 32-88), `src/lib/parser/keywords.ts` (line 9-81)

```typescript
// Admin fee hardcoded di config
{ batasAtas: 99000, admin: 3000 },  // DANA <= 99k
{ batasAtas: Infinity, admin: 5000 }, // DANA > 99k
{ batasAtas: 50000, admin: 4000 },  // PLN <= 50k
```

**Masalah:** Tarif admin hardcoded di code. Kalau berubah → deploy ulang. Tidak ada versioning/audit trail perubahan tarif.

**Solusi:** Pindah ke tabel DB `admin_fee_rules` dengan kolom: `jenis_transaksi`, `nama_produk_filter`, `batas_atas`, `admin_fee`, `metode_pembulatan`, `effective_from`, `effective_to`. Parser query ke DB (cache 5 menit).

---

### M-07: No Automated Tests untuk Parser (Critical Business Logic)
**File:** `jest.config.js`, `test-parser-local.ts` (hanya manual test)

**Masalah:** Parser adalah **core business logic** (ekstrak nominal, jenis transaksi, status) tapi **tidak ada unit test otomatis**. `test-parser-local.ts` cuma script manual. Regression risk tinggi saat refactor.

**Solusi:** Tulis unit test Jest untuk:
- `parseNotifikasiUniversal` dengan fixture notifikasi real (digipos/alpines)
- `extractNominalForAlpines` edge cases (saldo format aneh, dash separator)
- `detectJenisTransaksi` semua kategori
- `terapkanAdminKonter` semua tier & pembulatan

Target coverage: > 90% untuk parser module.

---

### M-08: Type Safety Gaps (`any` & `unknown` Casts)
**File:** `src/app/api/transaksi/route.ts` (line 94-101), `src/hooks/useTransaksiRealtime.ts` (line 39-57)

```typescript
// API: cast any → TransaksiRow
const rows = (data ?? []).map((row) => {
  const r = row as unknown as TransaksiRow;  // UNSAFE
  return { ...r, konter_nama: konterMap.get(r.konter_id ?? "") ?? r.konter_nama ?? "Tidak diketahui" };
}) as unknown as TransaksiRow[];  // DOUBLE CAST

// Hook: payload.new as Record<string, unknown> → manual mapping
const row = payload.new as Record<string, unknown>;
const trx: Transaksi = {
  id: row.id as string,
  produk: { kategori: row.produk_kategori as Transaksi["produk"]["kategori"] },  // UNSAFE
  ...
};
```

**Masalah:** Type assertion tanpa validasi runtime. Kalau schema DB berubah (kolom rename/hapus), runtime error tapi TypeScript happy.

**Solusi:** 
- Gunakan `zod` atau `valibot` untuk validate response Supabase
- Atau generate types dari Supabase CLI: `supabase gen types typescript --project-id xxx > types/database.ts`

---

## 🟢 LOW (6 Temuan)

### L-01: Image Config Terlalu Permissif (`hostname: "**"`)
**File:** `next.config.ts` (line 5-10)

```typescript
images: {
  remotePatterns: [{ protocol: "https", hostname: "**" }],  // ALLOW ALL HOSTS
}
```

**Masalah:** Next.js Image Optimization akan fetch & resize gambar dari **domain manapun**. Risiko SSRF (Server-Side Request Forgery) ke internal metadata endpoint (169.254.169.254) kalau attacker inject URL jahat.

**Solusi:** Batasi hostname ke domain yang dipakai: `lh3.googleusercontent.com` (avatar Supabase), `cdn.example.com`, dll.

---

### L-02: Console.log di Production Code
**File:** `src/app/api/ingest/transaksi/route.ts` (line 239-241), `src/app/api/ingest/heartbeat/route.ts` (line 87-89), `src/app/api/ringkasan/route.ts` (line 185-189)

```typescript
console.log(`[ingest] transaksi tersimpan: id=${data[0].id} provider=${provider} ...`);
console.log(`[heartbeat] device=${body.device_id} status=${newStatus} at=${now}`);
```

**Masalah:** Log PII (nomor HP di `raw_notification_text` bisa masuk log kalau error), clutter log production, tidak structured.

**Solusi:** Gunakan structured logger (`pino`) dengan level `info`/`warn`/`error`, redact sensitive fields.

---

### L-03: Hardcoded Color/Icon Mapping di Frontend
**File:** `src/app/(dashboard)/page.tsx` (line 70-91), `src/components/ui/IkonJenisTransaksi.tsx`

```typescript
const getCategoryBadgeColor = (kategori: string) => {
  switch (kategori) {
    case "pulsa": return "bg-blue-50 text-blue-700 border-blue-100";
    case "data": return "bg-purple-50 text-purple-700 border-purple-100";
    // ... 10+ case
  }
};
```

**Masalah:** Kategori baru (dynamic `lainnya_*`) fallback ke gray. Harus update code + deploy untuk kategori baru.

**Solusi:** Generate color dari hash kategori (deterministic) atau simpan `color_class` di tabel `kategori_transaksi_dinamis`.

---

### L-04: Unused/Dead Code
**File:** `src/lib/parser/extractStatus.ts` (hanya 22 lines, dipakai?), `src/lib/parser/extractWaktuOpsional.ts`, `src/lib/parser/extractDetailTambahan.ts`

**Masalah:** Beberapa parser module diekspor tapi tidak dipakai di `parseNotifikasiUniversal` (sudah pakai `extractStatusUniversal` dari `universal.ts`).

**Solusi:** Hapus file yang tidak dipakai, atau mark `@deprecated` dengan comment.

---

### L-05: Missing Security Headers
**File:** `next.config.ts` (tidak ada `headers()`), `vercel.json` (hanya rewrite)

**Masalah:** Tidak ada `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

**Solusi:** Tambah di `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" },
    ],
  }];
}
```

---

### L-06: No Dependency Vulnerability Scanning
**File:** `package.json`, `pnpm-lock.yaml`

**Masalah:** Tidak ada `npm audit` / `pnpm audit` di CI, tidak ada `dependabot.yml` / `renovate.json` untuk update otomatis.

**Solusi:** Tambah GitHub Actions workflow:
```yaml
- name: Audit dependencies
  run: pnpm audit --prod
- name: Check for vulnerabilities
  uses: actions/github-script@v7
  with:
    script: |
      // fail on high/critical
```

---

## 🗄️ DATABASE SCHEMA & MIGRATION ISSUES

### DB-01: Circular FK (konter ↔ perangkat) dengan `DEFERRABLE INITIALLY DEFERRED`
**File:** `supabase/migrations/20240101_initial_schema.sql` (line 38-58)

```sql
-- Circular FK made deferrable
alter table public.konter add constraint konter_perangkat_id_fkey
  foreign key (perangkat_id) references public.perangkat(id) on delete set null
  deferrable initially deferred;
```

**Masalah:** `DEFERRABLE INITIALLY DEFERRED` berarti constraint hanya dicek di **COMMIT transaksi**. Jika aplikasi insert konter + perangkat di transaksi terpisah (bukan 1 transaksi), constraint **tidak divalidasi** → data inconsistent.

**Solusi:** 
- Gunakan 1 transaksi untuk insert keduanya (sudah benar di seed)
- Atau hapus `perangkat_id` dari `konter` (redundan, `perangkat.konter_id` sudah cukup untuk 1:1)

---

### DB-02: Missing Index pada `transaksi.konter_id + waktu` (Sudah Ada tapi Perlu Verifikasi)
**File:** `supabase/migrations/20240101_initial_schema.sql` (line 88)

```sql
create index if not exists idx_transaksi_konter_waktu on public.transaksi (konter_id, waktu desc);
```

**Status:** ✅ Sudah ada. Tapi perlu `EXPLAIN ANALYZE` query laporan/ringkasan untuk pastikan index dipakai.

---

### DB-03: `notifikasi_diabaikan` Tidak Ada RLS untuk Operator (Hanya Admin)
**File:** `supabase/migrations/20240106_fase_231_dynamic_categories_and_ignored_notifications.sql` (line 63-64)

```sql
create policy "notif_diabaikan_read_authenticated" on public.notifikasi_diabaikan
  for select to authenticated using (true);  -- SEMUA authenticated user bisa baca
```

**Masalah:** Migration `20240108_user_profiles_rls.sql` (line 48-59) **override** policy jadi admin-only:
```sql
CREATE POLICY admin_lihat_notifikasi_diabaikan ON public.notifikasi_diabaikan
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
```

**Tapi:** Policy lama `notif_diabaikan_read_authenticated` **tidak di-DROP** → **2 policy coexist**, Postgres pakai `OR` → authenticated user **masih bisa baca** (policy pertama `using (true)` match).

**Solusi:** Di migration `20240108`, tambah `DROP POLICY IF EXISTS notif_diabaikan_read_authenticated ON public.notifikasi_diabaikan;` sebelum create policy baru.

---

### DB-04: `device_heartbeat.duration_minutes` Tidak Terisi Otomatis
**File:** `src/app/api/ingest/heartbeat/route.ts` (line 77-84)

```typescript
await supabase.from("device_heartbeat").insert({
  device_id: body.device_id,
  konter_id: device.konter_id,
  status: newStatus,
  recorded_at: now,
  duration_minutes: null,  // SELALU NULL
});
```

**Masalah:** `duration_minutes` selalu `null`. Seharusnya dihitung dari `recorded_at` sebelumnya (untuk status yang sama) atau dari `last_heartbeat` di tabel `perangkat`.

**Solusi:** Hitung di aplikasi atau pakai trigger Postgres:
```sql
CREATE OR REPLACE FUNCTION calculate_heartbeat_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT INTO NEW.duration_minutes
      EXTRACT(EPOCH FROM (NEW.recorded_at - COALESCE((
        SELECT recorded_at FROM device_heartbeat
        WHERE device_id = NEW.device_id AND status = NEW.status
        ORDER BY recorded_at DESC LIMIT 1
      ), NEW.recorded_at))) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### DB-05: `kategori_transaksi_dinamis` Tidak Ada Unique Constraint pada `contoh_header`
**File:** `supabase/migrations/20240106_fase_231_dynamic_categories_and_ignored_notifications.sql` (line 16-24)

**Masalah:** Bisa insert duplicate kategori dengan `kode` beda tapi `contoh_header` sama. `kode` digenerate dari `kataPertama` header → race condition bisa bikin `lainnya_bayar` dan `lainnya_bayar_2` untuk hal yang sama.

**Solusi:** Tambah `UNIQUE (contoh_header)` atau gunakan `ON CONFLICT (kode) DO UPDATE` saat insert.

---

## ⚡ PERFORMANCE RECOMMENDATIONS

| Area | Current | Recommended |
|------|---------|-------------|
| **Transaksi Query** | Select `*` + in-memory filter | Select kolom spesifik, push filter ke DB |
| **Laporan Aggregation** | Fetch all rows → JS reduce | PostgreSQL `GROUP BY` / Materialized View |
| **Konter Lookup** | Query per request | In-memory cache (TTL 5m) atau join |
| **Realtime** | Full table subscribe | Filter by `konter_id` (operator) |
| **Excel Export** | Load all → ExcelJS | Streaming export untuk > 10k rows |
| **Parser** | Sync, blocking | Web Worker untuk parse batch |

---

## 📦 DEPENDENCY AUDIT

| Package | Version | Status | Note |
|---------|---------|--------|------|
| `next` | 16.2.10 | ✅ Latest | |
| `react` | 19.2.4 | ✅ Latest | |
| `@supabase/supabase-js` | 2.112.3 | ✅ Latest | |
| `@supabase/ssr` | 0.12.4 | ✅ Latest | |
| `exceljs` | 4.4.0 | ⚠️ Check | CVE-2024-xxxx check needed |
| `xlsx` | 0.18.5 | ⚠️ Deprecated | Gunakan `exceljs` saja (sudah dipakai) |
| `recharts` | 3.9.2 | ✅ Latest | |
| `date-fns` | 4.4.0 | ✅ Latest | |
| `jest` | 30.4.2 | ✅ Latest | Tapi **tidak ada test file** |

**Action:** Hapus `xlsx` (unused, deprecated). Jalankan `pnpm audit` rutin.

---

## 🎯 PRIORITAS PERBAIKAN (Roadmap)

### Sprint 1 (Critical - Security) - **Minggu 1**
1. [ ] **C-01**: Ganti service role → user session client di semua API dashboard
2. [ ] **C-02**: Proteksi middleware untuk `/api/seed`, `/api/cron/backup`, `/api/kategori-dinamis`
3. [ ] **C-03**: Pisahkan secret (SEED, CRON, INGEST), tambah rate limiting
4. [ ] **C-04**: Sanitize `search` parameter di `/api/transaksi`

### Sprint 2 (High - Reliability) - **Minggu 2**
5. [ ] **H-01**: Rate limiting semua public endpoint
6. [ ] **H-02**: Validasi ketat ingest (panjang, range, exist check)
7. [ ] **H-03**: Unique constraint universal untuk dedup transaksi
8. [ ] **H-04**: Fix realtime subscription leak
9. [ ] **H-05**: Hapus hardcoded konter mapping, fetch dari API

### Sprint 3 (Medium - Maintainability) - **Minggu 3-4**
10. [ ] **M-01**: Cache konter map / gunakan join
11. [ ] **M-02**: PostgreSQL aggregation untuk laporan (RPC/function)
12. [ ] **M-03**: Centralize WIB utils, hapus duplikat
13. [ ] **M-04**: Standarisasi error handling + structured logging
14. [ ] **M-05**: Refactor parser jadi pipeline stages
15. [ ] **M-06**: Pindah admin fee ke DB table
16. [ ] **M-07**: Tulis unit test parser (target >90% coverage)
17. [ ] **M-08**: Hapus `any` casts, gunakan zod/valibot atau Supabase generated types

### Sprint 4 (Low - Polish) - **Minggu 5**
18. [ ] **L-01**: Batasi `images.remotePatterns.hostname`
19. [ ] **L-02**: Ganti `console.log` → structured logger (pino)
20. [ ] **L-03**: Dynamic color untuk kategori dinamis
21. [ ] **L-04**: Hapus dead code parser
22. [ ] **L-05**: Tambah security headers
23. [ ] **L-06**: Setup dependabot + pnpm audit di CI

### Database Fixes (Parallel)
24. [ ] **DB-01**: Review circular FK strategy
25. [ ] **DB-03**: Drop policy lama `notif_diabaikan_read_authenticated`
26. [ ] **DB-04**: Auto-calculate `duration_minutes` via trigger
27. [ ] **DB-05**: Unique constraint pada `kategori_transaksi_dinamis.contoh_header`

---

## 📝 CATATAN TAMBAHAN

### Arsitektur yang Bagus (Keep Doing)
- ✅ Parser modular dengan separation of concerns
- ✅ Dynamic category system (self-learning)
- ✅ Admin konter fee system yang fleksibel (tier + rounding modes)
- ✅ Realtime updates via Supabase (bukan polling)
- ✅ Excel export dengan styling profesional
- ✅ Timezone handling WIB (UTC+7) konsisten di utils
- ✅ TypeScript strict mode + path aliases

### Technical Debt yang Perlu Dicatat
1. **Parser** butuh rewrite besar (pipeline pattern) — tapi high risk, butuh test dulu
2. **Admin fee** harus pindah ke DB sebelum skala besar
3. **RLS** harus diaktifkan dengan benar (ganti service role client)
4. **Monitoring/Observability** belum ada (logging, metrics, tracing)

---

## 📊 METRIK KUALITAS KODE (Estimasi)

| Metric | Current | Target |
|--------|---------|--------|
| TypeScript Strict | ✅ Enabled | ✅ |
| Test Coverage | ~0% (parser only manual) | >80% (parser), >50% overall |
| Cyclomatic Complexity (parser) | >50 | <15 per function |
| Duplicate Code (WIB utils) | 3 locations | 1 location |
| Security Headers | 0/6 | 6/6 |
| Rate Limiting | 0 endpoints | All public endpoints |
| Dependency Vulnerabilities | Unknown | 0 High/Critical |

---

*Dokumen ini di-generate otomatis berdasarkan audit static analysis. Untuk validasi temuan security (C-01 sampai C-04), disarankan menjalankan penetration testing dengan tools seperti Strix atau manual review.*