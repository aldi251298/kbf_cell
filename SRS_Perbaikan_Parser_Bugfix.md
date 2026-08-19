# SRS — Perbaikan Parser, Validasi Ingest, & Bugfix Dashboard
### Fase 2.1: Hardening Parser & Perbaikan Bug Ditemukan Saat Testing

**Versi:** 1.0
**Target pembaca:** AI coding agent
**Konteks:** Perbaikan atas hasil testing web simulator terhadap `Instruksi_Backend_Supabase_Simulator.md`. Dokumen ini **tidak menggantikan** dokumen sebelumnya, hanya menambal masalah yang ditemukan.

---

## 1. Masalah Inti: Parser & Validasi Terlalu Kaku

Saat ini sistem menolak/gagal memproses kombinasi provider+jenis transaksi yang belum "dikenal" secara eksplisit (mis. PLN Digipos, Pulsa/Paket Data via Alpines gagal terkirim). Ini salah arsitektur. Perbaiki dengan memisahkan dua tanggung jawab yang sejauh ini tercampur:

- **Validasi di endpoint ingest** harus **generik berbasis skema field**, bukan berbasis daftar kombinasi provider+jenis yang di-whitelist.
- **Parsing/generate teks notifikasi** (di web simulator maupun nanti di Android) boleh spesifik per template, tapi kegagalan mengenali satu template **tidak boleh** membuat seluruh sistem menolak data — harus jatuh ke mekanisme fallback (Bagian 3).

---

## 2. Field Generik yang Dibutuhkan Dashboard (Kontrak Wajib)

Ini daftar final field yang **wajib bisa terisi** untuk transaksi apa pun, dari provider dan jenis apa pun. Endpoint ingest hanya boleh menolak payload jika field-field generik ini tidak lengkap/salah tipe — **tidak boleh menolak berdasarkan isi/kombinasi nilainya**.

| Field | Wajib ada? | Tipe | Catatan |
|---|---|---|---|
| `provider` | Ya | string | `digipos` / `alpines`, bebas nilai lain untuk provider baru di masa depan |
| `jenis_transaksi` | Ya | string bebas | **Jangan divalidasi terhadap enum tertutup.** Nilai umum: `pulsa`, `paket_data`, `pln`, `ewallet` |
| `nama_produk` | Tidak (nullable) | string | Diisi untuk paket data (nama paketnya), e-wallet (nama e-wallet: DANA/GoPay/OVO/dst), voucher. Kosong untuk pulsa & PLN. |
| `nominal` | Ya | number > 0 | Field paling kritis, wajib benar di semua jenis transaksi |
| `nomor_tujuan` | Tidak (nullable) | string | **Hanya untuk pulsa & e-wallet** (nomor HP/akun). PLN & paket data tidak punya nomor HP relevan untuk ditampilkan (lihat Bagian 4). |
| `status` | Ya | string | Dinormalisasi ke `sukses` / `gagal` / `pending` |
| `device_id` | Ya | UUID | Harus valid, ada di tabel `perangkat` |
| `waktu_transaksi` | Ya | timestamp | Sumber: waktu simulasi/notifikasi di-capture, BUKAN hasil parsing teks |
| `sn` | Tidak (nullable) | string | Hanya ada di pulsa Digipos |
| `raw_notification_text` | Ya | string | Selalu simpan apa adanya |
| `detail_tambahan` | Tidak (nullable) | JSON | Arsip field non-generik (token PLN, REFF, biaya admin, dst) — **tidak ditampilkan di dashboard** |

**Perbaikan wajib di endpoint `/api/ingest/transaksi`:** ganti skema validasi (Zod atau sejenis) agar hanya memeriksa tabel di atas — hapus validasi apa pun yang menolak berdasarkan kombinasi `provider` + `jenis_transaksi` yang tidak dikenal.

---

## 3. Parser Harus Berlapis & Tidak Pernah Menolak Data

Susun logic parsing (di web simulator sekarang, di Android nanti) dengan urutan pengecekan berikut, berhenti di lapis pertama yang cocok:

1. **Parser spesifik per template yang sudah dikonfirmasi:** Digipos-Pulsa, Digipos-PaketData, Digipos-PLN, Alpines-Generic (mencakup e-wallet/DANA, voucher, paket data, pulsa operator lain).
2. **Fallback generik universal** — kalau tidak ada parser spesifik yang cocok (jenis transaksi baru/belum dikenal, dari provider mana pun): tarik nominal via pola `Rp\d+`/angka besar, status via keyword `berhasil`/`gagal`/`Berhasil`/`GAGAL`, ID transaksi/referensi via keyword `ID Transaksi`/`REFF`, nomor tujuan via pola digit 10-13 karakter jika ada. Field yang tidak ketemu → biarkan kosong/null, **jangan gagalkan proses**.
3. Hasil dari fallback ditandai `"perlu_review": true` di `detail_tambahan`, dan `jenis_transaksi` diisi `"belum_dikenal"` atau nilai terbaik yang bisa ditebak dari teks.

