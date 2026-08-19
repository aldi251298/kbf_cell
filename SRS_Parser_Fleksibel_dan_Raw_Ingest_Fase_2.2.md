# SRS — Parser Fleksibel Berbasis Keyword, Ingest Raw Text, & Penyederhanaan Auth
### Fase 2.2: Refactor Arsitektur Parsing & Kontrak API Ingest

**Versi:** 1.0
**Target pembaca:** AI coding agent
**Konteks:** Dokumen ini menggantikan sebagian besar pendekatan parsing di `Instruksi_Backend_Supabase_Simulator.md` dan menambal `SRS_Perbaikan_Parser_Bugfix.md` (Fase 2.1). Perubahan paling kritikal ada di Bagian 1 (kontrak API berubah total dari JSON terstruktur menjadi raw text) dan Bagian 2 (penyederhanaan auth). **Baca seluruh dokumen sebelum mulai coding — urutan implementasi di Bagian 8 wajib diikuti.**

---

## 0. Ringkasan Perubahan Paling Kritikal

Dua keputusan arsitektur berikut adalah **prioritas tertinggi** dan mengubah cara kerja seluruh sistem:

1. **Endpoint `/api/ingest/transaksi` TIDAK LAGI menerima JSON terstruktur dari client.** Endpoint ini sekarang hanya menerima **raw notification text** (string mentah dari notifikasi Digipos/Alpines) plus metadata minimal (provider, waktu capture). **Seluruh proses parsing pindah ke backend**, bukan tanggung jawab client (web simulator maupun Android app nanti).
2. **Auth di endpoint ingest disederhanakan drastis.** Hapus konsep `device_id` wajib tervalidasi ke tabel `perangkat`, hapus ingest API secret/token kompleks, hapus validasi field-per-field yang tadinya wajib dikirim client. Auth yang **tetap wajib dan tidak boleh dihapus**: koneksi backend ke Supabase (service role key / RLS policy). Lihat Bagian 2 untuk detail dan alasan.

Alasan perubahan #1: Android app yang akan menangkap notifikasi harus **seringan mungkin** — tugasnya hanya menangkap teks notifikasi dan mengirimkannya, bukan melakukan parsing di sisi client. Semua kompleksitas parsing (yang akan terus berkembang seiring format notifikasi provider berubah) harus terpusat di satu tempat: backend.

Alasan perubahan #2: instruksi eksplisit dari product owner — proyek ini adalah dashboard laporan transaksi internal, bukan sistem multi-tenant publik. Kompleksitas auth per-device tidak proporsional dengan risiko aktual dan menambah beban pengembangan tanpa manfaat sepadan pada tahap ini.

> **Catatan risiko (wajib dibaca, keputusan tetap di tangan pemilik produk):** Endpoint ingest tanpa API key/token berarti siapa pun yang mengetahui URL endpoint dapat mengirim data palsu ke database Anda (data poisoning), atau dalam skenario buruk endpoint di-hit berulang untuk membebani Supabase (biaya/kuota). Karena keputusan ini sudah final dari sisi Anda, mitigasi minimal yang **tetap disarankan tanpa menambah kompleksitas berarti**: (a) rate-limiting sederhana per IP di level endpoint/hosting (mis. Vercel/Next.js middleware, beberapa baris kode, bukan sistem auth), dan (b) jangan expose URL endpoint di client-side code yang publik/inspectable tanpa perlu. Ini opsional — silakan lanjut tanpa keduanya jika ingin implementasi paling minimal.

---

## 1. Kontrak API Baru: `/api/ingest/transaksi`

### 1.1 Request Baru (Raw Text)

**Method:** `POST`
**Body (JSON):**

```json
{
  "provider": "digipos",
  "raw_notification_text": "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549",
  "waktu_capture": "2026-07-26T16:44:55+07:00"
}
```

| Field | Wajib? | Tipe | Keterangan |
|---|---|---|---|
| `provider` | Ya | string, enum `"digipos"` \| `"alpines"` | Ditentukan oleh Android app berdasarkan sumber notifikasi (nama app/paket notifikasi), **bukan hasil parsing teks**. Ini satu-satunya klasifikasi yang boleh dilakukan di client karena tersedia gratis dari sistem notifikasi Android. |
| `raw_notification_text` | Ya | string, non-empty | Isi mentah notifikasi, apa adanya, tanpa modifikasi. |
| `waktu_capture` | Ya | timestamp ISO 8601 | Waktu saat notifikasi ditangkap oleh Android/simulator. Ini menjadi `waktu_transaksi` di database — **bukan hasil ekstraksi dari teks**, sesuai prinsip lama yang tetap berlaku. |

