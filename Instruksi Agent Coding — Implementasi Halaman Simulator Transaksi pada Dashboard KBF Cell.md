# Instruksi Implementasi Halaman Simulator Transaksi — KBF Cell

## 1. Konteks Project

Project ini **BUKAN project simulator baru**.

Project yang sedang dikerjakan adalah **Dashboard KBF Cell yang sudah memiliki backend, API, database, authentication, transaction system, dan fitur-fitur lainnya**.

Saya hanya ingin menambahkan **satu halaman/fitur baru** bernama:

> **Transaction Simulator**

Halaman ini digunakan untuk mensimulasikan notifikasi transaksi dari dua provider:

- `digipos`
- `alpines`

Simulator harus mengirim transaksi menggunakan **API/backend yang SUDAH ADA di project**.

---

# 2. ATURAN PALING PENTING

## JANGAN MEMBUAT BACKEND BARU

Jangan membuat:

- API endpoint baru
- database baru
- tabel baru
- schema database baru
- migration baru
- service backend baru
- parser transaksi baru
- controller baru
- route API baru
- authentication baru
- sistem ingest baru

Semua kebutuhan tersebut **SUDAH ADA**.

Tugas agent adalah:

> **Cari, pahami, lalu gunakan sistem existing.**

---

# 3. Jangan Mengasumsikan API

Sebelum menulis kode halaman simulator, agent **WAJIB membaca project terlebih dahulu**.

Cari seluruh implementasi yang berhubungan dengan:

```text
transaction
transaksi
ingest
notification
provider
digipos
alpines
KBF Cell
API
```

Cari juga:

```text
/api
/api/ingest
/api/ingest/transaksi
transaction service
transaction controller
transaction schema
transaction validation
Prisma
database model
Zod
DTO
types
```

Gunakan implementasi yang benar-benar ditemukan di repository.

**Jangan mengarang endpoint, payload, field, atau schema.**

---

# 4. Pelajari Alur Existing

Sebelum membuat simulator, pahami alur transaksi yang sudah digunakan project.

Cari tahu:

```text
Android KBF Cell
      ↓
Notification
      ↓
Existing API
      ↓
Backend
      ↓
Parser
      ↓
Database
      ↓
Dashboard
```

Simulator harus masuk ke **alur yang sama**.

Target:

```text
Transaction Simulator
        ↓
EXISTING API
        ↓
EXISTING BACKEND
        ↓
EXISTING PARSER
        ↓
EXISTING DATABASE
        ↓
EXISTING DASHBOARD
```

Jangan membuat jalur khusus simulator.

---

# 5. Gunakan API Existing

Misalnya setelah membaca project ditemukan:

```text
POST /api/ingest/transaksi
```

dan API tersebut menerima:

```json
{
  ...
}
```

maka simulator harus menggunakan endpoint dan payload tersebut.

Jika ternyata endpoint existing berbeda, gunakan endpoint yang ditemukan.

**API existing adalah source of truth.**

---

# 6. Pelajari Schema Database

Baca model database yang berkaitan dengan transaksi.

Cari:

```text
Transaction
Transaksi
Notification
Provider
TransactionType
```

Perhatikan:

- nama field
- tipe data
- nullable/non-nullable
- enum
- relation
- default value
- validation
- parser result

Tujuannya agar simulator menghasilkan transaksi yang **benar-benar kompatibel dengan sistem existing**.

---

# 7. Provider WAJIB

Setiap transaksi simulator **WAJIB memiliki provider**.

Provider yang diperbolehkan hanya:

```text
digipos
alpines
```

Gunakan value persis sesuai yang digunakan project existing.

Jangan membuat enum provider baru jika enum tersebut sudah ada.

Jika project existing sudah memiliki:

```ts
Provider.DIGIPOS
Provider.ALPINES
```

gunakan enum tersebut.

Jangan membuat:

```ts
type Provider = "DigiPOS" | "Alpines";
```

jika project sudah memiliki definisi provider sendiri.

---

# 8. Gunakan Type/Interface Existing

Cari type/interface yang sudah digunakan oleh backend/frontend.

Jika sudah ada:

```text
Transaction
TransactionPayload
Provider
TransactionType
Notification
```

gunakan kembali.

Jangan membuat duplicate type hanya untuk simulator.

Tujuannya:

```text
Existing Type
      ↑
      │
Transaction Simulator
```

bukan:

```text
Existing Type

Simulator Type
      ↓
berpotensi berbeda
```

---

# 9. Halaman Baru

