# SRS — Dashboard Monitoring Transaksi Konter Pulsa
### Fase 1: Frontend Only (Fake Data, Backend-Ready)

**Versi:** 1.0
**Target pembaca:** AI coding agent (Claude Code / sejenis)
**Status:** Fase 1 dari proyek yang lebih besar — hanya mengerjakan frontend dashboard web

---

## 1. Konteks & Batasan Fase Ini

Ini adalah bagian **frontend dashboard web** dari sistem monitoring transaksi 3 konter pulsa (referensi: dokumen "Rencana Sistem Monitoring Konter"). Arsitektur penuh nantinya melibatkan aplikasi Android (Accessibility Service + Notification Listener), backend/API ingest, dan database Supabase. **Semua itu DI LUAR scope fase ini.**

Scope fase ini **hanya**:
- Membangun UI dashboard web yang lengkap secara visual dan interaktif.
- Menggunakan **data dummy/fake** yang realistis, bukan koneksi ke server sungguhan.
- Menyiapkan arsitektur kode agar sumber data (fake → real API) tinggal ditukar di satu titik, tanpa refactor besar-besaran nanti.

Agent **TIDAK BOLEH**:
- Membuat backend, API route yang benar-benar terhubung ke database.
- Mengintegrasikan Supabase, autentikasi asli, atau WebSocket/Realtime sungguhan.
- Membangun aplikasi Android.

Agent **WAJIB**:
- Menyiapkan layer abstraksi data (lihat Bagian 7) supaya integrasi backend di fase berikutnya semudah mungkin.

---

## 2. Tujuan Produk (Dashboard)

Dashboard ini adalah alat bagi **pemilik konter pulsa** untuk memantau, dari mana saja:
- Omzet & jumlah transaksi harian secara ringkas.
- Riwayat transaksi detail (nomor tujuan, produk, nominal, status, waktu, SN) dengan filter dan export.
- Laporan harian / bulanan / tahunan.
- Status online/offline tiap HP konter (real-time di fase produksi, simulasi di fase ini).

Pengguna adalah **satu orang (pemilik)**, non-teknis, mengakses lewat browser di HP atau laptop. Desain harus jelas, cepat dipahami, tidak membingungkan.

---

## 3. Tech Stack (Wajib)

- **Framework:** Next.js terbaru (App Router), TypeScript strict mode.
- **Styling:** Tailwind CSS terbaru, gunakan CSS variables untuk design tokens (bukan hardcoded warna di banyak tempat).
- **Komponen UI dasar:** boleh pakai shadcn/ui sebagai fondasi (bukan tempelan generik — semua komponen harus di-restyle sesuai design system kustom di Bagian 6), atau dibangun manual jika lebih cocok untuk keunikan visual.
- **Chart/grafik:** gunakan library chart yang ringan dan modern (mis. Recharts atau sejenisnya) — grafik harus di-restyle mengikuti design token, jangan tampil generik/default.
- **Icon:** gunakan satu icon set konsisten (mis. Lucide) di seluruh aplikasi.
- **State management:** React state/hooks bawaan + Context API untuk state global sederhana (filter aktif, tanggal terpilih, dsb). Jangan pakai state manager berat (Redux dll) — tidak diperlukan untuk skala ini.
- **Data fetching layer:** buat abstraksi service/repository (lihat Bagian 7), bukan fetch langsung di komponen.
- **Font:** pilih pasangan font modern (bukan default Inter polos tanpa pertimbangan) yang mendukung karakter unik pada desain — boleh kombinasi 1 font display + 1 font teks.
- **Package manager:** pnpm.
- **Linting/formatting:** ESLint + Prettier dikonfigurasi dari awal.

---

## 4. Prinsip Arsitektur & Struktur Kode

