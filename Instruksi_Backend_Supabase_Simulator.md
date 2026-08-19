# Instruksi Implementasi — Setup Backend/Supabase & Web Simulator Transaksi (Fokus: Transaksi Berhasil)

**Target pembaca:** AI coding agent
**Konteks:** Lanjutan dari SRS Fase 2 (Backend). Dokumen ini instruksi teknis konkret untuk (A) setup Supabase dengan kredensial yang sudah ada, (B) implementasi skema database & parsing notifikasi (Digipos-Pulsa, Digipos-PaketData, Alpines-DANA) untuk transaksi **berhasil**, dan (C) membangun simulator berbasis web untuk testing cepat, tanpa perlu aplikasi Android dulu.

**Catatan penting sebelum mulai:** Metode deteksi transaksi sudah direvisi dari rencana awal — **BUKAN Accessibility Service**, melainkan **Notification Listener** (primary) + **SMS Receiver** (backup), karena Digipos memblokir aplikasi saat Developer Options aktif yang notabene dibutuhkan Accessibility Service.

**Ruang lingkup fase ini dipersempit secara sengaja:**
- **Hanya menangani transaksi berhasil/sukses** untuk ketiga template (Digipos-Pulsa, Digipos-PaketData, Alpines-DANA). Parsing & simulasi untuk transaksi gagal **ditunda** sampai sample notifikasi gagal tersedia — jangan menebak formatnya. Kolom `status` tetap ada di skema (untuk kesiapan struktur), tapi untuk sekarang nilainya akan selalu `sukses` dari jalur testing manapun.
- **Aplikasi Android (baik Notification Listener produksi maupun mini app simulator native) ditunda dulu.** Untuk memverifikasi backend & parsing bekerja benar, dipakai **simulator berbasis web** yang berjalan di dalam project Next.js yang sama — jauh lebih cepat untuk iterasi karena tidak perlu build APK & install ke device tiap kali ada perubahan.
- Prioritas fase ini: **pastikan endpoint ingest bekerja, logic parsing regex per template menghasilkan field yang tepat, data tersimpan benar di Supabase, dan field yang dipakai identik dengan tipe data yang sudah ada di frontend Fase 1.**

---

## A. Setup Environment & Supabase

### A.1 Environment Variables

Kredensial berikut sudah tersedia dari pemilik project:

```
NEXT_PUBLIC_SUPABASE_URL=https://hnbmyqaruegzpzhoyhom.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vJ5RLvsfQhDJ80UcFZscKg_YevIIKUW
```

Masukkan ke `.env.local` (jangan commit file ini ke git — pastikan sudah ada di `.gitignore`). Ini adalah **publishable key** (format key generasi baru Supabase, setara dengan anon key lama) — aman dipakai di sisi client/browser, tapi hanya bisa akses data sesuai RLS policy yang aktif.

**Yang MASIH KURANG dan wajib diminta ke pemilik project sebelum lanjut ke bagian ingest endpoint:**
- **Service Role Key** — dibutuhkan di server-side untuk endpoint ingest, karena request dari device Android tidak punya sesi login pemilik (tidak lewat Supabase Auth), sehingga tidak bisa insert data lewat publishable key yang tunduk ke RLS. Ambil dari Supabase Dashboard → Project Settings → API → `service_role` key (secret key generasi baru). Simpan sebagai `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`, **JANGAN PERNAH** diberi prefix `NEXT_PUBLIC_` karena itu akan membocorkannya ke bundle browser.

Agent harus **berhenti dan meminta key ini secara eksplisit ke pemilik project** jika belum tersedia — jangan melanjutkan implementasi endpoint ingest tanpa service role key ini, dan jangan mencoba pakai publishable key untuk operasi yang butuh bypass RLS.

Selain itu, generate sendiri secret berikut (agent boleh generate random string yang cukup panjang & acak):
- `INGEST_API_SECRET` — shared secret untuk autentikasi request dari aplikasi Android (dan mini app simulator) ke endpoint ingest. Simpan di `.env.local`, dokumentasikan di `.env.example` tanpa nilai asli.

Update `.env.example` agar mencantumkan seluruh variable di atas (nama saja + komentar kegunaan, tanpa nilai asli), supaya siapa pun yang setup project baru tahu apa yang perlu diisi.

