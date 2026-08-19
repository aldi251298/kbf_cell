# SRS — Backend & Database Dashboard Monitoring Konter Pulsa
### Fase 2: Backend (API Routes) + Supabase — Menyambung ke Frontend yang Sudah Ada

**Versi:** 1.0
**Target pembaca:** AI coding agent (Claude Code / sejenis)
**Status:** Fase 2 — melanjutkan project yang frontend-nya sudah dibangun di Fase 1 (fake data)
**Prasyarat:** Dokumen `SRS_Dashboard_Konter_Pulsa_Frontend.md` (Fase 1) dan project Next.js hasil implementasinya

---

## 0. LANGKAH WAJIB PERTAMA — Audit Project yang Sudah Ada

**Sebelum menulis satu baris kode pun, agent WAJIB melakukan investigasi menyeluruh terhadap project yang sudah ada.** Jangan berasumsi tentang struktur, penamaan, atau isi project — semua harus diverifikasi langsung dari kode sungguhan.

Langkah audit yang wajib dilakukan, secara berurutan:

1. **Pahami struktur folder secara menyeluruh** — telusuri seluruh direktori project (khususnya `app/`, `components/`, `services/` atau `lib/services/`, `types/`, `lib/utils/`) untuk memahami bagaimana project ini diorganisir saat ini.
2. **Baca seluruh layer service/repository yang sudah ada** (fungsi-fungsi yang menyediakan data dummy ke komponen UI). Catat: nama tiap fungsi, parameter yang diterima, bentuk data yang dikembalikan (return type), dan apakah ada simulasi delay/async di dalamnya.
3. **Baca seluruh definisi tipe (types/interfaces)** yang sudah ada untuk domain: Transaksi, Perangkat, Konter, RingkasanHarian, LaporanPeriode, dsb. Ini akan jadi acuan utama untuk merancang skema database — jangan buat skema baru yang tidak selaras dengan tipe yang sudah dipakai frontend.
4. **Identifikasi semua titik pemanggilan service** dari komponen UI — pastikan memahami komponen mana memanggil fungsi service yang mana, dan halaman mana yang bergantung pada data apa.
5. **Cari seluruh komentar/TODO** yang sudah ditinggalkan di Fase 1 terkait integrasi backend (biasanya menandai titik ingest, auth, atau realtime). Jadikan ini sebagai peta awal pekerjaan.
6. **Periksa konfigurasi project saat ini**: versi Next.js, apakah App Router atau bukan, package manager yang dipakai, environment variable yang mungkin sudah ada di `.env.example` (jika ada), serta dependency yang sudah terpasang.
7. **Setelah audit selesai, agent WAJIB merangkum temuannya secara eksplisit** sebelum mulai mengerjakan: fungsi service apa saja yang perlu diganti, tipe data apa yang jadi acuan skema, dan urutan pekerjaan yang akan diambil. Rangkuman ini semacam "rencana kerja" singkat yang mengonfirmasi pemahaman terhadap project sebelum eksekusi.

**Aturan ketat:** Jangan mengubah struktur folder, penamaan komponen, atau kontrak (signature) fungsi service yang sudah dipakai UI kecuali benar-benar diperlukan dan tidak ada cara lain. Tujuan utama fase ini adalah **mengisi implementasi nyata ke belakang layar**, bukan merombak apa yang sudah bekerja di frontend.

---

## 1. Tujuan Fase Ini

Menghubungkan dashboard yang sudah punya UI lengkap (Fase 1) ke data sungguhan, dengan:
- Database nyata di Supabase (PostgreSQL) menggantikan generator data dummy.
- API endpoint untuk menerima data transaksi dari aplikasi Android (ingest endpoint) — meskipun aplikasi Android-nya sendiri di luar scope, endpoint-nya harus siap menerimanya.
- API/mekanisme bagi dashboard untuk membaca data sungguhan, menggantikan isi internal service layer yang tadinya fake.
- Autentikasi asli untuk pemilik (1 akun).
- Update realtime ke dashboard saat ada transaksi baru.
- Mekanisme heartbeat untuk status online/offline device.

**Prinsip inti fase ini: ganti isi (implementasi) layer service, JANGAN ganti bentuk (kontrak/interface) yang dipakai komponen UI.** Kalau audit di Bagian 0 dilakukan dengan benar, sebagian besar komponen UI di frontend seharusnya tidak perlu disentuh sama sekali.

---

## 2. Arsitektur (Rekap dari Rencana Awal)