Tambahkan satu halaman baru ke dashboard existing.

Nama halaman:

> **Transaction Simulator**

Gunakan routing/navigation system yang sudah digunakan project.

Jangan membuat sistem routing baru.

Cari sidebar/navigation existing kemudian tambahkan menu:

```text
Transaction Simulator
```

Gunakan icon yang sesuai dengan design system project.

---

# 10. Jangan Merombak Dashboard Existing

Jangan mengubah:

- halaman dashboard
- sidebar existing
- header existing
- authentication
- halaman transaksi existing
- API
- database
- parser
- layout global

kecuali perubahan minimum yang memang diperlukan untuk:

> menambahkan menu/route Transaction Simulator.

---

# 11. Tujuan Halaman Simulator

Halaman simulator harus memungkinkan developer memilih:

```text
Provider
Transaction Type
Product
Nominal
Customer Number
Timestamp
```

kemudian:

```text
Generate Notification
        ↓
Preview Notification
        ↓
Preview API Payload
        ↓
Send to Existing API
        ↓
Show Existing API Response
```

---

# 12. Provider Selector

UI pertama:

```text
Provider

[ ALPINES ▼ ]
```

Pilihan:

```text
ALPINES
DIGIPOS
```

Ketika provider berubah, transaction type harus mengikuti provider tersebut.

---

# 13. Transaction Type Mapping

Gunakan tipe transaksi yang memang didukung sistem existing.

Dari format transaksi yang saat ini digunakan KBF Cell, minimal simulator perlu mampu menghasilkan:

### DIGIPOS

```text
Pulsa
Paket Data
Paket Nelpon
Token PLN
```

### ALPINES

```text
Pulsa
Voucher Data
E-Wallet
Token PLN
Tagihan
```

Tetapi:

> Sebelum mengimplementasikan daftar tersebut, cek terlebih dahulu transaction type/enum/parser yang sudah ada di project.

Jika project menggunakan nama berbeda, ikuti nama existing.

---

# 14. Jangan Membuat Kombinasi Invalid

Contoh:

```text
Provider: DIGIPOS
Transaction Type: E-Wallet
```

Jika sistem existing tidak mendukung kombinasi tersebut, UI harus mencegahnya.

Gunakan mapping:

```text
DIGIPOS
 ├── Pulsa
 ├── Paket Data
 ├── Paket Nelpon
 └── Token PLN

ALPINES
 ├── Pulsa
 ├── Voucher Data
 ├── E-Wallet
 ├── Token PLN
 └── Tagihan
```

Mapping ini harus disesuaikan lagi dengan kemampuan parser existing.

---

# 15. Raw Notification Harus Realistis

Ini sangat penting.

Simulator bukan sekadar membuat:

```text
Transaksi berhasil
```

Notification harus menyerupai notification asli yang selama ini diterima KBF Cell.

Tujuannya adalah menguji:

```text
Notification
      ↓
Existing Parser
      ↓
Existing Transaction Record
```

Jadi notification harus memiliki struktur yang benar.

---

# 16. Contoh ALPINES — E-Wallet

Gunakan pola notification seperti:

```text
Saldo dana DANA200.082279141693 Berhasil. SN/Ref: NAMA:DNID-VIOXX ALYXXX/NOMINAL:200000/IDT:2026082310121481030100166859069335373. Saldo 1.937.077 - 201.150 = 1.735.927 @23/08 13:43:36
```

Dan:

```text
Saldo dana DANA10.082171536241 Berhasil. SN/Ref: NAMA:DNID-ARNXXX RATXX DEWX/NOMINAL:10000/IDT:2026082310121481030100166412471781889. Saldo 1.268.077 - 10.650 = 1.257.427 @23/08 18:51:42
```

Generator harus menghasilkan data dinamis.

---

# 17. ALPINES — Token PLN

Format:

```text
TOKEN 20000 PH20.50160790239 Berhasil. SN/Ref: 5185-7612-4324-7979-7585/LASKAR/R1/450VA/43,9kwh.. Saldo 59.527 - 22.450 = 37.077 @23/08 21:11:12
```

Generator harus bisa membuat:

```text
nominal
product code
token PLN
nama pelanggan
daya
kWh
saldo awal
total potongan
saldo akhir
timestamp
```

---

# 18. DIGIPOS — Token PLN

Format:

```text
Anda telah melakukan pembayaran PLN senilai 20000 pada 21-08-2026 15:58:04 Biaya admin 2400. ID Transaksi DGPS260821155753231533607 Saldo LinkAja 186386. Token PLN Prabayar Anda 3159 4822 1374 2540 9921. Nometer 86278933436 atas nama RUSTAM DT INDO BUMI. 43,9 kWh
```