### A.2 Setup Client Supabase

Buat dua client Supabase terpisah dengan tanggung jawab jelas:
- **Client-side/browser client**: pakai publishable key, dipakai di server component untuk baca data dashboard dan di client component untuk subscription realtime.
- **Server-only/admin client**: pakai service role key, **hanya boleh diimport dan dipakai di kode yang berjalan di server** (API routes, server actions) — pastikan tidak pernah ter-bundle ke kode client. Tambahkan pengaman agar file ini tidak sengaja diimport dari komponen client (mis. penamaan file yang jelas seperti `supabase-admin.ts`, dan review manual sebelum lanjut bahwa tidak ada `"use client"` file yang mengimpornya).

---

## B. Skema Database

Buat tabel-tabel berikut di Supabase (lewat SQL editor Supabase atau migration file yang disimpan di repo untuk versioning — disarankan yang kedua agar skema tetap tercatat di git).

### B.1 Tabel `konter`
Merepresentasikan 3 lokasi konter. Kolom minimal: identitas unik, nama/label konter, waktu dibuat.

### B.2 Tabel `perangkat`
Merepresentasikan HP yang terpasang di tiap konter. Kolom minimal: identitas unik, relasi ke `konter`, label/nama device, waktu heartbeat terakhir, waktu dibuat. Status online/offline **dihitung dari waktu heartbeat terakhir**, bukan disimpan sebagai kolom status statis.

### B.3 Tabel `transaksi`
Ini tabel inti. Rancang kolom berdasarkan struktur notifikasi Digipos yang sudah dikonfirmasi dari sample nyata:

> `"Isi ulang pulsa Rp 20000 untuk no pelanggan 628519142467 berhasil dengan SN 07713999331934769210 dan ID Transaksi DGPS260726164455775705549"`

**Konfirmasi penting dari lapangan:** Digipos dipakai untuk **pulsa DAN paket data** (dua template notifikasi berbeda), Alpines dipakai **khusus top-up e-wallet DANA** (satu template, kemungkinan besar tidak ada varian e-wallet lain di konter ini). Jadi minimal ada **3 template notifikasi dikenal**: Digipos-Pulsa, Digipos-PaketData, Alpines-DANA. Skema harus cukup fleksibel menampung ketiganya tanpa kolom wajib yang cuma relevan ke salah satu template.