Sesuai dokumen rencana sistem monitoring konter:

- **Aplikasi Android** (di luar scope, tapi endpoint harus kompatibel dengannya): mendeteksi transaksi lewat Accessibility Service & Notification Listener, mengirim data transaksi ke endpoint ingest, menyimpan lokal dulu jika offline lalu retry saat online, dan mengirim heartbeat berkala.
- **Next.js API Routes** (dikerjakan di fase ini): endpoint ingest data transaksi, endpoint heartbeat device, endpoint-endpoint yang dipanggil dashboard untuk membaca data (bisa langsung lewat Supabase client di server component, atau lewat API route — pilih sesuai kebutuhan tiap kasus, dijelaskan di Bagian 5).
- **Supabase**: PostgreSQL sebagai database utama, Supabase Realtime untuk push update ke dashboard, Supabase Auth untuk login pemilik (1 akun, tanpa role kompleks).
- **Vercel**: hosting tetap satu project seperti sudah disepakati, tidak ada backend terpisah.

---

## 3. Skema Database (Supabase / PostgreSQL)

Rancang skema berdasarkan struktur data yang **sudah dipakai di tipe TypeScript frontend** (hasil temuan audit Bagian 0), bukan merancang dari nol tanpa mengacu ke frontend. Tabel minimal yang dibutuhkan sesuai rencana awal:

- **Tabel konter**: representasi 3 lokasi konter (nama/label, identitas unik).
- **Tabel perangkat (device)**: HP yang terpasang di tiap konter, terhubung ke konter, menyimpan status online/offline (bisa dihitung dari heartbeat terakhir, bukan disimpan sebagai kolom statis yang gampang basi), waktu heartbeat terakhir.
- **Tabel transaksi**: nomor tujuan, produk, nominal, status (sukses/gagal/pending), waktu transaksi, SN, relasi ke device/konter asal.

Ketentuan wajib untuk skema:
- **Unique constraint / dedup** pada tabel transaksi untuk mencegah data ganda akibat notifikasi yang terkirim dua kali dari Android (sesuai catatan teknis di dokumen rencana awal) — tentukan kombinasi kolom yang masuk akal untuk dijadikan constraint unik (mis. kombinasi device asal + SN + waktu, atau field lain yang secara alami unik per transaksi).
- **Index** pada kolom yang akan sering difilter/disortir oleh dashboard (waktu transaksi, status, device/konter asal) agar query tabel transaksi tetap cepat seiring data bertambah.
- **Row Level Security (RLS)** diaktifkan pada seluruh tabel. Karena hanya ada 1 akun pemilik, kebijakan bisa sederhana (akun terautentikasi boleh baca semua data), tapi endpoint ingest dari Android **tidak boleh** memakai kredensial pemilik — harus lewat mekanisme terpisah (lihat Bagian 4).
- Skema harus mendukung perhitungan yang dibutuhkan laporan (harian/bulanan/tahunan) tanpa perlu agregasi berat di sisi klien — pertimbangkan apakah perlu view atau materialized query di database untuk ringkasan, atau cukup query biasa dari API route mengingat skala data yang kecil (3 device).

---

## 4. Endpoint Ingest & Keamanan

- Endpoint ingest transaksi dan endpoint heartbeat **dilindungi API key/shared secret sederhana** (bukan JWT kompleks), sesuai catatan teknis di rencana awal — cukup untuk skala 3 device yang dikontrol sendiri oleh pemilik.
- API key ini disimpan sebagai environment variable di server, **tidak pernah** dikirim/terlihat di sisi frontend dashboard (beda jalur dari Supabase Auth pemilik).
- Validasi input di endpoint ingest harus ketat: tolak payload yang tidak sesuai bentuk data yang diharapkan (nominal negatif, field wajib kosong, dsb) dan kembalikan response yang jelas agar aplikasi Android tahu harus retry atau tidak.
- Endpoint ingest harus **idempotent** terhadap constraint dedup di Bagian 3 — kalau data yang sama terkirim dua kali (kasus retry dari Android saat koneksi putus di tengah), sistem tidak boleh menyimpan duplikat maupun mengembalikan error yang membingungkan; tangani sebagai "sudah tersimpan" secara graceful.
- Endpoint heartbeat cukup ringan: menerima identitas device, mencatat waktu heartbeat terakhir. Dari sinilah status online/offline dashboard dihitung (mis. device dianggap offline jika tidak ada heartbeat lebih dari durasi tertentu — tentukan threshold yang masuk akal dan jadikan konstanta terpusat, bukan angka ajaib yang tersebar di banyak file).