Generator harus mempertahankan pola tersebut.

---

# 19. DIGIPOS — Pulsa

Format:

```text
Isi ulang pulsa Rp 20000 untuk no pelanggan 6285126236562 telah berhasil dengan SN 04251800000231881088 dan ID Transaksi DGPS260822194910929804414. Cek sisa stock di *181*1*5*2*PIN#.
```

Dan:

```text
Isi ulang pulsa Rp 55000 untuk no pelanggan 6282285038389 telah berhasil dengan SN 04252500000243042855 dan ID Transaksi DGPS260823163604814194074. Cek sisa stock di *181*1*5*2*PIN#. Sisa saldo Rp. 15.289,00
```

---

# 20. DIGIPOS — Paket Data

Contoh:

```text
Isi ulang paket Super Seru Internet 6282382402102 pd 22/08/2026 14:50:00 berhasil. Voucher senilai Rp30000. Nomor seri 04251200000226014462. Cek sisa stock di *181*1*5*2*PIN#.
```

Format lainnya:

```text
Transaksi pengisian paket data byU Kaget 33 GB 28 Hari 28 Hari pada 22 August 2026 04:22:29 senilai Rp72000 telah berhasil. MSISDN: 6285185491964, ID Transaksi: DGPS260822162227613053557. Sisa Saldo Rp. 174.587,00
```

---

# 21. DIGIPOS — Paket Nelpon

Contoh:

```text
Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#.
```

---

# 22. ALPINES — Pulsa

Format:

```text
Telkomsel BYU 15000 TSBYU15.085165745482 Berhasil. SN/Ref: 04252400000245405164. Saldo 1.257.427 - 15.550 = 1.241.877 @23/08 19:23:59
```

Dan:

```text
Axis Reguler 30000 AX30.083877750811 Berhasil. SN/Ref: 0092420822554939. Saldo 773.577 - 30.650 = 742.927 @22/08 11:04:47
```

---

# 23. ALPINES — Voucher Data

Contoh:

```text
VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03
```

Dan:

```text
Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref:  :1583 0278 6596 2336. Saldo 422.877 - 13150 = 409.727 @23/08 20:47:15
```

---

# 24. ALPINES — Tagihan TELKOM

Contoh:

```text
BAYAR TAGIHAN TELKOM BTEL.111452102552 Berhasil. SN/Ref: NOFRITA DEWI/1Lbr/Periode:202608/Rp.318850/979981323608A/Adm2500/RpTag316350/111452102552,. Saldo 409.727 - 319.550 = 90.177 @23/08 20:59:42
```

---

# 25. Generator Harus Dinamis

Jangan hardcode contoh di atas sebagai satu-satunya transaksi.

Buat generator berdasarkan template yang sesuai dengan parser existing.

Contoh konsep:

```text
generateDigiposPulsa()
generateDigiposPaketData()
generateDigiposPaketNelpon()
generateDigiposTokenPln()

generateAlpinesPulsa()
generateAlpinesVoucherData()
generateAlpinesEwallet()
generateAlpinesTokenPln()
generateAlpinesTagihan()
```

Gunakan data dinamis:

```text
nominal
customer number
SN
transaction ID
reference
balance
timestamp
customer name
product
```

---

# 26. Perhitungan Saldo Harus Benar

Jika notification menggunakan:

```text
Saldo A - B = C
```

pastikan:

```text
C = A - B
```

Contoh:

```text
Saldo 1.257.427 - 15.550 = 1.241.877
```

harus benar secara matematis.

Jangan menghasilkan data yang kontradiktif.

---

# 27. ID Transaksi Harus Unik

Setiap generate transaction harus menghasilkan ID baru.

Untuk Digipos gunakan format yang menyerupai:

```text
DGPS260823163604814194074
```

Jangan menggunakan ID yang sama berulang-ulang.

---

# 28. SN Harus Dinamis

SN harus dibuat berdasarkan format transaksi/provider.

Contoh:

```text
04251800000231881088
```

Token PLN:

```text
3159 4822 1374 2540 9921
```

Jangan selalu menggunakan contoh yang sama.

---

# 29. Timestamp

Simulator harus memiliki pilihan:

```text
Current Time
Custom Time
Random Time
```

Timestamp harus digunakan secara konsisten di notification.

---

# 30. UI Halaman

Gunakan design system dashboard existing.