Kolom yang wajib ada:
- **provider** — penanda asal notifikasi (`digipos` / `alpines`), karena formatnya beda per provider dan akan makin banyak provider di masa depan.
- **id_transaksi_provider** — ID transaksi/referensi asli dari notifikasi (contoh Digipos: `DGPS260726164455775705549`; untuk Alpines kemungkinan diambil dari bagian `REFF:` pada string SN/Ref — konfirmasi dulu apakah REFF ini selalu unik & konsisten formatnya sebelum difinalisasi). Ini adalah **kandidat utama unique constraint dedup**.
- **sn** — serial number dari notifikasi. **Nullable** — transaksi paket data Digipos tidak menyertakan SN sama sekali, hanya transaksi pulsa yang punya field ini.
- **jenis_transaksi** — jenis produk secara umum (mis. `pulsa`, `paket_data`, `ewallet_dana`) — gunakan text/varchar atau enum yang mudah ditambah, karena akan terus berkembang.
- **nama_produk** — nama produk spesifik (mis. `byU Kaget 11GB 28 Hari 28 Hari`). **Nullable** — hanya relevan untuk paket data, kosong untuk transaksi pulsa/e-wallet. Simpan apa adanya termasuk kalau ada teks yang tampak terduplikasi di dalamnya (itu memang format asli dari provider, jangan dibersihkan/diasumsikan salah ketik oleh parsing).
- **nominal** — nilai transaksi dalam Rupiah, tipe numeric/integer (bukan text), agar bisa langsung dipakai agregasi laporan. Perhatikan posisi angka ini beda-beda di tiap template teks asli (`Rp 20000` dengan spasi di notif pulsa, `Rp41800` tanpa spasi di notif paket data, `50000` di dalam string SN/Ref pada notif Alpines) — regex per template harus menangani masing-masing secara eksplisit, jangan pakai satu pola universal.
- **nomor_tujuan** — nomor pelanggan/MSISDN tujuan transaksi (istilah di teks beda-beda: "no pelanggan" di notif pulsa, "MSISDN" di notif paket data, nomor yang menempel di string pada notif Alpines — semua merujuk field yang sama secara semantik, satukan ke kolom ini).
- **status** — sukses/gagal/pending. Kata kunci status di teks juga beda posisi/frasa per template (`berhasil` di tengah kalimat notif pulsa, `telah berhasil` di notif paket data, `Berhasil` di awal kalimat notif Alpines) — jangan asumsikan satu keyword generik cukup untuk semua, tapi tetap normalisasi ke satu set nilai standar (`sukses`/`gagal`/`pending`) sebelum masuk kolom ini.
- **device_id** — relasi ke tabel `perangkat`, menunjukkan device asal transaksi.
- **raw_notification_text** — simpan **teks mentah notifikasi asli apa adanya**, tanpa terkecuali. Ini penting untuk debugging saat regex parsing meleset, memungkinkan re-parsing di masa depan, dan jadi tempat aman menyimpan detail yang belum tentu perlu kolom terpisah (mis. detail perhitungan saldo pada notif Alpines yang formatnya masih ambigu — tidak wajib di-parse jadi kolom kecuali dashboard memang butuh menampilkan saldo e-wallet, yang berarti nambah scope dan perlu dikonfirmasi terpisah).
- **waktu_transaksi** — timestamp transaksi. **Sumber utama nilai ini adalah waktu notifikasi di-capture oleh Android (`notification.postTime`), bukan hasil parsing tanggal dari teks** — karena tidak semua template menyertakan tanggal/waktu di teksnya (notif pulsa Digipos tidak ada), dan yang menyertakan pun formatnya berbeda-beda dan berisiko salah parse locale. Tanggal dari teks (kalau ada) cukup tersimpan sebagai bagian dari `raw_notification_text`.
- **created_at** — timestamp saat data masuk ke database (bisa beda dengan `waktu_transaksi` kalau ada delay pengiriman/retry).

Ketentuan wajib:
- **Unique constraint** pada kombinasi `(provider, id_transaksi_provider)` — ini mencegah duplikat akibat notifikasi yang ke-capture dua kali oleh Notification Listener maupun akibat retry pengiriman dari Android saat koneksi putus.
- **Index** pada `waktu_transaksi`, `status`, dan `device_id` karena kolom-kolom ini akan sering dipakai untuk filter & sort di dashboard.
- **RLS aktif**: policy select hanya untuk role authenticated (pemilik login). Insert/update **tidak lewat RLS publishable key sama sekali** — endpoint ingest pakai service role key yang otomatis bypass RLS, jadi tidak perlu bikin policy insert untuk anon/public.

### B.4 Realtime
Aktifkan Supabase Realtime (publication) untuk tabel `transaksi` dan `perangkat`, agar dashboard bisa menerima update langsung sesuai yang sudah dirancang di SRS Fase 2.

---

## C. Endpoint Ingest & Parsing

### C.1 Endpoint `POST /api/ingest/transaksi`

Alur wajib:
1. Validasi header berisi `INGEST_API_SECRET` — tolak request tanpa/salah secret dengan response 401, jangan proses lebih jauh.
2. Validasi bentuk payload pakai schema validation (mis. Zod) — pastikan field wajib ada dan bertipe benar sebelum masuk ke logic manapun.
3. Insert ke tabel `transaksi` pakai service role client, dengan strategi **upsert berbasis unique constraint** `(provider, id_transaksi_provider)` — kalau data sudah ada (duplikat dari retry), jangan insert ulang dan jangan lempar error yang bikin Android app bingung harus retry lagi; kembalikan response sukses yang menandakan "sudah tersimpan sebelumnya" secara eksplisit di response body, supaya sisi client (Android/simulator) tahu bedanya insert baru vs duplikat terdeteksi (berguna untuk debugging saat testing).
4. Selalu simpan `raw_notification_text` apa adanya, terlepas dari hasil parsing berhasil sempurna atau tidak.

### C.2 Payload yang Dikirim ke Endpoint Ingest