---

## 5. Mengganti Layer Service (Titik Sambung ke Frontend)

Ini bagian paling kritis dari fase ini — cara mengganti fake data dengan data asli **tanpa merusak frontend yang sudah jadi**.

- Untuk setiap fungsi di layer service yang sebelumnya mengembalikan data dummy, ganti **implementasi internalnya** untuk mengambil data sungguhan dari Supabase — pertahankan nama fungsi, parameter, dan bentuk return value yang sama persis seperti yang dipakai komponen UI (hasil temuan audit Bagian 0).
- Tentukan dengan sadar untuk tiap fungsi: apakah pengambilan data dilakukan langsung di server component lewat Supabase client server-side, atau lewat pemanggilan API route internal. Pilih pendekatan yang konsisten dan jelaskan alasannya secara singkat lewat komentar kode, jangan campur aduk pola tanpa pola pikir yang jelas.
- Hapus generator data dummy yang sebelumnya dipakai (atau pindahkan ke folder terpisah yang jelas ditandai sebagai "fixture/testing only") — jangan biarkan tercampur dengan kode produksi yang mengambil data asli.
- Setelah satu fungsi service diganti implementasinya, verifikasi bahwa halaman yang memanggilnya di frontend tetap berfungsi tanpa perubahan kode di sisi komponen UI. Jika ternyata ada komponen yang harus diubah, itu tandanya kontrak service sebelumnya kurang matang — catat sebagai penyesuaian yang disengaja, bukan tempelan darurat.
- Loading state dan error state yang sudah didesain di Fase 1 (skeleton, empty state) harus tetap terpakai dan kini benar-benar merefleksikan kondisi asli (loading sungguhan saat fetch ke Supabase, empty state sungguhan saat data memang kosong, bukan lagi simulasi).

---

## 6. Autentikasi Pemilik

- Gunakan Supabase Auth untuk 1 akun pemilik, tanpa sistem role/permission kompleks (sesuai rencana awal).
- Halaman/komponen login yang sudah disiapkan secara visual di Fase 1 (jika ada) kini disambungkan ke logic autentikasi asli.
- Seluruh halaman dashboard harus terlindungi — pengguna yang belum login diarahkan ke halaman login, bukan bisa mengakses data lewat URL langsung.
- Sesi login harus bertahan wajar (tidak perlu login ulang tiap buka dashboard), tapi tetap aman (bisa logout, sesi kadaluarsa dalam waktu yang wajar).
- Karena hanya ada 1 akun, tidak perlu halaman registrasi publik — akun pemilik dibuat manual lewat Supabase dashboard atau seed script, bukan lewat form sign-up yang terbuka.

---

## 7. Realtime

- Aktifkan Supabase Realtime pada tabel transaksi (dan device jika diperlukan untuk status online/offline langsung berubah tanpa refresh).
- Dashboard yang sedang terbuka harus menerima update transaksi baru dan perubahan status device secara langsung, sesuai alur yang sudah digambarkan di dokumen rencana awal (operator transaksi → Android kirim data → tersimpan di Postgres → Realtime dorong ke dashboard yang terbuka → pemilik lihat data terbaru tanpa refresh manual).
- Pastikan subscription realtime dibersihkan dengan benar saat komponen unmount (tidak ada memory leak atau subscription menumpuk saat pemilik berpindah halaman).
- Pertimbangkan efek realtime terhadap komponen yang sudah ada — mis. tabel transaksi yang sedang difilter, apakah transaksi baru yang masuk tapi tidak sesuai filter aktif perlu ditampilkan atau tidak (tentukan perilaku yang masuk akal dan konsisten, dokumentasikan keputusannya).

---

## 8. Export & Laporan dengan Data Asli

- Fungsi export Excel yang sebelumnya dibangun client-side dari data dummy (Fase 1) kini bekerja dengan data asli. Evaluasi apakah tetap layak dilakukan client-side (karena skala data kecil, 3 device) atau perlu dipindah ke server — putuskan berdasarkan volume data aktual, bukan asumsi.
- Perhitungan laporan harian/bulanan/tahunan yang di Fase 1 dihitung dari data dummy di sisi klien, sekarang perlu dipastikan sumber perhitungannya efisien — jika volume data transaksi mulai besar, pertimbangkan agregasi di sisi database/API daripada menghitung ribuan baris di browser.

---

## 9. Backup Data