### 4.1 Prinsip Umum
- **Satu file, satu tanggung jawab.** Tidak boleh ada file component/page yang membengkak jadi ratusan baris berisi banyak concern sekaligus. Pecah menjadi sub-komponen begitu sebuah bagian UI punya logika atau markup yang signifikan.
- **Struktur folder berbasis fitur (feature-based), bukan hanya berbasis tipe file.** Kelompokkan komponen, hook, dan tipe yang terkait pada satu fitur (mis. `transaksi`, `ringkasan`, `laporan`, `perangkat`) dalam foldernya masing-masing, dengan folder `shared`/`ui` untuk elemen lintas fitur.
- **Server Components by default**, gunakan Client Components (`"use client"`) hanya pada bagian yang benar-benar butuh interaktivitas (filter, chart interaktif, tabel dengan sorting, dsb).
- **Reusable UI primitives** (Button, Card, Badge, Table, Input, DateRangePicker, dsb) dibuat sekali di folder `components/ui`, dipakai ulang di semua fitur — jangan duplikasi styling antar halaman.
- **Tipe data (TypeScript types/interfaces)** didefinisikan terpusat per domain (mis. `Transaksi`, `Perangkat`, `Konter`, `RingkasanHarian`) di folder `types`, dipakai konsisten di seluruh aplikasi — jangan definisikan ulang tipe yang sama di banyak file.
- **Konstanta & konfigurasi** (nama produk, status transaksi, warna status, dsb) dipusatkan, tidak di-hardcode berulang di berbagai komponen.
- **Penamaan file dan komponen** konsisten (PascalCase untuk komponen, camelCase untuk fungsi/hook, kebab-case untuk nama folder/file route).
- Hindari duplikasi logika (DRY) — jika ada logika format (format Rupiah, format tanggal, format nomor telepon) dipakai lebih dari satu tempat, jadikan utility function di folder `lib/utils`.

### 4.2 Struktur Halaman (Routes)
Buat struktur navigasi dengan halaman-halaman berikut (gunakan layout dengan sidebar/navigasi persisten):

1. **Ringkasan (Dashboard Utama / `/`)** — overview cepat: omzet hari ini, jumlah transaksi hari ini, perbandingan dengan kemarin, status singkat 3 device, grafik tren singkat.
2. **Transaksi (`/transaksi`)** — tabel riwayat transaksi lengkap dengan filter dan export.
3. **Laporan (`/laporan`)** — laporan harian/bulanan/tahunan dengan visualisasi grafik dan ringkasan angka.
4. **Perangkat (`/perangkat`)** — status online/offline tiap HP konter, waktu heartbeat terakhir, riwayat status.

Gunakan layout bersama (shared layout) dengan navigasi sidebar (desktop) yang beradaptasi menjadi bottom navigation atau drawer di mobile.

---

## 5. Kebutuhan Fungsional per Halaman

### 5.1 Ringkasan (Dashboard Utama)
- Kartu ringkasan angka utama: total omzet hari ini, total transaksi hari ini, rata-rata nilai transaksi, delta/perbandingan persentase terhadap hari sebelumnya (naik/turun, tandai visual jelas).
- Grafik tren omzet 7 hari terakhir (line/bar chart).
- Ringkasan status 3 konter (online/offline) dalam bentuk kartu ringkas, dengan indikator visual status (bukan hanya teks — gunakan warna/dot/badge yang jelas namun tetap sesuai palet desain, hindari merah-hijau generik ala traffic light standar; cari pendekatan visual yang lebih halus dan khas).
- Daftar transaksi terbaru (mis. 5-10 transaksi terakhir) sebagai preview, dengan tautan ke halaman Transaksi lengkap.
- Filter periode cepat (Hari ini / 7 hari / 30 hari) yang memengaruhi angka dan grafik di halaman ini.

### 5.2 Transaksi
- Tabel data transaksi dengan kolom: waktu, konter/device asal, nomor tujuan, produk, nominal, status (sukses/gagal/pending), SN.
- Filter: rentang tanggal, konter/device, status transaksi, pencarian nomor tujuan/produk.
- Sorting per kolom (minimal waktu dan nominal).
- Pagination atau infinite scroll (pilih salah satu, konsisten).
- Tombol export ke Excel (implementasi export client-side dari data yang sedang ditampilkan/difilter; sertakan komentar/TODO yang menandai bahwa export data skala besar nanti bisa dipindah ke backend).
- State kosong (empty state) yang didesain khusus, bukan tabel kosong polos, untuk kondisi filter tidak menemukan hasil.
- Loading state (skeleton) yang sesuai desain, bukan spinner generik polos.

### 5.3 Laporan
- Tab atau pemilih mode: Harian / Bulanan / Tahunan.
- Untuk tiap mode: grafik tren omzet & jumlah transaksi, tabel ringkasan per periode (per hari dalam sebulan, per bulan dalam setahun, dsb), dan angka agregat (total, rata-rata, tertinggi, terendah).
- Kemampuan memilih rentang/tahun/bulan spesifik.
- Perbandingan antar konter (opsional tapi disarankan): breakdown kontribusi tiap konter terhadap total omzet pada periode terpilih (mis. dalam bentuk grafik donut/bar perbandingan).