**Penting — tentukan pembagian tanggung jawab parsing dengan jelas:** parsing regex teks notifikasi mentah menjadi field terstruktur (nominal, nomor tujuan, SN, ID transaksi, status, nama produk) tetap dirancang sebagai **modul terpisah dan murni (pure functions)**, bukan tercampur dengan logic endpoint API. Alasannya dua: (1) di fase produksi nanti, logic ini yang akan **diporting ke Kotlin** untuk dipakai di Notification Listener Android — supaya proses porting gampang, pola regex & struktur parsing di TypeScript sekarang harus jelas, terdokumentasi, dan satu fungsi per template; (2) memungkinkan modul ini dipakai bersama oleh web simulator (Bagian D) untuk preview hasil parsing sebelum dikirim ke backend.

**Untuk fase ini, modul parsing dijalankan di sisi web simulator (bagian dari project Next.js, dev-only)**, BUKAN di endpoint ingest produksi. Endpoint ingest tetap didesain untuk menerima **payload terstruktur** (bukan teks mentah yang perlu di-parse ulang oleh backend) — ini konsisten dengan rencana jangka panjang bahwa parsing dilakukan dekat sumber data (nanti oleh Android, untuk sekarang oleh web simulator sebagai pengganti sementara), dan backend production tidak perlu tahu cara parsing sama sekali.

**Parsing bukan 1 template per provider, tapi 1 template per kombinasi provider + jenis transaksi.** Untuk fase ini, cakupannya **hanya 3 template, hanya untuk status berhasil**: Digipos-Pulsa (berhasil), Digipos-PaketData (berhasil), Alpines-DANA (berhasil). Rancang modul ini modular (mis. daftar parser dengan fungsi "apakah teks ini cocok?" dan "ekstrak field dari teks ini" per template), supaya menambah template baru (termasuk varian gagal nanti) tidak perlu bongkar logic yang sudah ada — cukup tambah satu entri baru ke daftar.

**Wajib disamakan dengan tipe data frontend:** sebelum menulis satu fungsi parser pun, buka kembali definisi tipe `Transaksi` (atau sejenisnya) yang sudah ada di frontend Fase 1, dan pastikan nama field, tipe data, dan format nilai yang dihasilkan modul parsing ini **identik** dengan yang sudah dipakai komponen UI — jangan menciptakan nama field baru yang berbeda dari yang sudah ada, supaya layer service (Bagian C.4) bisa menyambungkan data asli tanpa penyesuaian nama field di sana-sini.

Jadi payload endpoint ingest berisi field terstruktur (provider, jenis_transaksi, nominal, nomor_tujuan, status, sn, id_transaksi_provider, device_id, waktu_transaksi, raw_notification_text) — backend hanya validasi bentuk data ini, tidak melakukan regex parsing dari teks mentah.

**Implikasi untuk web simulator (Bagian D):** karena parsing untuk fase ini dijalankan di sisi web simulator (bukan Android), simulator akan **men-generate teks notifikasi mentah**, menjalankannya lewat modul parsing yang sama, menampilkan hasil parsing sebagai preview, baru kemudian mengirim **payload terstruktur hasil parsing tersebut** ke endpoint ingest. Ini menguji dua hal sekaligus dalam satu alur: apakah modul parsing menghasilkan field yang benar, dan apakah endpoint ingest menyimpan data itu dengan benar.

### C.3 Endpoint `POST /api/ingest/heartbeat`

Alur: terima identitas device, validasi secret sama seperti ingest transaksi, upsert waktu heartbeat terakhir ke tabel `perangkat`. Threshold berapa lama tanpa heartbeat dianggap "offline" — jadikan konstanta terpusat di kode (bukan angka tersebar di banyak file), nilai awal yang masuk akal misalnya beberapa menit, bisa disesuaikan setelah observasi pola pengiriman heartbeat asli. **Untuk fase ini, cukup sediakan endpoint-nya dan bisa dites manual lewat web simulator (tombol terpisah "Kirim Heartbeat" per device) — tidak perlu logic canggih dulu.**

### C.4 Menyambungkan ke Layer Service Frontend

Sesuai SRS Fase 2 Bagian 5 — ganti implementasi internal fungsi service yang sebelumnya pakai fake data generator, agar sekarang membaca dari tabel `transaksi`/`perangkat` di Supabase. Jangan ubah kontrak fungsi yang sudah dipakai komponen UI. **Ini adalah cara utama memverifikasi keberhasilan fase ini secara menyeluruh: kirim beberapa transaksi lewat web simulator, lalu buka dashboard sungguhan dan pastikan data yang sama, dengan format yang sama persis, muncul di sana — termasuk lewat update realtime tanpa refresh manual.**