- Karena Supabase free tier tidak menyediakan backup otomatis (sesuai catatan di rencana awal), siapkan mekanisme export data terjadwal mingguan. Tentukan pendekatan yang realistis untuk konteks deployment di Vercel (mis. scheduled function/cron job yang tersedia di ekosistem Vercel atau Supabase, yang mengekspor data penting secara berkala ke tempat penyimpanan aman).
- Dokumentasikan proses restore secara manual (langkah-langkah jika suatu saat data perlu dipulihkan dari hasil backup), meskipun implementasi otomatisnya sederhana.

---

## 10. Environment Variables & Konfigurasi

- Susun seluruh environment variable yang dibutuhkan (URL & key Supabase untuk client dan server, API key ingest, secret lain) dalam file `.env.example` yang jelas dan terdokumentasi — tanpa nilai asli, hanya nama variabel dan penjelasan singkat kegunaannya.
- Pisahkan secara jelas mana variable yang boleh terekspos ke browser (public/anon key Supabase) dan mana yang hanya boleh dipakai di server (service role key, API key ingest) — jangan sampai key sensitif bocor ke bundle frontend.
- Pastikan pengaturan environment variable di Vercel didokumentasikan langkahnya (bukan dikerjakan otomatis oleh agent, karena itu perlu akses dashboard Vercel oleh pemilik project), cukup instruksikan apa yang perlu diisi di sana.

---

## 11. Non-Functional Requirements

- **Keamanan:** tidak ada credential sensitif ter-hardcode di kode maupun ter-commit ke repo; validasi input di semua endpoint publik (ingest, heartbeat); RLS aktif di semua tabel.
- **Konsistensi dengan Fase 1:** gaya kode, struktur folder, penamaan, dan prinsip pemisahan tanggung jawab per file yang sudah ditetapkan di SRS Fase 1 tetap berlaku dan wajib diikuti di fase ini juga.
- **Type safety:** definisikan tipe hasil query Supabase secara eksplisit, selaras dengan tipe domain yang sudah ada di frontend — hindari data mentah tak bertipe (`any`) mengalir dari database ke komponen UI.
- **Observability dasar:** tambahkan logging yang wajar di endpoint ingest dan heartbeat (agar mudah didiagnosis jika device tertentu berhenti mengirim data), tanpa membangun sistem monitoring berlebihan untuk skala 3 device.
- **Idempotency & resiliency:** endpoint ingest harus tahan terhadap retry dari Android akibat koneksi tidak stabil, sesuai Bagian 4.

---

## 12. Kriteria Selesai (Fase 2)

Fase ini dianggap selesai jika:
1. Audit awal (Bagian 0) sudah dilakukan dan dirangkum sebelum implementasi dimulai.
2. Skema database di Supabase sudah dibuat, selaras dengan tipe data yang sudah dipakai frontend, lengkap dengan constraint dedup, index, dan RLS.
3. Endpoint ingest transaksi dan heartbeat sudah berfungsi, terlindungi API key, tervalidasi, dan idempotent.
4. Seluruh fungsi di layer service sudah terhubung ke data asli, tanpa mengubah kontrak yang dipakai komponen UI di frontend (kecuali ada alasan kuat yang terdokumentasi).
5. Autentikasi pemilik berfungsi, seluruh halaman dashboard terlindungi dari akses tanpa login.
6. Update realtime bekerja untuk transaksi baru dan status device.
7. Export dan laporan tetap berfungsi dengan data asli, sudah dievaluasi apakah pendekatan client-side masih layak.
8. Mekanisme backup mingguan (atau minimal proses manual yang terdokumentasi) sudah tersedia.
9. Environment variable terdokumentasi rapi di `.env.example`, tidak ada secret bocor ke sisi client.
10. Tidak ada lagi generator data dummy yang aktif dipakai di jalur produksi.

---

## 13. Di Luar Scope (Eksplisit)

- Pengembangan aplikasi Android (tetap di luar scope, hanya endpoint yang perlu kompatibel dengannya).
- Sistem role/permission kompleks (tetap 1 akun pemilik).
- Monitoring/observability tingkat enterprise (cukup logging dasar).
- Migrasi ke hosting selain Vercel atau database selain Supabase.

---

*Dokumen ini adalah kelanjutan langsung dari SRS Fase 1 (Frontend). Agent WAJIB membaca dan memahami project hasil Fase 1 sebelum memulai pekerjaan di dokumen ini — lihat Bagian 0.*
