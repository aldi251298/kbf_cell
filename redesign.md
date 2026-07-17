# Instruksi Redesign Dashboard — KonterKu Style

## Tujuan
Redesign **total** tampilan halaman Dashboard project ini agar mengikuti referensi desain terlampir (`dashboard-reference.png`), **tanpa mengubah data, logic, routing, atau fitur yang sudah ada**. Ini murni pekerjaan UI/UX — layout, komponen visual, tipografi, warna, spacing.

> ⚠️ **PENTING sebelum mulai coding:**
> 1. Baca dulu struktur project ini (halaman dashboard yang sudah ada, komponen yang tersedia, sumber data/state/API yang dipakai).
> 2. **Jangan hardcode data dummy baru.** Semua angka, label, dan daftar di desain referensi (mis. "1.248 transaksi", "Rp 18.560.000", daftar produk terlaris, dsb.) adalah CONTOH TATA LETAK saja — map ke data/fitur yang REAL sudah ada di project ini.
> 3. Kalau ada elemen di referensi yang **tidak punya padanan fitur** di project ini (misal fitur "Top Up Saldo" belum ada), jangan dipaksakan — beri komentar `// TODO: fitur belum ada di project ini` pada bagian itu, atau tampilkan dalam bentuk placeholder yang jelas dinonaktifkan (disabled state), lalu laporkan ke saya di ringkasan akhir.
> 4. Kalau project sudah pakai Tailwind v4, ikuti aturan syntax v4 (lihat `tailwind-v4-migration-notes.md` bila ada di repo) — jangan pakai syntax v3.

---

## 1. Konsep Desain Umum

- **Gaya**: clean, minimalis, SaaS admin dashboard modern — banyak whitespace, card dengan rounded corner besar (`rounded-xl`/`rounded-2xl`), shadow tipis (`shadow-sm`), border halus abu-abu terang.
- **Palet warna**:
  - Background utama: putih / abu sangat terang (`bg-gray-50` atau `bg-white`)
  - Sidebar: putih dengan border kanan tipis
  - Aksen utama: biru (`blue-600`/`blue-700`) — dipakai untuk logo, menu aktif, tombol primary, garis grafik
  - Warna status/kategori sekunder: hijau (sukses/penjualan), oranye (laba/warning), ungu (transaksi sukses), untuk badge & ikon card statistik
  - Teks: abu gelap (`gray-900`) untuk heading, abu sedang (`gray-500`) untuk subteks/label
- **Tipografi**: sans-serif modern (Inter/system font), heading tebal (`font-semibold`/`font-bold`), angka statistik besar & bold (`text-2xl`/`text-3xl`)
- **Radius & shadow konsisten** di semua card, tombol, input, badge.

---

## 2. Struktur Layout

### 2.1 Sidebar (kiri, fixed, lebar ± 240–260px)
- Logo + nama aplikasi di atas (ikon kotak biru + teks nama produk + subteks kecil "Dashboard")
- Menu navigasi vertikal dengan ikon di kiri tiap label, urutan menu **mengikuti menu yang sudah ada di project ini** (jangan menambah menu baru yang tidak ada route/fiturnya). Contoh pola dari referensi: Dashboard, Transaksi, Laporan, Produk, Pelanggan, Pengaturan.
- Item menu aktif: background biru muda (`blue-50`), teks & ikon biru (`blue-600`), rounded.
- Item menu non-aktif: teks abu (`gray-600`), hover → background abu sangat terang.
- Bagian bawah sidebar (sticky/fixed di bawah): card ringkasan saldo/akun (jika project punya fitur saldo) dengan tombol aksi primary biru, dan card bantuan/support kecil di bawahnya. **Sesuaikan isinya dengan fitur real** — kalau project tidak punya konsep "saldo", ganti section ini dengan info akun/ringkasan lain yang relevan, atau hilangkan.

### 2.2 Topbar (atas, full width sisa area setelah sidebar)
- Kiri: sapaan dinamis ke user yang login (mis. "Selamat datang, {nama}") + subteks singkat ringkasan halaman. **Ambil nama dari data auth/session yang sudah ada**, jangan hardcode.
- Tengah/kanan: search bar dengan ikon kaca pembesar + placeholder relevan dengan fitur pencarian yang sudah ada di project (kalau ada), termasuk shortcut key hint (`⌘K`) jika project memang punya command palette/search shortcut — kalau tidak ada, jangan tampilkan shortcut palsu.
- Kanan: ikon notifikasi dengan badge jumlah (bind ke data notifikasi real jika tersedia), avatar + nama + role user (dari data user login), dan filter tanggal (date range picker) — **hanya tampilkan filter tanggal kalau dashboard project memang mendukung filter periode data**.

### 2.3 Baris Statistik (Stat Cards)
- Deretan card horizontal (grid responsive, wrap ke bawah di layar kecil), masing-masing berisi:
  - Label kecil (abu-abu)
  - Angka besar bold
  - Indikator perubahan (opsional): panah/persen dengan warna hijau (naik) atau merah (turun) + teks "dari kemarin/periode sebelumnya"
  - Ikon kecil di kanan atas card dalam kotak rounded berwarna soft (background pastel sesuai kategori)
- **Jumlah dan isi card menyesuaikan metrik yang benar-benar dihitung/disediakan backend/state project ini.** Jangan menambah metrik yang datanya tidak ada.