---

## D. Web Simulator Transaksi (Alat Bantu Development — Versi Web)

### D.1 Tujuan & Alasan

Untuk fase ini, dibutuhkan cara **cepat dan tanpa friksi** untuk menguji seluruh alur: generate teks notifikasi realistis → parsing jadi data terstruktur → kirim ke endpoint ingest → tersimpan di Supabase → muncul di dashboard (termasuk realtime) — **tanpa perlu membangun aplikasi Android sama sekali dulu**. Maka dibuat satu halaman web di dalam project Next.js yang sama, khusus untuk keperluan ini.

Ini adalah **fitur development/testing**, bukan bagian dari produk yang dilihat pemilik konter. Pastikan:
- Route-nya terpisah jelas dari halaman dashboard utama (mis. `/dev/simulator`), tidak ditautkan dari navigasi/sidebar utama.
- **Aktif hanya di environment development**, tidak boleh bisa diakses di build production yang nanti dipakai pemilik (mis. dengan pengecekan `process.env.NODE_ENV`, atau exclude route ini dari build production sepenuhnya — pilih pendekatan yang paling aman dan jelaskan alasannya).
- Halaman ini boleh punya styling seadanya/fungsional, tidak perlu mengikuti design system dashboard utama secara ketat — prioritasnya kecepatan testing, bukan estetika.

**Pengembangan aplikasi Android (Notification Listener produksi maupun simulator native) ditunda ke fase berikutnya**, setelah backend & parsing terbukti benar lewat jalur web ini. Saat waktunya tiba, modul parsing TypeScript yang dibangun & terverifikasi di fase ini akan jadi acuan utama untuk diporting ke Kotlin.

### D.2 Fitur Web Simulator

Halaman berisi form dengan komponen berikut. **Field yang ditampilkan menyesuaikan template yang dipilih**:

- **Template transaksi** — pilihan utama: **Digipos - Isi Ulang Pulsa**, **Digipos - Paket Data**, atau **Alpines - Top Up DANA**. Menentukan field lain yang muncul serta format teks notifikasi yang di-generate.
- **Device/konter asal** — dropdown berisi 3 device yang sudah di-seed ke tabel `perangkat` (lihat Bagian D.3), agar transaksi hasil simulasi punya relasi `device_id` yang valid dan bisa diuji tampil di halaman Perangkat pada dashboard juga.
- **Nominal** — pilihan preset nominal umum (5.000, 10.000, 20.000, 25.000, 50.000, 100.000, dst) sekaligus opsi input manual bebas.
- **Nomor tujuan (nomor HP)** — input manual dengan validasi format nomor Indonesia wajar, atau tombol "generate acak".
- **Nama produk** — **hanya muncul untuk template Digipos - Paket Data**. Input teks bebas atau beberapa preset nama produk (mis. "byU Kaget 11GB 28 Hari 28 Hari"), termasuk opsi preset yang sengaja mengandung pola ganjil (spasi ganda, teks berulang) sesuai temuan sample asli, untuk menguji ketahanan parsing.
- **SN (Serial Number)** — **hanya muncul untuk template Digipos - Isi Ulang Pulsa**. Di-generate otomatis mengikuti panjang digit sample asli (20 digit numerik), dengan tombol generate ulang.
- **ID Transaksi / Referensi** — di-generate otomatis mengikuti pola dari sample asli tiap template (prefix `DGPS` + komponen mirip timestamp + digit acak untuk kedua template Digipos; pola pada bagian `REFF:` untuk Alpines). Tombol generate ulang tersedia.
- **Status** — untuk fase ini **selalu "Berhasil"**, tidak perlu ada pilihan gagal dulu (jangan bangun UI togglenya, cukup catat lewat komentar kode bahwa ini akan ditambah setelah sample notifikasi gagal tersedia).
- **Tombol "Generate & Preview"** — menyusun teks notifikasi lengkap persis mengikuti template terpilih (termasuk detail kecil seperti spasi setelah "Rp" yang beda antar template), lalu menjalankannya lewat modul parsing yang sama seperti yang akan dipakai jalur produksi nanti, dan **menampilkan hasil: teks notifikasi mentah yang di-generate berdampingan dengan hasil parsing terstruktur (tiap field & nilainya)** — supaya bisa diverifikasi visual dulu sebelum dikirim, apakah parsing sudah benar atau meleset.
- **Tombol "Kirim ke Backend"** — terpisah dari tombol preview, baru mengirim payload terstruktur hasil parsing ke endpoint ingest sungguhan setelah preview-nya sudah dicek. Tampilkan response dari backend (berhasil tersimpan / duplikat terdeteksi / error validasi) secara jelas di halaman.
- **Tombol "Kirim Duplikat"** — mengirim ulang transaksi yang identik (ID transaksi sama) untuk menguji apakah unique constraint dedup & idempotency endpoint bekerja sesuai rencana (Bagian C.1).
- **Riwayat pengiriman di sesi ini** — daftar singkat transaksi yang sudah dikirim lewat simulator pada sesi berjalan (template, nominal, status response backend), agar bisa cepat cross-check ke dashboard tanpa harus mengingat-ingat apa saja yang sudah dikirim.