**Field yang TIDAK BOLEH ada lagi di request (dihapus dari kontrak lama):** `jenis_transaksi`, `nama_produk`, `nominal`, `nomor_tujuan`, `status`, `sn`, `device_id`, `detail_tambahan`. Semua ini sekarang **dihasilkan backend dari hasil parsing**, bukan dikirim client.

### 1.2 Validasi Request (Hanya Ini, Tidak Lebih)

Endpoint hanya boleh menolak request (`400 Bad Request`) jika:
- `provider` tidak ada atau bukan salah satu dari `"digipos"` / `"alpines"`.
- `raw_notification_text` tidak ada, bukan string, atau string kosong setelah di-trim.
- `waktu_capture` tidak ada atau bukan timestamp valid yang bisa di-parse.

**Tidak ada validasi lain.** Tidak ada pengecekan device, tidak ada API key, tidak ada whitelist kombinasi apa pun. Ini konsisten dengan prinsip di SRS Fase 2.1 Bagian 1 — dipertajam sekarang: bahkan field generik seperti `jenis_transaksi`/`nominal` tidak lagi divalidasi di titik ini karena field itu tidak lagi dikirim client sama sekali, melainkan hasil kerja parser di server.

### 1.3 Alur di Dalam Endpoint

1. Terima & validasi request minimal (Bagian 1.2).
2. Panggil modul parser terpusat (Bagian 3) dengan input `provider` + `raw_notification_text`.
3. Parser mengembalikan objek transaksi terstruktur lengkap (field generik sesuai Bagian 4).
4. Simpan hasil ke tabel `transaksi` di Supabase — **selalu berhasil simpan**, tidak peduli separah apa pun hasil parsingnya (minimal `raw_notification_text` + `provider` + `waktu_transaksi` + `status: "perlu_review"` tersimpan).
5. Response `200 OK` dengan ringkasan hasil parsing (untuk keperluan debug/testing di web simulator, opsional ditampilkan).

### 1.4 Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-baris-transaksi",
    "jenis_transaksi": "pulsa",
    "nominal": 20000,
    "status": "sukses",
    "perlu_review": false
  }
}
```

`success` selalu `true` selama request lolos validasi Bagian 1.2 — kegagalan parsing **bukan** kegagalan request (lihat Bagian 3).

---

## 2. Penyederhanaan Auth — Instruksi Eksplisit untuk Agent

**Hapus seluruhnya, tanpa terkecuali, dari endpoint `/api/ingest/transaksi` dan kode pendukungnya:**

1. **Validasi `device_id` terhadap tabel `perangkat`.** Hapus query pengecekan device, hapus requirement field `device_id` di request/schema.
2. **API secret/token untuk endpoint ingest** (mis. header `x-api-key`, `Authorization: Bearer ...` custom yang sebelumnya dipakai untuk endpoint ini) — hapus middleware/pengecekan terkait, hapus environment variable terkait jika memang hanya dipakai di sini.
3. **Tabel `perangkat`** boleh tetap ada di skema Supabase (tidak perlu drop table) tapi **tidak lagi direferensikan/di-JOIN/divalidasi** oleh endpoint ingest maupun dashboard, kecuali jika dashboard nanti butuh untuk keperluan lain di luar scope dokumen ini.
4. Hapus juga field `device_id` dari kolom yang diwajibkan di skema tabel `transaksi` (ubah jadi nullable atau drop kolom, sesuai preferensi — tapi jangan biarkan `NOT NULL` karena request baru tidak mengirim field ini).

**Yang TETAP WAJIB ada dan TIDAK BOLEH dihapus atau dilonggarkan:**

- Koneksi Supabase dari backend (Next.js server-side) tetap menggunakan **service role key** (atau anon key + RLS policy yang benar) sesuai konfigurasi Supabase standar — ini bukan "auth per-request" ke endpoint ingest, melainkan auth backend-ke-database, dan levelnya berbeda: kredensial ini hanya ada di server, tidak pernah ter-expose ke client.
- Pastikan endpoint ingest tetap **hanya bisa diakses server Next.js untuk berkomunikasi dengan Supabase**, bukan client langsung terhubung ke Supabase dari browser/Android tanpa lewat backend.

**Ringkasnya:** endpoint `/api/ingest/transaksi` menjadi endpoint terbuka (tanpa API key) yang menerima raw text dari siapa pun yang tahu URL-nya, tapi backend-ke-Supabase tetap terautentikasi seperti biasa.

---

## 3. Parser Terpusat: Arsitektur Berbasis Keyword & Confidence, Bukan Regex Posisional Kaku

Ini inti perbaikan atas keluhan "parser terlalu strict terhadap format." Ganti seluruh pendekatan regex-per-template posisional dengan pipeline berlapis berikut.

### 3.1 Prinsip Desain

- **Deteksi jenis transaksi dan ekstraksi tiap field dilakukan independen satu sama lain**, masing-masing mencari pola/keyword di **seluruh teks**, tidak bergantung posisi baris/urutan kalimat.
- Tidak ada template yang "harus cocok 100%". Setiap field diekstrak dengan pola sendiri-sendiri; kalau satu field gagal ketemu, field lain tetap coba diekstrak.
- **Transaksi tidak pernah ditolak karena parser tidak mengenali formatnya** (prinsip ini dari SRS 2.1 Bagian 3, tetap berlaku dan diperkuat).

### 3.2 Struktur Modul (disarankan `src/lib/parser/`)

```
src/lib/parser/
  index.ts                 // entry point: parseNotifikasi(provider, rawText)
  detectJenisTransaksi.ts  // scoring keyword → jenis_transaksi
  extractNominal.ts
  extractNomorTujuan.ts
  extractStatus.ts
  extractWaktuOpsional.ts  // opsional, waktu_transaksi utama tetap dari waktu_capture
  extractProviderSeluler.ts
  extractNamaProduk.ts
  extractDetailTambahan.ts // SN, REFF, ID Transaksi, saldo, dst → opsional
  types.ts