### 2.4 Grafik Utama (dua kolom, area terbesar di dashboard)
**Kolom kiri (lebih lebar, ±60%)**: Card grafik tren (line/area chart)
- Judul card + toggle tab (mis. "Penjualan" / "Laba") kalau project punya lebih dari satu metrik tren yang bisa ditoggle
- Dropdown filter rentang waktu (mis. "7 Hari Terakhir") — sesuaikan pilihan dengan opsi filter yang sudah didukung data/API
- Chart area dengan gradient fill di bawah garis, garis warna biru, titik data terlihat pada hover, tooltip custom menampilkan tanggal + nilai saat hover
- Sumbu Y pakai format angka ringkas (mis. "5jt", "4jt") sesuai skala data asli
- Sumbu X menampilkan label tanggal/periode

**Kolom kanan (±40%)**: Card breakdown/distribusi (donut/pie chart)
- Judul card + dropdown filter periode
- Donut chart di kiri dengan teks total di tengah donut
- Legend di kanan: list kategori dengan bullet warna, nama kategori, persentase, dan nominal
- **Kategori dan data harus diambil dari struktur data produk/kategori yang benar-benar ada di project**, bukan kategori baru yang dikarang.

### 2.5 Baris Bawah (dua/tiga kolom)
**Kolom kiri (lebih lebar)**: Tabel "Transaksi Terbaru" / data terbaru yang relevan dengan fitur utama project
- Header card: judul + tombol "Lihat Semua" (link ke halaman list lengkap yang sudah ada, misal halaman Transaksi)
- Tabel dengan kolom: waktu, item/produk (dengan ikon kecil khas kategori), identifier (nomor/ID), nama pelanggan, status (badge pill warna — hijau untuk sukses, sesuaikan warna lain untuk status pending/gagal **sesuai enum status yang sudah ada di project**), nominal total (rata kanan)
- Baris footer tabel: ringkasan total (total transaksi, total penjualan, total laba, rata-rata per transaksi) dalam bentuk mini-stat dengan ikon — **hanya tampilkan metrik yang memang dihitung**.

**Kolom kanan**: dua card ditumpuk
1. **Produk/Item Terlaris**: list ranking (nomor urut), nama, progress bar horizontal proporsional terhadap volume, jumlah transaksi di kanan. Data dari fitur produk terlaris yang sudah ada / bisa dihitung dari data transaksi.
2. **Stok Produk** (atau card ringkasan lain yang relevan): list nama kategori/produk dengan ikon, label "Stok", dan angka. Kalau project tidak punya konsep stok, ganti card ini dengan ringkasan lain yang relevan (mis. status sistem, aktivitas terbaru, dll) — jangan paksa istilah "stok" kalau domainnya beda.

---

## 3. Komponen & Interaksi

- **Card**: semua card pakai container seragam — putih, border `border-gray-100`, `rounded-xl`, `shadow-sm`, padding konsisten (`p-5`/`p-6`).
- **Badge status**: pill rounded-full, padding kecil, warna background soft + teks warna solid sesuai status (contoh: sukses = `bg-green-50 text-green-700`).
- **Dropdown filter**: button kecil dengan border, teks + ikon chevron down, buka dropdown/select native atau custom sesuai library yang sudah dipakai project (jangan install library baru kalau sudah ada solusi serupa di project).
- **Tombol primary**: biru solid, teks putih, rounded-lg, dipakai untuk aksi utama (mis. "Top Up", "Tambah", dsb. — sesuai aksi nyata yang ada).
- **Hover states**: baris tabel, item menu sidebar, tombol — semua harus punya transisi hover halus (`transition-colors`).
- **Responsiveness**: sidebar collapse/hidden di mobile (hamburger menu), stat cards jadi scroll horizontal atau grid 2 kolom di tablet, grafik & tabel stack vertikal di layar kecil.

---

## 4. Yang TIDAK Boleh Dilakukan

- ❌ Jangan mengubah struktur data, state management, atau alur logic bisnis yang sudah ada.
- ❌ Jangan mengganti library charting/tabel yang sudah dipakai project kecuali benar-benar tidak mendukung kebutuhan visual di atas (kalau perlu ganti, minta konfirmasi dulu sebelum eksekusi).
- ❌ Jangan menambahkan fitur baru (mis. sistem saldo, notifikasi, search global) kalau backend/data-nya belum ada — cukup siapkan slot UI dan tandai TODO.
- ❌ Jangan menghapus fitur/menu yang sudah ada di project hanya karena tidak muncul di gambar referensi.
- ❌ Jangan hardcode teks/angka dari gambar referensi ke dalam kode final.

---

## 5. Langkah Kerja yang Disarankan untuk Agent

1. Inventarisasi komponen dashboard yang sudah ada (file/komponen apa saja yang membentuk halaman dashboard saat ini) dan sumber datanya.
2. Petakan setiap section desain referensi (sidebar, topbar, stat cards, grafik, tabel, side cards) ke komponen/data yang sudah ada, catat mana yang butuh komponen baru murni presentational.
3. Buat/perbarui komponen UI secara modular (mis. `StatCard`, `TrendChartCard`, `DonutBreakdownCard`, `RecentTransactionsTable`, `TopProductsCard`, `SidebarNav`) — reuse komponen yang sudah ada bila style-nya bisa disesuaikan, jangan duplikasi logic.
4. Terapkan desain system (warna, radius, shadow, spacing) secara konsisten lewat Tailwind config/theme, bukan style acak per komponen.
5. Uji responsive di breakpoint mobile, tablet, desktop.
6. Pastikan tidak ada data dummy tertinggal — semua binding ke state/props/API asli.
7. Laporkan di akhir: bagian mana yang sudah 1:1 sesuai referensi, dan bagian mana yang disesuaikan/di-skip karena keterbatasan fitur project saat ini.

---

## Referensi Visual
Gambar referensi desain: `dashboard-reference.png` (dashboard admin konter pulsa "KonterKu" — sidebar kiri, topbar, 5 stat card, grafik tren + donut chart, tabel transaksi terbaru, produk terlaris, stok produk).