### 5.4 Perangkat
- Kartu/daftar untuk tiap 3 HP konter: nama/label konter, status online/offline saat ini, waktu heartbeat terakhir, durasi sejak online/offline terakhir.
- Indikator visual status yang jelas namun tetap konsisten dengan design system (lihat catatan warna status di 5.1).
- Riwayat status singkat (mis. grafik/timeline uptime sederhana per device dalam 24 jam atau 7 hari terakhir).
- State khusus untuk device yang lama tidak mengirim heartbeat (kemungkinan bermasalah) — beri penanda visual berbeda dari sekadar "offline" biasa.

### 5.5 Navigasi & Layout Umum
- Header/topbar berisi identitas aplikasi, mungkin nama pemilik/toko, dan indikator waktu/tanggal saat ini.
- Sidebar navigasi (desktop) dengan highlight halaman aktif; versi mobile beradaptasi (bottom nav atau drawer/hamburger).
- Dark mode opsional tapi disarankan disiapkan dari awal (tokens sudah mendukung, meski toggle bisa menyusul).
- Semua halaman harus responsif penuh: mobile, tablet, desktop.

---

## 6. Design System — Arahan Visual

**Prinsip utama: minimalis, bersih, modern, tapi TIDAK BOLEH terlihat generik/template AI standar** (hindari kombinasi klise seperti: kartu putih polos + shadow default + font Inter + aksen ungu-biru gradient generik + icon outline generik tanpa karakter).

Arahan konkret untuk agent:
- **Palet warna:** pilih palet warna yang khas dan disengaja, bukan default Tailwind palette mentah. Boleh terinspirasi dari nuansa yang relevan secara konteks (mis. warna hangat/earthy yang terasa "Indonesia"/lokal tanpa menjadi kitsch, atau palet gelap-elegan dengan satu warna aksen kuat) — tentukan satu warna aksen utama yang konsisten dipakai untuk elemen penting (angka utama, tombol primer, grafik), dan gunakan skala netral (bukan abu-abu generik) untuk latar dan teks.
- **Tipografi:** pilih pasangan font yang punya karakter (mis. font display sedikit lebih ekspresif untuk angka besar/heading, dan font teks yang sangat mudah dibaca untuk tabel/data). Angka-angka penting (omzet, jumlah transaksi) harus ditonjolkan secara tipografis — ukuran, weight, tracking — agar dashboard terasa "data-forward", bukan sekadar teks di dalam kotak.
- **Kartu & permukaan:** hindari default "card putih + shadow tipis" tanpa variasi. Eksplorasi elevasi lewat kombinasi border tipis, warna latar bertingkat (bukan hanya shadow), atau aksen garis/warna di tepi kartu untuk membedakan status/kategori.
- **Data visual (grafik):** grafik harus di-styling ulang agar match dengan design token (warna, font, grid line halus, tooltip custom) — jangan biarkan tampilan default library chart.
- **Micro-interaction:** gunakan transisi halus (hover, transisi antar state loading→data, transisi filter) agar aplikasi terasa hidup, tanpa berlebihan.
- **Ikonografi:** gunakan icon secara konsisten sebagai penunjuk makna (status, kategori produk, arah tren naik/turun), bukan hiasan semata.
- **Empty state & loading state** didesain sebagai bagian dari identitas visual aplikasi (bukan placeholder abu-abu generik).
- **Konsistensi lewat design tokens:** semua warna, spacing, radius, shadow, font-size didefinisikan sebagai token terpusat (CSS variables/Tailwind theme extend), dipakai konsisten di semua komponen — bukan nilai ad-hoc di tiap file.
- Agent diberi kebebasan kreatif penuh dalam memilih arah visual spesifik (warna, font, gaya ikon) selama tetap: minimalis, bersih, modern, konsisten, dan terasa dirancang dengan sengaja — bukan hasil template generik.

---

## 7. Layer Data & Persiapan Integrasi Backend

Ini bagian krusial agar fase berikutnya (hubungkan ke backend/Supabase) lancar tanpa refactor besar.