```

### 3.3 Deteksi `jenis_transaksi` (Scoring, Bukan Match Biner)

Cari keyword (case-insensitive) di seluruh `raw_notification_text`, hitung skor per kandidat kategori:

| Kandidat `jenis_transaksi` | Keyword pemicu (contoh, bisa ditambah seiring waktu) |
|---|---|
| `pulsa` | `isi ulang pulsa`, `pulsa`, (dan TIDAK ada keyword paket/GB/hari di dekatnya) |
| `paket_data` | `paket data`, `voucher`, `GB`, `MB`, kombinasi angka+`hari` (mis. `3 hari`, `28 Hari`) |
| `pln` | `PLN`, `token listrik`, `stroom`, `meter` |
| `ewallet` | `DANA`, `GOPAY`, `GO-PAY`, `OVO`, `SHOPEEPAY`, `LINKAJA`, `SALDO DANA`, `SALDO GOPAY` |

Kategori dengan skor tertinggi dipilih. Jika semua skor 0 → `jenis_transaksi = "belum_dikenal"`, tandai `perlu_review: true`, tetap lanjut ke ekstraksi field lain semaksimal mungkin.

**Catatan urutan prioritas penting:** cek `ewallet` dan `pln` sebelum `paket_data`/`pulsa` kalau ada ambiguitas skor, karena notifikasi e-wallet/PLN kadang memuat kata yang mirip pola nominal paket. Gunakan keyword paling spesifik dulu (nama e-wallet eksplisit seperti "DANA"/"GOPAY" adalah sinyal terkuat, prioritaskan di atas kandidat lain jika muncul).

### 3.4 Ekstraksi `nominal` (Field Paling Kritis)

Cari dengan urutan prioritas, berhenti di pola pertama yang match:

1. Pola `Rp\s?[\d.,]+` (case-insensitive termasuk `rp`, `RP`) → ambil digitnya, buang separator titik/koma ribuan.
2. Pola khusus notifikasi Alpines format saldo: `Saldo\s*[\d.,]+\s*-\s*[\d.,]+\s*=\s*[\d.,]+` → nominal = **angka kedua** (jumlah yang dikurangkan), bukan saldo awal/akhir. Contoh: `Saldo 309.523 - 11950 = 297.573` → nominal = `11950` (perhatikan: pada contoh Alpines, kadang notasi ribuan **tidak konsisten** — `11950` di sana berarti Rp 11.950, sedangkan `309.523` berarti Rp 309.523; parser cukup ambil angka mentah tanpa asumsi tambahan pemformatan berlebih, karena field ini tetap ditandai untuk verifikasi jika hasilnya janggal — lihat Bagian 3.7 soal sanity check).
3. Pola nama e-wallet diikuti angka nominal langsung (mis. `DANA50.081261592333` atau `GO100.081372331339` — format Alpines yang menempelkan kode singkat nominal + prefix nomor HP tanpa spasi) → butuh pola khusus: `[DANA|GO|OVO]{kode}(\d+)\.(\d{10,13})`, tapi ini **rawan salah** karena bercampur dengan nomor HP. **Prioritaskan sumber nominal dari pola `Saldo X - Y = Z` (poin 2) untuk notifikasi Alpines**, karena lebih eksplisit dan konsisten di semua contoh yang diberikan. Field di kode singkat awal (`DANA50`, `GO100`) cukup dipakai sebagai sinyal tambahan/cross-check, bukan sumber utama.
4. Fallback terakhir: angka besar (≥4 digit) mana pun yang paling dekat dengan keyword `nominal`/`senilai`/`sebesar`/`Rp`.

Jika tidak ada satu pun pola cocok → `nominal = null`, `perlu_review: true`.

### 3.5 Ekstraksi `nomor_tujuan`

- Cari pola digit **10–13 karakter** yang diawali `08` atau `62`, di mana pun posisinya dalam teks.
- Untuk Digipos, biasanya muncul setelah keyword `no pelanggan`, `no.`, atau `MSISDN:`.
- Untuk Alpines, sering muncul menempel tanpa spasi setelah kode nominal (mis. `.081261592333` pada `DANA50.081261592333`) — pola regex: cari urutan digit panjang 10–13 setelah tanda titik, atau di dalam segmen `SN/Ref:` (mis. `081261592333` pada segmen `MXX INDXXXXXX/50000/081261592333/REFF:...`).
- **Untuk PLN**: field ini diisi dengan nomor meter/ID pelanggan PLN jika notifikasi menyebutnya (biasanya juga pola digit panjang, tapi tanpa prefix `08`/`62` — bisa 11-12 digit polos), **atau token PLN** jika transaksi prabayar (pola alfanumerik tertentu, biasanya 20 digit angka murni untuk token fisik — beda dari nomor meter). Field `nomor_tujuan` **dipakai ulang untuk kasus PLN** sesuai keputusan yang sudah ditetapkan (lihat Bagian 5.2), bukan `detail_tambahan`.
- Jika tidak ketemu → `nomor_tujuan = null`.

### 3.6 Ekstraksi `status`

Cari keyword (case-insensitive), prioritas match pertama:
- `berhasil`, `sukses`, `success` → `"sukses"`
- `gagal`, `failed`, `ditolak` → `"gagal"`
- `pending`, `diproses`, `menunggu` → `"pending"`
- Tidak ketemu sama sekali → default `"pending"` dan `perlu_review: true` (lebih aman daripada asumsi sukses).

### 3.7 Sanity Check Ringan (Bukan Validasi Penolak, Hanya Penanda Review)

Setelah semua field diekstrak, jalankan pengecekan berikut — **jika gagal, jangan tolak data, cukup set `perlu_review: true`** dan catat alasan di `detail_tambahan.alasan_review`:

- `nominal` null atau ≤ 0.
- `nomor_tujuan` null padahal `jenis_transaksi` termasuk yang wajib punya nomor tujuan (`pulsa`, `paket_data`, `ewallet`).
- `jenis_transaksi === "belum_dikenal"`.
- Untuk `pln`: baik nomor meter maupun token sama-sama tidak ketemu.

### 3.8 Ekstraksi Field Tambahan Per Jenis (Sesuai Kebutuhan Tampilan Wajib)

**a. `provider_seluler` (khusus `pulsa`, field baru — lihat keputusan Bagian 5.1)**

Deteksi dari keyword nama operator dalam teks atau dari pola `nomor_tujuan` (prefiks nomor HP Indonesia per operator sebagai fallback jika nama operator tidak disebut eksplisit di teks):

| Operator | Keyword eksplisit | Prefiks nomor (fallback) |
|---|---|---|
| Telkomsel (Simpati/AS/ByU/Loop) | `telkomsel`, `simpati`, ` AS `, `byU`, `byu` | `0811-0812-0813-0821-0822-0823-0851-0852-0853` (Simpati/AS), `0838` (ByU, cek daftar terbaru) |
| Axis | `axis` | `0838`, `0831-0833` |
| Tri (3) | `tri`, ` 3 ` | `0895-0899` |
| Indosat (IM3/Mentari) | `indosat`, `im3`, `mentari` | `0855-0858`, `0814-0815` |
| XL | `xl` | `0817-0819`, `0859-0877-0878` |

Catatan: notifikasi Digipos untuk pulsa **saat ini hanya dipakai untuk Telkomsel** (sesuai konfirmasi Anda), tapi buat deteksi tetap generik untuk semua operator agar tahan-banting kalau nanti Digipos dipakai untuk operator lain juga. Kalau tidak ketemu keyword eksplisit maupun prefiks cocok → `provider_seluler = null`, tidak masalah, bukan alasan `perlu_review`.

**b. `nama_produk` untuk `paket_data`**

Ambil frasa yang mengandung pola `[huruf/angka] GB/MB [angka] Hari` (mis. `byU Kaget 11 GB 28 Hari`, `AIGO 5.5 gb 3 hari`). Regex longgar: cari substring dari kata sebelum angka+GB/MB sampai kata setelah angka+Hari/hari. Simpan apa adanya sebagai `nama_produk`, termasuk info masa aktif yang menempel di situ (tidak perlu dipisah field lagi — cukup satu string deskriptif, sesuai instruksi "termasuk masa aktif paket kalau ada").

**c. `nama_produk` untuk `ewallet`**

Ambil nama e-wallet dari keyword yang match di 3.3 (`DANA`, `GOPAY`, `OVO`, dst), normalisasi kapitalisasi (mis. `GOPAY` → `GoPay`, `DANA` → `DANA`).

**d. Nama pemilik (opsional, khusus `ewallet`, field baru: `nama_pemilik` — nullable, JANGAN taruh di `detail_tambahan` karena ini termasuk wajib-tampil-jika-ada sesuai instruksi Anda)**

Cari pola nama setelah keyword `NAMA:` (lihat contoh notifikasi DANA format 2: `NAMA:DNID-AVRXXXX WIJXXXXXX`) atau setelah kode e-wallet di segmen `SN/Ref:` (contoh GoPay: `GOPAY/Jasmisaputra/100000/...` → segmen kedua setelah nama e-wallet adalah nama). Jika tidak ada pola yang cocok → `nama_pemilik = null`, wajar untuk banyak kasus (lihat contoh notifikasi DANA format 1 yang tidak mencantumkan nama).

**e. SN, REFF, ID Transaksi (semua opsional → `detail_tambahan`)**

Cari keyword `SN`, `SN/Ref`, `REFF`, `ID Transaksi`, `IDT`, ambil string alfanumerik setelahnya sampai delimiter berikutnya (spasi ganda, titik, akhir baris). Simpan semua yang ketemu sebagai object di `detail_tambahan`, mis:
```json
{
  "sn": "04224600001707226406",
  "id_transaksi": "DGPS260726164455775705549",
  "reff": "2026072610121481030100166970654515631"
}
```
Field mana pun yang tidak ketemu, cukup tidak dimasukkan ke object ini (bukan `null` eksplisit, cukup absen).

---

## 4. Skema Tabel `transaksi` — Update

Field generik dari SRS 2.1 Bagian 2 tetap berlaku, dengan penambahan/perubahan berikut:

| Field | Wajib? | Tipe | Perubahan dari SRS 2.1 |
|---|---|---|---|
| `provider` | Ya | string, `digipos`/`alpines` | Tetap, sekarang dikirim client (Android/simulator), bukan hasil parsing. |
| `jenis_transaksi` | Ya | string bebas | Tetap, sekarang hasil parsing backend. |
| `nama_produk` | Tidak | string | Tetap. |
| `provider_seluler` | Tidak (baru) | string | **Field baru.** Nullable. Hanya relevan untuk `jenis_transaksi = "pulsa"`. |
| `nama_pemilik` | Tidak (baru) | string | **Field baru.** Nullable. Hanya relevan untuk `jenis_transaksi = "ewallet"`. |
| `nominal` | Ya | number > 0 | Tetap, tapi sekarang bisa `null` jika parsing gagal total (lihat catatan di bawah). |
| `nomor_tujuan` | Tidak | string | Tetap, **sekarang juga dipakai untuk PLN** (nomor meter/token) — override dari SRS 2.1 sesuai keputusan Bagian 5.2. |
| `status` | Ya | string | Tetap. |
| `device_id` | — | — | **Dihapus** (lihat Bagian 2). |
| `waktu_transaksi` | Ya | timestamp | Sekarang diisi dari `waktu_capture` di request, bukan hasil parsing teks (tetap sesuai prinsip lama). |
| `raw_notification_text` | Ya | string | Tetap, tetap disimpan apa adanya. |
| `detail_tambahan` | Tidak | JSON | Tetap: SN, REFF, ID Transaksi, saldo, alasan review. |
| `perlu_review` | Ya, default `false` | boolean | **Naik level jadi kolom sendiri** (sebelumnya di dalam `detail_tambahan` di SRS 2.1) — supaya bisa difilter/di-index langsung di dashboard tanpa query JSON. |

**Catatan soal `nominal` wajib > 0:** karena field ini sekarang bisa gagal diekstrak (kasus fallback total), longgarkan constraint kolom di database dari `NOT NULL CHECK (nominal > 0)` menjadi `nullable`, dan andalkan `perlu_review = true` sebagai penanda alih-alih menolak insert. Ini konsisten dengan prinsip "transaksi tidak pernah hilang" dari SRS 2.1.

**Migrasi kolom yang diperlukan:**
```sql
ALTER TABLE transaksi
  ADD COLUMN IF NOT EXISTS provider_seluler TEXT,
  ADD COLUMN IF NOT EXISTS nama_pemilik TEXT,
  ADD COLUMN IF NOT EXISTS perlu_review BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN device_id DROP NOT NULL,
  ALTER COLUMN nominal DROP NOT NULL;