**Jangan membuat visual language baru.**

Ikuti:

- typography
- spacing
- card
- button
- input
- select
- badge
- color
- border radius
- shadow
- responsive behavior

yang sudah digunakan dashboard.

Halaman simulator seharusnya terlihat seperti bagian native dari dashboard.

---

# 31. Struktur UI

Kurang lebih:

```text
Transaction Simulator

┌───────────────────────────────────────┐
│ Transaction Configuration             │
│                                       │
│ Provider          [ ALPINES ▼ ]      │
│ Transaction Type  [ E-Wallet ▼ ]     │
│ Product           [ DANA ▼ ]         │
│ Nominal           [ 200000 ]         │
│ Customer Number   [ 628xxxx ]        │
│ Timestamp         [ Current Time ]   │
│                                       │
│ [ Generate Notification ]             │
└───────────────────────────────────────┘


┌───────────────────────────────────────┐
│ Generated Notification                │
│                                       │
│ Saldo dana DANA...                    │
│                                       │
│ [ Copy ]                              │
└───────────────────────────────────────┘


┌───────────────────────────────────────┐
│ API Payload                           │
│                                       │
│ {                                    │
│   ...                                 │
│ }                                     │
│                                       │
│ [ Send to Backend ]                   │
└───────────────────────────────────────┘


┌───────────────────────────────────────┐
│ API Response                          │
│                                       │
│ HTTP 200                              │
│                                       │
│ { ... }                               │
└───────────────────────────────────────┘
```

---

# 32. Preview Payload

Sebelum dikirim, tampilkan payload sebenarnya yang akan dikirim ke existing API.

Ini penting untuk debugging.

Contoh:

```json
{
  "provider": "alpines",
  "...": "..."
}
```

Sekali lagi:

> Struktur JSON di atas hanya ilustrasi.

Gunakan payload sebenarnya yang ditemukan dari API existing.

---

# 33. Tombol Send

Ketika user menekan:

```text
Send to Backend
```

langsung gunakan API existing.

Flow:

```text
Validate
   ↓
Build Existing API Payload
   ↓
POST Existing API
   ↓
Receive Response
   ↓
Display Result
```

Tidak boleh ada fake response.

---

# 34. Success

Jika backend benar-benar berhasil:

```text
✓ Transaction sent successfully

HTTP 200
Response time: 182ms
```

Tampilkan response backend.

---

# 35. Error

Jika API mengembalikan:

```text
400
401
403
404
405
422
500
```

tampilkan error sebenarnya.

Contoh:

```text
✕ Request failed

HTTP 405

Method Not Allowed
```

Jangan mengganti error backend dengan pesan generik.

---

# 36. Request History

Tambahkan history di halaman.

Setiap request mencatat:

```text
Time
Provider
Transaction Type
HTTP Status
Duration
Status
```

Contoh:

```text
03:14:21
ALPINES · E-WALLET
200
182ms
SUCCESS
```

Klik item dapat membuka detail request/response.

---

# 37. Preset

Sediakan preset transaksi berdasarkan contoh nyata.

Minimal:

```text
ALPINES — DANA 200K
ALPINES — DANA 10K
ALPINES — TOKEN PLN
ALPINES — PULSA TELKOMSEL
ALPINES — VOUCHER DATA
ALPINES — TELKOM

DIGIPOS — PLN 20K
DIGIPOS — PLN 100K
DIGIPOS — PULSA 20K
DIGIPOS — PULSA 55K
DIGIPOS — PAKET DATA
DIGIPOS — TALKMANIA
```

Preset hanya mengisi konfigurasi.

Tetap generate ID/SN/timestamp baru.

---

# 38. Random Transaction

Tambahkan tombol:

```text
Generate Random Transaction
```

Tetapi random harus tetap mengikuti kombinasi valid.

Contoh:

```text
ALPINES
    ↓
E-Wallet
    ↓
DANA
    ↓
Rp200.000
```

atau:

```text
DIGIPOS
    ↓
Pulsa
    ↓
Telkomsel
    ↓
Rp20.000
```

---

# 39. Batch Test

Jika API existing aman digunakan untuk testing batch, tambahkan:

```text
Batch Test

Number of transactions
[ 10 ]

Delay
[ 500 ms ]

[ Start Batch ]
```

Setiap request tetap melewati API existing.

Jangan membuat endpoint batch baru.

---

# 40. Verifikasi Parser Existing

Ini bagian yang sangat penting.

Setelah notification dikirim, jangan hanya memeriksa:

```text
HTTP 200
```

Periksa juga hasil akhirnya di dashboard/database.

Contoh:

```text
Generate notification
        ↓
Send existing API
        ↓
Existing parser
        ↓
Database
        ↓
Transaction appears in dashboard
```

Pastikan parser existing dapat membaca notification simulator.

---

# 41. Jika Parser Gagal

Jika notification simulator menghasilkan:

```text
HTTP 200
```

tetapi parser tidak berhasil membuat transaksi:

**jangan memperbaiki parser/backend.**

Cari penyebab dari notification yang dihasilkan simulator.

Sesuaikan generator dengan format notification asli.

Tujuan simulator adalah:

> meniru input notification nyata.

Bukan memaksa backend menerima format baru.

---

# 42. Jangan Mengubah Parser Existing

Parser transaksi merupakan bagian existing system.

Jangan:

```text
modify parser
add simulator condition
if source === simulator
```

Jangan membuat:

```text
if simulator:
   bypass parser
```

Tidak boleh.

Simulator harus melalui jalur normal.

---

# 43. Tidak Boleh Ada Simulator Bypass

Jangan melakukan:

```text
Simulator
   ↓
Direct Database Insert
```

atau:

```text
Simulator
   ↓
Special Simulator API
```

atau:

```text
Simulator
   ↓
Database
```

Yang benar:

```text
Simulator
   ↓
Existing Transaction API
   ↓
Existing Backend
   ↓
Existing Parser
   ↓
Existing Database
```

---

# 44. Jangan Menyentuh Bagian Project yang Tidak Perlu

Perubahan harus terbatas pada:

```text
1. halaman Transaction Simulator
2. component simulator
3. transaction generator
4. notification template/generator
5. API client integration menggunakan API existing
6. navigation entry
7. type/helper tambahan jika memang diperlukan
```

Jangan refactor project besar-besaran.

Jangan mengubah:

```text
database
backend
existing transaction flow
existing parser
existing authentication
existing dashboard
```

---

# 45. Reuse Existing Components

Sebelum membuat:

```text
Button
Input
Select
Card
Modal
Toast
Code Viewer
Table
Badge
```

cari apakah project sudah memiliki component tersebut.

Jika ada:

> gunakan component existing.

Jangan membuat duplicate component.

---

# 46. Reuse Existing API Client

Cari apakah project sudah memiliki:

```text
fetch wrapper
axios instance
API client
server action
query client
HTTP helper
```

Jika sudah ada, gunakan itu.

Jangan membuat:

```text
new axios instance
```

atau:

```text
new fetch wrapper
```

jika sebenarnya sudah tersedia.

---

# 47. Reuse Existing Authentication

Simulator harus otomatis mengikuti authentication existing.

Jangan membuat:

```text
simulator login
simulator token
simulator authentication
```

Gunakan session/token mechanism yang sudah digunakan dashboard.

---

# 48. Responsive

Halaman harus bekerja pada:

```text
Desktop
Laptop
Tablet
```

Prioritaskan desktop karena dashboard merupakan aplikasi monitoring.

---

# 49. Developer Experience

Karena ini merupakan simulator internal/developer tool, tampilkan informasi debugging dengan jelas:

```text
Generated Notification
API Payload
HTTP Method
Endpoint
Response Status
Response Body
Request Duration
```

Namun tetap mengikuti design system dashboard agar tidak terlihat seperti halaman debug mentah.

---

# 50. Acceptance Test

Sebelum menyatakan selesai, lakukan test berikut.

## ALPINES

- [ ] E-Wallet DANA Rp200.000
- [ ] E-Wallet DANA Rp10.000
- [ ] Token PLN Rp20.000
- [ ] Pulsa Telkomsel/by.U Rp15.000
- [ ] Pulsa Axis Rp30.000
- [ ] Voucher Data AIGO
- [ ] Voucher Data Three
- [ ] Tagihan TELKOM

## DIGIPOS

- [ ] Token PLN Rp20.000
- [ ] Token PLN Rp100.000
- [ ] Pulsa Rp20.000
- [ ] Pulsa Rp55.000
- [ ] Paket Data Super Seru
- [ ] Paket Data by.U
- [ ] Paket Nelpon Talkmania

Untuk setiap test:

```text
Generate
   ↓
Preview
   ↓
Send
   ↓
Existing API
   ↓
Existing parser
   ↓
Database
   ↓
Dashboard
```

---

# 51. Acceptance Criteria Utama

Implementasi dinyatakan berhasil jika:

- [ ] Halaman simulator muncul di dashboard existing.
- [ ] Navigation existing tetap berfungsi.
- [ ] Tidak ada backend baru.
- [ ] Tidak ada API baru.
- [ ] Tidak ada database baru.
- [ ] Tidak ada migration baru.
- [ ] Tidak ada parser baru.
- [ ] Existing API digunakan.
- [ ] Existing authentication digunakan.
- [ ] Existing API client digunakan jika tersedia.
- [ ] Existing components digunakan jika tersedia.
- [ ] Provider selalu dikirim.
- [ ] Provider hanya `digipos` atau `alpines`.
- [ ] Transaction type sesuai provider.
- [ ] Notification mengikuti format nyata.
- [ ] ID transaksi dinamis.
- [ ] SN/reference dinamis.
- [ ] Timestamp dinamis.
- [ ] Perhitungan saldo benar.
- [ ] Payload mengikuti API contract existing.
- [ ] HTTP response ditampilkan.
- [ ] Error ditampilkan dengan jelas.
- [ ] Request history tersedia.
- [ ] Preset tersedia.
- [ ] Random transaction tersedia.
- [ ] Hasil transaksi dapat diverifikasi melalui sistem existing.

---

# 52. Urutan Kerja Agent

WAJIB mengikuti urutan ini.

### STEP 1 — Audit

Baca repository.

Cari:

```text
API
transaction
notification
provider
Digipos
Alpines
database
parser
types
components
navigation
authentication
```

---

### STEP 2 — Dokumentasikan Temuan

Sebelum coding, identifikasi:

```text
Existing transaction API:
...

HTTP method:
...

Existing payload:
...

Provider definition:
...

Transaction type definition:
...

Database model:
...

Existing API client:
...

Existing UI components:
...

Navigation:
...
```

Tidak perlu membuat dokumentasi file baru. Cukup pahami dan gunakan hasil audit tersebut.

---

### STEP 3 — Implement Generator

Buat generator notification sesuai format existing parser.

---

### STEP 4 — Implement Halaman

Tambahkan route/page:

```text
Transaction Simulator
```

---

### STEP 5 — Integrasikan Existing API

Gunakan API yang ditemukan pada STEP 1.

---

### STEP 6 — Test

Test semua provider dan transaction type.

---

### STEP 7 — Verify Database

Pastikan transaksi benar-benar diproses oleh sistem existing.

---

### STEP 8 — Final Review

Periksa git diff.

Pastikan perubahan hanya terkait fitur simulator.

---

# 53. Aturan Final untuk Agent

**Jangan mengarang arsitektur baru.**

**Jangan membuat API baru.**

**Jangan membuat database baru.**

**Jangan membuat schema baru.**

**Jangan membuat parser baru.**

**Jangan bypass parser existing.**

**Jangan insert langsung ke database.**

**Jangan membuat fake success.**

**Jangan membuat payload berdasarkan asumsi.**

**Jangan membuat type duplicate jika type existing sudah tersedia.**

**Jangan membuat component duplicate jika component existing sudah tersedia.**

**Jangan merombak dashboard existing.**

**Baca repository terlebih dahulu.**

**Cari API existing.**

**Cari schema existing.**

**Cari parser existing.**

**Cari provider existing.**

**Cari transaction type existing.**

**Cari API client existing.**

**Cari component existing.**

Kemudian implementasikan **satu halaman Transaction Simulator** yang menggunakan seluruh sistem existing tersebut.

Arsitektur final yang diinginkan:

```text
┌──────────────────────────────────────┐
│ EXISTING KBF CELL DASHBOARD          │
│                                      │
│  Sidebar                             │
│   ├── Dashboard                      │
│   ├── Transactions                   │
│   ├── ...                            │
│   └── Transaction Simulator  ← NEW   │
│                                      │
└──────────────────┬───────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Transaction         │
        │ Simulator Page      │
        └──────────┬──────────┘
                   │
                   │ Generate
                   ▼
        ┌─────────────────────┐
        │ Realistic Raw       │
        │ Notification        │
        └──────────┬──────────┘
                   │
                   │ Existing API
                   ▼
        ┌─────────────────────┐
        │ EXISTING BACKEND    │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ EXISTING PARSER     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ EXISTING DATABASE   │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ EXISTING DASHBOARD │
        └─────────────────────┘
```

**Intinya: fitur baru hanya berada di layer dashboard/frontend. Sistem backend, API, parser, dan database yang sudah ada harus dimanfaatkan sepenuhnya.**