### D.3 Data Awal (Seed) yang Dibutuhkan

Sebelum simulator bisa dipakai penuh, pastikan sudah ada data awal di Supabase:
- **3 baris di tabel `konter`** merepresentasikan 3 lokasi konter sungguhan.
- **3 baris di tabel `perangkat`**, masing-masing terhubung ke satu `konter`, merepresentasikan HP yang nantinya dipasang di tiap lokasi.

Buat sebagai seed script yang bisa dijalankan ulang dengan aman (idempotent — tidak membuat baris duplikat kalau dijalankan dua kali), bukan dimasukkan manual satu-satu lewat Supabase dashboard, supaya reproducible dan gampang di-reset saat development.

---

## E. Urutan Pengerjaan yang Disarankan

1. Setup environment variable & kedua Supabase client (Bagian A) — **berhenti dan minta service role key dulu ke pemilik project kalau belum ada.**
2. Buat skema database lengkap dengan constraint, index, RLS, dan aktifkan Realtime (Bagian B).
3. Jalankan seed script untuk 3 `konter` & 3 `perangkat` (Bagian D.3).
4. Bangun modul parsing (3 template, status berhasil saja) sebagai fungsi murni yang bisa diuji terpisah, disamakan field-nya dengan tipe `Transaksi` di frontend Fase 1 (Bagian C.2).
5. Bangun endpoint ingest transaksi & heartbeat (Bagian C.1, C.3).
6. Bangun web simulator (Bagian D.1–D.2), sambungkan ke modul parsing dan endpoint ingest.
7. Uji end-to-end lewat web simulator: kirim beberapa transaksi tiap template, verifikasi hasil parsing di preview sudah benar, verifikasi data tersimpan di Supabase, verifikasi data muncul benar (termasuk realtime) di dashboard Fase 1 tanpa perlu mengubah komponen UI apa pun. Uji juga skenario duplikat.
8. Setelah seluruh alur di atas terbukti bekerja dengan benar, baru lanjut ke fase berikutnya: sample notifikasi gagal, pengembangan aplikasi Android sungguhan (Notification Listener produksi, porting modul parsing dari TypeScript ke Kotlin).

---

## F. Yang Perlu Dikonfirmasi/Disiapkan Pemilik Project Sebelum Lanjut

- **Supabase Service Role Key** (wajib, tanpa ini endpoint ingest tidak bisa dibangun dengan aman).
- Konfirmasi apakah 3 lokasi konter sudah punya nama/label yang jelas untuk di-seed (Bagian D.3), atau pakai nama sementara dulu (mis. "Konter 1/2/3") yang bisa diganti belakangan.

**Ditunda ke fase berikutnya (tidak menghalangi pengerjaan fase ini):**
- Sample notifikasi transaksi GAGAL dari Digipos (kedua template) dan Alpines.
- Konfirmasi konsistensi format REFF pada notifikasi Alpines untuk dedup key.
- Konfirmasi apakah ada varian e-wallet lain selain DANA di Alpines.
- Konfirmasi apakah notifikasi Digipos/Alpines pernah muncul dalam bentuk grouped notification — baru relevan saat pengembangan Notification Listener Android dimulai.