-- device_id kolom boleh di-drop total jika tidak ada kebutuhan lain:
-- ALTER TABLE transaksi DROP COLUMN IF EXISTS device_id;
```

---

## 5. Keputusan Desain yang Sudah Dikonfirmasi

Berikut hasil klarifikasi yang menjadi acuan resmi implementasi (jangan menyimpang tanpa diskusi ulang):

### 5.1 Provider seluler pulsa → field baru `provider_seluler`
Bukan digabung ke `nama_produk`. Alasan: `nama_produk` menurut SRS 2.1 secara eksplisit kosong untuk pulsa, dan mencampur makna field bikin logic frontend (Bagian 6) jadi tidak konsisten. Field baru lebih bersih untuk keperluan filter/tampilan.

### 5.2 Tujuan PLN → tetap pakai `nomor_tujuan`, BUKAN `detail_tambahan`
Ini **override eksplisit** terhadap SRS 2.1 Bagian 2 & 4 yang sebelumnya bilang PLN tidak pakai `nomor_tujuan`. Sekarang: nomor meter/ID pelanggan PLN **atau** token prabayar, keduanya masuk `nomor_tujuan`. Konsekuensi ke frontend: label field ini untuk PLN adalah **"Nomor Meter / Token"** (dinamis, lihat Bagian 6), bukan disembunyikan seperti aturan lama.

---

## 6. Field yang Wajib Ditampilkan Frontend per Jenis Transaksi (Final)

Update dari SRS 2.1 Bagian 4, sekarang final sesuai kebutuhan bisnis:

| Jenis | Field wajib tampil | Label nomor tujuan |
|---|---|---|
| **Pulsa** | `provider_seluler`, `nomor_tujuan`, `nominal`, `waktu_transaksi` | "Nomor HP" |
| **Paket Data** | `nomor_tujuan`, `nama_produk` (termasuk masa aktif jika ada), `nominal`, `waktu_transaksi` | "Nomor HP" |
| **E-wallet** | `nama_produk` (jenis e-wallet), `nominal`, `nomor_tujuan`, `nama_pemilik` (tampilkan hanya jika tidak null), `waktu_transaksi` | "Nomor Tujuan" |
| **PLN** | `nominal`, `nomor_tujuan`, `waktu_transaksi` | "Nomor Meter / Token" |

**Field yang selalu opsional/tersembunyi di semua jenis:** SN, REFF, ID Transaksi, saldo (semua dari `detail_tambahan`) — **tidak ditampilkan di UI**, sesuai instruksi Anda dan konsisten dengan SRS 2.1.

**Update fungsi util `getTampilanTransaksi(transaksi)`** (SRS 2.1 Bagian 4) agar mencakup field baru:

```typescript
function getTampilanTransaksi(transaksi: Transaksi) {
  switch (transaksi.jenis_transaksi) {
    case "pulsa":
      return {
        labelJenis: "Isi Ulang Pulsa",
        tampilkanProviderSeluler: true,
        labelNomorTujuan: "Nomor HP",
        tampilkanNomorTujuan: true,
        tampilkanNamaProduk: false,
        tampilkanNamaPemilik: false,
      };
    case "paket_data":
      return {
        labelJenis: "Paket Data",
        tampilkanProviderSeluler: false,
        labelNomorTujuan: "Nomor HP",
        tampilkanNomorTujuan: true,
        tampilkanNamaProduk: true,
        tampilkanNamaPemilik: false,
      };
    case "ewallet":
      return {
        labelJenis: "Top Up E-Wallet",
        tampilkanProviderSeluler: false,
        labelNomorTujuan: "Nomor Tujuan",
        tampilkanNomorTujuan: true,
        tampilkanNamaProduk: true, // jenis e-wallet
        tampilkanNamaPemilik: transaksi.nama_pemilik != null,
      };
    case "pln":
      return {
        labelJenis: "Token/Tagihan PLN",
        tampilkanProviderSeluler: false,
        labelNomorTujuan: "Nomor Meter / Token",
        tampilkanNomorTujuan: true,
        tampilkanNamaProduk: false,
        tampilkanNamaPemilik: false,
      };
    default:
      return {
        labelJenis: "Belum Dikenal — Perlu Review",
        tampilkanProviderSeluler: false,
        labelNomorTujuan: "Nomor Tujuan",
        tampilkanNomorTujuan: transaksi.nomor_tujuan != null,
        tampilkanNamaProduk: transaksi.nama_produk != null,
        tampilkanNamaPemilik: transaksi.nama_pemilik != null,
      };
  }
}
```

Semua komponen tabel/kartu **wajib** memanggil fungsi ini, tidak ada logic if-else tersebar (aturan ini tetap dari SRS 2.1, tidak berubah).

**Indikator visual tambahan:** baris dengan `perlu_review = true` harus diberi badge/highlight berbeda (mis. warna kuning/oranye) di dashboard, supaya mudah ditemukan untuk pengecekan manual.

---

## 7. Contoh Notifikasi & Hasil Parsing yang Diharapkan (Test Cases Wajib)

Gunakan 6 contoh berikut sebagai unit test wajib untuk modul parser. Semua harus lolos tanpa error dan menghasilkan field sesuai tabel berikut.

### 7.1 Digipos — Pulsa (format lengkap)
> "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `pulsa` |
| `nominal` | `20000` |
| `nomor_tujuan` | `6285176740026` |
| `provider_seluler` | `null` (tidak ada keyword eksplisit — wajar, lihat catatan Bagian 3.8a) |
| `status` | `sukses` |
| `detail_tambahan.sn` | `04224600001707226406` |
| `detail_tambahan.id_transaksi` | `DGPS260726164455775705549` |
| `perlu_review` | `false` |

### 7.2 Digipos — Pulsa (format tanpa nominal eksplisit, ada tanggal di teks)
> "Isi ulang pulsa untuk no. 6285176740026 telah berhasil dengan SN: 04224600001707226406 pada 14/08/2026 09:44:37"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `pulsa` (keyword "isi ulang pulsa" tetap match walau nominal tidak ada) |
| `nominal` | `null` |
| `nomor_tujuan` | `6285176740026` |
| `status` | `sukses` |
| `perlu_review` | `true`, alasan: nominal tidak ditemukan |

Ini contoh penting: **membuktikan parser tidak boleh gagal total** walau field kritis (nominal) tidak ada di teks — data tetap tersimpan dengan flag review, bukan ditolak.

### 7.3 Digipos — Paket Data
> "Transaksi pengisian paket data byU Kaget 11 GB 28 Hari 28 Hari pada 12 August 2026 10:17:29 senilai Rp41800 telah berhasil. MSISDN: 6285194309031. ID Transaksi: DGPS260812221726516954578"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `paket_data` |
| `nominal` | `41800` |
| `nomor_tujuan` | `6285194309031` |
| `nama_produk` | `"byU Kaget 11 GB 28 Hari 28 Hari"` (apa adanya, termasuk duplikasi "28 Hari" jika memang begitu di teks asli — jangan coba "bersihkan" duplikasi, ambil apa adanya) |
| `status` | `sukses` |
| `detail_tambahan.id_transaksi` | `DGPS260812221726516954578` |
| `perlu_review` | `false` |

### 7.4 Alpines — Paket Data (Voucher)
> "VOUCHER AIGO 5.5 gb 3 hari 838nomor voucher#VA5.0838 Berhasil. SN/Ref: :3170 0838 8279 5759. Saldo 309.523 - 11950 = 297.573 @15/08 20:44:39"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `paket_data` (keyword "voucher", "gb", "hari") |
| `nominal` | `11950` (dari pola `Saldo X - Y = Z`, ambil Y) |
| `nomor_tujuan` | `null` (tidak ada pola nomor HP jelas di teks ini — wajar untuk voucher, tandai review) |
| `nama_produk` | `"AIGO 5.5 gb 3 hari"` |
| `status` | `sukses` |
| `detail_tambahan.sn` | `3170 0838 8279 5759` |
| `perlu_review` | `true`, alasan: nomor_tujuan tidak ditemukan padahal jenis paket_data mewajibkannya |

### 7.5 Alpines — E-wallet DANA (format 1, tanpa nama)
> "Saldo DANA50.081261592333 Berhasil. SN/Ref: DANA TOPUP/MXX INDXXXXXX/50000/081261592333/REFF:2026072610121481030100166970654515631. Saldo 998.218 - 50.650 = 947.568 @26/07 21:03:16"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `ewallet` |
| `nama_produk` | `"DANA"` |
| `nominal` | `50650` (dari `Saldo 998.218 - 50.650 = 947.568`, ambil `50.650` → `50650`) |
| `nomor_tujuan` | `081261592333` |
| `nama_pemilik` | `null` (tidak ada pola `NAMA:` di format ini — field `MXX INDXXXXXX` bukan nama jelas, biarkan null, jangan dipaksa ekstrak dari string ambigu ini) |
| `status` | `sukses` |
| `perlu_review` | `false` |

### 7.6 Alpines — E-wallet DANA (format 2, dengan nama)
> "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `ewallet` |
| `nama_produk` | `"DANA"` |
| `nominal` | `200000` (di sini ada keyword eksplisit `NOMINAL:200000` — **prioritaskan pola ini di atas pola `Saldo X - Y = Z`** karena lebih eksplisit; catatan tambahan pola nominal di Bagian 3.4 perlu ditambah: cek keyword `NOMINAL:` dulu sebelum fallback ke pola saldo) |
| `nomor_tujuan` | `081267746287` |
| `nama_pemilik` | `"DNID-AVRXXXX WIJXXXXXX"` (dari pola `NAMA:...` sampai delimiter `/`) |
| `status` | `sukses` |
| `detail_tambahan.idt` | `2026081510121481030100166963767458397` |
| `perlu_review` | `false` |

### 7.7 Alpines — E-wallet GoPay
> "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31"

| Field | Hasil |
|---|---|
| `jenis_transaksi` | `ewallet` |
| `nama_produk` | `"GoPay"` (normalisasi dari `GOPAY`) |
| `nominal` | `100000` (dari segmen `SN/Ref: GOPAY/Jasmisaputra/100000/...` — angka setelah nama pemilik; **tambahan pola khusus**: untuk format `NAMA_EWALLET/nama_orang/nominal/nomor_hp/REFF:...` di segmen SN/Ref, ambil komponen ketiga sebagai nominal jika ada 4+ komponen dipisah `/`) |
| `nomor_tujuan` | `081372331339` |
| `nama_pemilik` | `"Jasmisaputra"` |
| `status` | `sukses` |
| `perlu_review` | `false` |

**Catatan penting dari 7.5–7.7:** format Alpines untuk e-wallet **tidak seragam** antar sub-kasus (kadang nominal paling akurat dari pola `Saldo X-Y=Z`, kadang dari keyword `NOMINAL:`, kadang dari posisi ketiga di segmen `SN/Ref` yang dipisah `/`). **Susun urutan prioritas ekstraksi nominal untuk `ewallet` sebagai berikut, berhenti di yang pertama match:**
1. Keyword eksplisit `NOMINAL:` diikuti angka.
2. Segmen `SN/Ref:` berformat `X/Y/angka/angka_panjang/...` (dipisah `/`, minimal 4 segmen) → ambil segmen numerik yang **bukan** nomor HP (bukan 10-13 digit diawali 08).
3. Pola `Saldo A - B = C` → ambil `B`.
4. Fallback umum `Rp\d+`.

---

## 8. Urutan Implementasi Wajib

1. **Migrasi skema database** (Bagian 4) — jalankan dulu sebelum ubah kode, supaya tidak ada mismatch saat testing.
2. **Hapus auth & device validation** (Bagian 2) dari endpoint ingest.
3. **Bangun modul parser terpusat** (Bagian 3) sebagai unit terpisah yang bisa ditest independen dari endpoint — tulis unit test untuk ke-7 contoh di Bagian 7 dulu sebelum integrasi ke endpoint.
4. **Ubah kontrak endpoint `/api/ingest/transaksi`** (Bagian 1) untuk menerima raw text dan memanggil parser.
5. **Update web simulator** agar mengirim raw text notification (bukan lagi JSON terstruktur hasil parsing di sisi simulator) — simulator sekarang hanya generate teks notifikasi mentah + pilih provider, persis meniru apa yang nanti dilakukan Android app.
6. **Update fungsi `getTampilanTransaksi`** dan seluruh komponen dashboard (Bagian 6).
7. **Regresi test bug lama** dari SRS 2.1 Bagian 5 (Invalid time value & hydration error) — pastikan masih fix setelah semua perubahan di atas, terutama karena `nominal`/`waktu_transaksi` sekarang punya kemungkinan null baru yang harus dihandle di agregasi.
8. Jalankan seluruh 7 test case Bagian 7 end-to-end (kirim raw text ke endpoint sungguhan → cek data tersimpan sesuai ekspektasi tabel).

---

## 9. Kriteria Selesai

1. Endpoint `/api/ingest/transaksi` menerima **hanya** `provider` + `raw_notification_text` + `waktu_capture` — request dengan field JSON terstruktur lain diabaikan/tidak diperlukan.
2. Tidak ada lagi validasi `device_id`, API key, atau auth apa pun selain koneksi Supabase backend (Bagian 2 dihapus total dari kode).
3. Seluruh 7 contoh notifikasi di Bagian 7 diproses sesuai tabel hasil yang diharapkan (toleransi: field yang ditandai wajar-null tetap null, field lain harus sesuai).
4. Notifikasi dengan format yang belum pernah dilihat sebelumnya tetap tersimpan (`jenis_transaksi: "belum_dikenal"`, `perlu_review: true`), tidak pernah menghasilkan error/500.
5. Frontend menampilkan field sesuai Bagian 6 per jenis transaksi, termasuk field baru `provider_seluler` dan `nama_pemilik`, lewat fungsi util terpusat.
6. Baris dengan `perlu_review = true` punya indikator visual berbeda di dashboard.
7. Kedua bug dari SRS 2.1 Bagian 5 tetap tidak muncul setelah perubahan skema (khususnya karena `nominal` sekarang nullable).
8. Web simulator sudah diubah untuk generate & kirim raw text saja (bukan JSON terstruktur), sebagai bukti kontrak API baru benar-benar dipakai end-to-end, bukan cuma didukung backend.