- Buat **layer service/repository** terpisah dari komponen UI (mis. `services/transaksiService`, `services/perangkatService`, `services/laporanService`) yang menyediakan fungsi-fungsi pengambilan data (mis. mengambil daftar transaksi dengan filter, mengambil ringkasan harian, mengambil status perangkat).
- Untuk fase ini, implementasi internal fungsi-fungsi tersebut **mengembalikan data dari generator/fixture data dummy** (bisa async/promise-based agar strukturnya sudah menyerupai pemanggilan API sungguhan, termasuk simulasi delay loading).
- Komponen UI **hanya boleh memanggil fungsi dari layer service ini**, tidak pernah mengakses data dummy secara langsung. Ini memastikan saat fase backend dimulai, hanya isi internal service yang diganti (fetch ke API asli), tanpa mengubah komponen UI.
- Definisikan tipe data domain (Transaksi, Perangkat, Konter, RingkasanHarian, LaporanPeriode, dsb) di folder `types` sesuai struktur data yang disebutkan di dokumen rencana awal (nomor tujuan, produk, nominal, status, waktu, SN, device/konter asal, status online/offline, waktu heartbeat).
- Data dummy harus **realistis dan cukup banyak/variatif** untuk menguji filter, pagination, grafik tren, dan berbagai skenario (termasuk skenario transaksi gagal, device offline lama, hari dengan omzet nol, dsb) — bukan hanya 2-3 baris data seragam.
- Sertakan util generator data dummy yang deterministik/masuk akal secara waktu (mis. data transaksi tersebar wajar sepanjang hari operasional, bukan acak sembarangan yang tidak masuk akal).
- Tandai dengan komentar/TODO yang jelas di titik-titik yang nantinya perlu diganti koneksi backend sungguhan (endpoint ingest, auth, realtime subscription), tapi **jangan bangun implementasi backend-nya sekarang.**

---

## 8. Non-Functional Requirements

- **Performa:** hindari re-render tidak perlu; gunakan memoization wajar; gunakan loading state agar transisi data terasa responsif meski data dummy.
- **Aksesibilitas:** kontras warna cukup (terutama karena desain custom, pastikan tetap WCAG AA minimal untuk teks penting), elemen interaktif dapat diakses keyboard, label yang jelas pada elemen form/filter.
- **Type safety:** TypeScript strict, tidak ada `any` yang tidak perlu.
- **Konsistensi kode:** ikuti aturan ESLint/Prettier yang dikonfigurasi; tidak ada kode mati/komentar sisa debugging saat selesai.
- **Skalabilitas struktur:** struktur folder harus mudah diperluas saat menambah fitur/halaman baru di fase berikutnya (backend, autentikasi asli, dsb) tanpa perlu reorganisasi besar.

---

## 9. Deliverable & Kriteria Selesai (Fase 1)

Fase ini dianggap selesai jika:
1. Keempat halaman (Ringkasan, Transaksi, Laporan, Perangkat) berfungsi penuh dengan data dummy, termasuk seluruh filter dan interaksi yang dijelaskan di Bagian 5.
2. Desain terasa unik, minimalis, modern, konsisten di semua halaman, dan tidak terlihat seperti template AI generik.
3. Struktur kode mengikuti prinsip di Bagian 4: terpisah per fitur, tidak ada file yang membengkak, tipe & util terpusat.
4. Layer data/service sudah terpisah rapi dari UI sesuai Bagian 7, siap diganti ke backend sungguhan tanpa mengubah komponen UI.
5. Aplikasi responsif penuh di mobile dan desktop.
6. Tidak ada dummy data yang bocor logic backend (tidak ada simulasi koneksi database asli, auth asli, atau realtime asli di fase ini).

---

## 10. Di Luar Scope (Eksplisit — Jangan Dikerjakan Sekarang)

- Aplikasi Android (Kotlin, Accessibility Service, Notification Listener).
- Backend/API ingest sungguhan.
- Integrasi Supabase (database, Auth, Realtime) sungguhan.
- Deployment ke Vercel dengan koneksi backend asli.
- Sistem autentikasi login sungguhan (boleh disiapkan halaman/komponen login secara visual jika relevan untuk kelengkapan UI, tapi tanpa logic autentikasi nyata).

---

*Dokumen ini adalah spesifikasi untuk fase frontend saja. Fase backend, aplikasi Android, dan integrasi Supabase akan memiliki SRS terpisah setelah fase ini selesai.*