**Prinsip mutlak: transaksi TIDAK PERNAH ditolak/hilang hanya karena parser tidak mengenali formatnya.** Data selalu tersimpan, minimal dengan raw text-nya, meski field lain kosong.

---

## 4. Logic Penentuan Field yang Ditampilkan per Jenis Transaksi (Frontend)

Parser & frontend harus **cerdas membedakan jenis transaksi** dan menampilkan field yang relevan saja. Berikut aturan pemetaan wajib:

| Jenis Transaksi | `nomor_tujuan` ditampilkan? | `nama_produk` ditampilkan? | Label nomor tujuan |
|---|---|---|---|
| Pulsa | Ya | Tidak (tampilkan "Isi Ulang Pulsa" sebagai label generik) | "Nomor HP" |
| Paket Data | Ya | **Ya, wajib** (nama paket) | "Nomor HP" |
| PLN | **Tidak** — ganti tampilan ke nomor meter dari `detail_tambahan` jika ada, atau disembunyikan jika tidak relevan ditampilkan | Tidak | "Nomor Meter" (jika field ini nanti dipindah ke kolom generik) atau sembunyikan |
| E-wallet (Alpines) | Ya | **Ya, wajib** (nama e-wallet: DANA/GoPay/OVO/dst) | "Nomor Tujuan" |

**Instruksi implementasi:**
- Buat fungsi util terpusat (mis. `getTampilanTransaksi(transaksi)`) yang menerima satu baris data transaksi dan mengembalikan objek berisi: label nomor tujuan yang sesuai, apakah nomor tujuan perlu ditampilkan, apakah nama produk perlu ditampilkan, dan label jenis transaksi yang mudah dibaca manusia (mis. `pulsa` → "Isi Ulang Pulsa", `ewallet` → "Top Up E-Wallet"). Semua komponen tabel/kartu yang menampilkan transaksi **wajib memanggil fungsi ini**, bukan menulis logic if-else sendiri-sendiri di tiap komponen — mencegah bug tidak konsisten seperti yang terjadi sekarang.
- Field `detail_tambahan` (SN, REFF, token, biaya admin, saldo) **tidak ditampilkan di UI manapun** untuk fase ini.
- Tambahkan badge/indikator visual jenis transaksi per baris menggunakan label dari fungsi util di atas.

---

## 5. Bugfix Tambahan Ditemukan Saat Testing

### 5.1 `RangeError: Invalid time value` di `src/app/page.tsx:117` (agregasi omzet bulanan)
- **Penyebab:** ada baris transaksi tersimpan dengan `waktu_transaksi` NULL (dari testing sebelum field ini diwajibkan).
- **Perbaikan kode:** sebelum `Intl.DateTimeFormat().format(item.tanggal)`, validasi dulu `item.tanggal` adalah Date valid; kalau tidak, skip baris tersebut dari agregasi, jangan biarkan crash.
- **Perbaikan data:** hapus baris transaksi testing lama yang `waktu_transaksi`-nya NULL dari Supabase.
- **Perbaikan skema:** pastikan kolom `waktu_transaksi` di tabel `transaksi` diberi constraint `NOT NULL`, sehingga payload tanpa field ini ditolak sejak di endpoint ingest, bukan lolos dan merusak dashboard belakangan.

### 5.2 Hydration error — `<tr>` bukan anak langsung struktur tabel valid (`src/app/page.tsx` sekitar baris 785)
- Periksa JSX tabel ringkasan/omzet: pastikan setiap `<TableRow>` selalu langsung di dalam `<TableBody>` (atau `<TableHeader>`/`<TableFooter>`), tanpa elemen pembungkus lain (`<div>`, fragment salah, conditional rendering) yang menyisip di antaranya.
- Cek apakah ada `.map()` yang merender `<TableRow>` tapi dipanggil di luar `<TableBody>`, atau loading/empty state yang salah ditempatkan di dalam struktur tabel alih-alih menggantikan seluruh isi `<TableBody>`.

---

## 6. Kriteria Selesai

1. Endpoint ingest menerima payload apa pun selama field generik di Bagian 2 lengkap & bertipe benar — tidak ada penolakan berbasis kombinasi provider/jenis.
2. Simulator berhasil generate & mengirim seluruh kombinasi: Digipos-Pulsa, Digipos-PaketData, Digipos-PLN, Alpines (DANA/voucher/paket data/pulsa lain) — semua tersimpan tanpa error.
3. Kirim payload dengan `jenis_transaksi` acak/belum dikenal (simulasi manual) — data tetap tersimpan lewat fallback, ditandai `perlu_review: true`, tidak error.
4. Dashboard menampilkan field yang tepat sesuai jenis transaksi (nomor HP hanya untuk pulsa/ewallet, nama produk untuk paket data/ewallet, dst) — diverifikasi lewat fungsi util terpusat, bukan logic tersebar.
5. Kedua bug di Bagian 5 tidak muncul lagi saat dashboard dibuka dengan data campuran dari seluruh jenis transaksi.
