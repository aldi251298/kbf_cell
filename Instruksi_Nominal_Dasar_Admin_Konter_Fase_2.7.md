# Instruksi Lengkap — Nominal Dasar Alpines, Biaya Admin Konter, & Pendapatan Bersih
### Fase 2.7: Koreksi Sumber Nominal + Sistem Biaya Admin Konter

**Versi:** 1.0
**Target pembaca:** AI coding agent
**Konteks:** Dokumen ini melakukan 2 perubahan besar: (1) **membalik kembali** prioritas ekstraksi nominal Alpines dari "selalu pakai potongan saldo" menjadi "utamakan sumber eksplisit, fallback ke saldo" — ini koreksi atas keputusan Fase sebelumnya yang ternyata keliru untuk kebutuhan bisnis sekarang; (2) menambahkan sistem biaya admin konter yang dijumlahkan ke nominal dasar untuk menghasilkan nominal final yang ditampilkan di dashboard.

---

## 1. KOREKSI PENTING — Baca Ini Dulu Sebelum Mulai

**Keputusan lama (harus dibatalkan):** parser Alpines saat ini SELALU mengambil nominal dari angka `B` di pola `Saldo A - B = C`, untuk SEMUA jenis transaksi Alpines, tanpa kecuali.

**Kenapa ini keliru:** angka `B` (potongan saldo) **sudah termasuk fee internal Alpines** (biasanya beberapa ratus/seribu rupiah), sementara nominal yang perlu ditampilkan di dashboard adalah **harga dasar produk murni** (tanpa fee Alpines apa pun) — karena fee Alpines itu nanti akan "dilebur" ke dalam biaya admin konter yang dihitung terpisah (Bagian 3), bukan dijumlah dua kali.

**Keputusan baru (final):** kembalikan ke prinsip **utamakan sumber nominal eksplisit dari teks** (angka yang benar-benar disebut sebagai harga produk), **fallback ke potongan saldo HANYA kalau sumber eksplisit benar-benar tidak ada**. Ini berlaku untuk **semua jenis transaksi Alpines**, tidak terkecuali.

---

## 2. Ekstraksi `nominal_dasar` Alpines — Urutan Prioritas Final

Ganti total fungsi ekstraksi nominal Alpines yang ada sekarang dengan versi ini:

```typescript
function bersihkanAngka(str: string): number {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""), 10);
}

// Pola 1: keyword NOMINAL: eksplisit
const polaNominalEksplisit = /NOMINAL:\s*([\d.,]+)/i;

// Pola 2 (BARU, PENTING): angka 4-7 digit yang muncul TEPAT SEBELUM pola KODE.NOMOR
// Menangkap format seperti: "15000 TSBYU15.085198025507", "30000 AX30.083877750811",
// "TOKEN 20000 PH20.50160790239"
const polaAngkaSebelumKode = /(\d{4,7})\s+[A-Z0-9]{2,15}\.\d{8,13}/i;

function ekstrakDariSegmenSnRef(rawText: string): number | null {
  // Pola 3: segmen posisional di SN/Ref, format X/Y/angka/nomorHP/... 
  // mis. "GOPAY/Jasmisaputra/100000/081372331339/REFF:..." -> ambil komponen numerik
  //      yang BUKAN nomor HP (bukan 10-13 digit diawali 08)
  const snRefMatch = rawText.match(/SN\/Ref:?\s*([\s\S]*?)(?=\s*Saldo\s+[\d.,]+)/i);
  if (!snRefMatch) return null;

  const segmen = snRefMatch[1].split("/").map(s => s.trim());
  for (const s of segmen) {
    const angka = s.replace(/\./g, "");
    if (/^\d{4,7}$/.test(angka) && !/^0[0-9]{9,12}$/.test(angka)) {
      return parseInt(angka, 10);
    }
  }
  return null;
}

interface HasilNominalDasarAlpines {
  nominalDasar: number;
  sumberDasar: "eksplisit_nominal" | "eksplisit_header" | "eksplisit_segmen" | "fallback_saldo";
}

function ekstraksiNominalDasarAlpines(
  rawText: string,
  potonganSaldo: number
): HasilNominalDasarAlpines {
  const nominalEksplisit = rawText.match(polaNominalEksplisit);
  if (nominalEksplisit) {
    return { nominalDasar: bersihkanAngka(nominalEksplisit[1]), sumberDasar: "eksplisit_nominal" };
  }

  const angkaSebelumKode = rawText.match(polaAngkaSebelumKode);
  if (angkaSebelumKode) {
    return { nominalDasar: bersihkanAngka(angkaSebelumKode[1]), sumberDasar: "eksplisit_header" };
  }

  const segmenAngka = ekstrakDariSegmenSnRef(rawText);
  if (segmenAngka != null) {
    return { nominalDasar: segmenAngka, sumberDasar: "eksplisit_segmen" };
  }

  // FALLBACK TERAKHIR — hanya kalau benar-benar tidak ada sumber eksplisit
  // (kasus ini terjadi untuk voucher/game top-up yang SN/Ref-nya berupa kode/UUID, bukan angka)
  return { nominalDasar: potonganSaldo, sumberDasar: "fallback_saldo" };
}
```

### Fungsi Ekstraksi Saldo (Tetap Sama, untuk Referensi)

```typescript
function ekstraksiSaldoAlpines(rawText: string): { saldoAwal: number; nominal: number; saldoAkhir: number } | null {
  const pola = /Saldo\s+([\d.]+)\s*-\s*([\d.]+)\s*=\s*([\d.]+)\s*@/i;
  const match = rawText.match(pola);
  if (!match) return null;

  return {
    saldoAwal: bersihkanAngka(match[1]),
    nominal: bersihkanAngka(match[2]),
    saldoAkhir: bersihkanAngka(match[3]),
  };
}
```

### Verifikasi Terhadap SELURUH Contoh yang Sudah Kita Kumpulkan

Wajib diuji semua sebelum lanjut ke Bagian 3 — tambahkan sebagai test case (lihat Bagian 6):

| Notifikasi | Sumber yang Match | `nominal_dasar` |
|---|---|---|
| DANA format 1 (`DANA TOPUP/MXX INDXXXXXX/50000/...`) | Pola 3 (segmen) | 50000 |
| DANA format 2 (`NOMINAL:200000`) | Pola 1 | 200000 |
| GoPay (`GOPAY/Jasmisaputra/100000/...`) | Pola 3 (segmen) | 100000 |
| Telkomsel BYU (`15000 TSBYU15.085198025507`) | Pola 2 (BARU) | 15000 |
| Axis Reguler (`30000 AX30.083877750811`) | Pola 2 (BARU) | 30000 |
| Token PH (`TOKEN 20000 PH20.50160790239`) | Pola 2 (BARU) | 20000 |
| Voucher AIGO/Three (SN/Ref cuma kode, bukan angka posisional) | Fallback saldo | (dari potongan saldo, apa adanya) |
| Free Fire (SN/Ref berupa UUID) | Fallback saldo | (dari potongan saldo, apa adanya) |

---

## 3. Sistem Biaya Admin Konter (Final, Semua Kategori)

### 3.1 Konsep

```
nominal_final (yang tampil di dashboard) = nominal_dasar + admin_konter
```

`admin_konter` adalah **biaya flat yang dibayar konsumen ke konter**, ditentukan lewat tabel tier di bawah — **sudah termasuk** fee internal Alpines/Digipos di dalamnya (tidak dijumlah terpisah lagi).

### 3.2 Tabel Tier Admin (Final)

```typescript
interface TierAdmin { batasAtas: number; admin: number }
interface AturanAdminKonter {
  jenisTransaksi: string;
  namaProdukFilter?: RegExp;
  tierList: TierAdmin[];
}

const ATURAN_ADMIN_KONTER: AturanAdminKonter[] = [
  {
    jenisTransaksi: "ewallet",
    namaProdukFilter: /^DANA$/i,
    tierList: [
      { batasAtas: 100000, admin: 3000 },   // <= 100.000
      { batasAtas: Infinity, admin: 5000 }, // > 100.000
    ],
  },
  {
    jenisTransaksi: "ewallet", // e-wallet SELAIN DANA (GoPay, OVO, ShopeePay, dst) — flat
    tierList: [{ batasAtas: Infinity, admin: 5000 }],
  },
  {
    jenisTransaksi: "pln", // berlaku PLN via Digipos MAUPUN Alpines
    tierList: [
      { batasAtas: 50000, admin: 4000 },
      { batasAtas: Infinity, admin: 5000 },
    ],
  },
  {
    jenisTransaksi: "tagihan", // sama persis tier PLN (tagihan Telkom, dll)
    tierList: [
      { batasAtas: 50000, admin: 4000 },
      { batasAtas: Infinity, admin: 5000 },
    ],
  },
  {
    jenisTransaksi: "pulsa", // berlaku Digipos MAUPUN Alpines
    tierList: [{ batasAtas: Infinity, admin: 2000 }],
  },
  {
    jenisTransaksi: "paket_data",
    tierList: [{ batasAtas: Infinity, admin: 2000 }],
  },
  // paket_nelpon, game_topup, voucher_fisik, dan kategori "lainnya_*" SENGAJA
  // TIDAK didaftarkan — admin default 0 sampai ada info tarif pasti dari pemilik konter.
  // JANGAN menebak tarif untuk kategori ini.
];

function terapkanAdminKonter(
  nominalDasar: number | null,
  jenisTransaksi: string,
  namaProduk: string | null
): { nominalFinal: number | null; adminKonter: number; adaAturan: boolean } {
  if (nominalDasar == null) {
    return { nominalFinal: null, adminKonter: 0, adaAturan: false };
  }

  const kandidat = ATURAN_ADMIN_KONTER.filter(a => a.jenisTransaksi === jenisTransaksi);
  const spesifik = kandidat.find(a => a.namaProdukFilter?.test(namaProduk ?? ""));
  const aturan = spesifik ?? kandidat.find(a => !a.namaProdukFilter);

  if (!aturan) {
    return { nominalFinal: nominalDasar, adminKonter: 0, adaAturan: false };
  }

  const tier = aturan.tierList.find(t => nominalDasar <= t.batasAtas);
  const admin = tier?.admin ?? 0;
  return { nominalFinal: nominalDasar + admin, adminKonter: admin, adaAturan: true };
}
```

### 3.3 Penerapan — WAJIB di KEDUA Provider (Digipos dan Alpines)

**Ini berlaku universal**, letakkan sebagai langkah TERAKHIR di parser, setelah `nominal_dasar` berhasil didapat dengan cara masing-masing provider (Digipos: ekstraksi seperti biasa yang sudah ada, tidak berubah; Alpines: pakai `ekstraksiNominalDasarAlpines` dari Bagian 2).

**Contoh penerapan — Digipos (pulsa Rp15.000, TIDAK PERNAH ada campuran fee di notifikasi Digipos):**
```typescript
// nominal_dasar dari ekstraksi Digipos yang SUDAH ADA, TIDAK DIUBAH cara ekstraksinya
const nominalDasarDigipos = 15000; // hasil ekstraksi seperti biasa

const { nominalFinal, adminKonter } = terapkanAdminKonter(nominalDasarDigipos, "pulsa", null);
// nominalFinal = 17000, adminKonter = 2000
```

**Contoh penerapan — Alpines (DANA Rp10.000):**
```typescript
const hasilSaldo = ekstraksiSaldoAlpines(rawText); // { nominal: 10650, ... }
const { nominalDasar, sumberDasar } = ekstraksiNominalDasarAlpines(rawText, hasilSaldo.nominal); // 10000, "eksplisit_nominal"
const { nominalFinal, adminKonter } = terapkanAdminKonter(nominalDasar, "ewallet", "DANA");
// nominalFinal = 13000, adminKonter = 3000
```

### 3.4 Struktur Payload Final untuk Insert Database

```typescript
const payload = {
  nominal: nominalFinal, // INI yang tampil di dashboard sebagai "Nominal"
  status,
  jenis_transaksi,
  nomor_tujuan,
  nama_produk,
  perlu_review: sumberDasar === "fallback_saldo" || !adaAturan, // tandai kalau kurang presisi
  detail_tambahan: {
    nominal_dasar: nominalDasar,
    sumber_nominal_dasar: sumberDasar, // HANYA untuk Alpines; Digipos boleh diisi "digipos_native"
    admin_konter: adminKonter,
    saldo_konter: hasilSaldo ? { sebelum: hasilSaldo.saldoAwal, terpakai: hasilSaldo.nominal, sesudah: hasilSaldo.saldoAkhir } : undefined,
  },
};
```

**Catatan verifikasi ulang terhadap 4 contoh terbaru yang sudah dikonfirmasi:**

| Notifikasi | `nominal_dasar` | `admin_konter` | `nominal` final |
|---|---|---|---|
| Telkomsel BYU 15000 | 15.000 | 2.000 (pulsa) | **17.000** |
| DANA NOMINAL:200000 | 200.000 | 5.000 (DANA >100rb) | **205.000** |
| Axis Reguler 30000 | 30.000 | 2.000 (pulsa) | **32.000** |
| TOKEN 20000 PH20 | 20.000 | 4.000 (PLN ≤50rb) | **24.000** |

---

## 4. Fitur Baru: Card Pendapatan Bersih Konter di Dashboard Utama

### 4.1 Fungsi Pengambilan Data

```typescript
async function ambilPendapatanBersih(konterId: string, dari: Date, sampai: Date): Promise<number> {
  const { data } = await supabase
    .from("transaksi")
    .select("detail_tambahan")
    .eq("konter_id", konterId)
    .eq("status", "sukses")
    .gte("waktu_transaksi", dari.toISOString())
    .lte("waktu_transaksi", sampai.toISOString());

  return (data ?? []).reduce((total, row) => total + (row.detail_tambahan?.admin_konter ?? 0), 0);
}
```

### 4.2 Komponen Card (Tambahan Baru, Tidak Mengubah Card Omzet yang Sudah Ada)

```tsx
function CardPendapatanBersih({ konterId }: { konterId: string }) {
  const [pendapatan, setPendapatan] = useState<number | null>(null);

  useEffect(() => {
    const awal = new Date(); awal.setHours(0, 0, 0, 0);
    const akhir = new Date(); akhir.setHours(23, 59, 59, 999);
    ambilPendapatanBersih(konterId, awal, akhir).then(setPendapatan);
  }, [konterId]);

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <p className="text-sm text-gray-500">Pendapatan Bersih Hari Ini</p>
      <p className="text-2xl font-bold text-emerald-600">
        {pendapatan == null ? "..." : `Rp${pendapatan.toLocaleString("id-ID")}`}
      </p>
      <p className="text-xs text-gray-400 mt-1">Dari biaya admin, di luar harga produk</p>
    </div>
  );
}
```

Letakkan di halaman utama dashboard, **berdampingan** dengan card omzet total yang sudah ada (kalau ada) — jangan mengganti/menghapus card yang sudah ada, cuma menambahkan card baru ini.

### 4.3 Opsional: Filter Periode Lain

Fungsi `ambilPendapatanBersih()` sudah menerima parameter `dari`/`sampai` bebas — kalau nanti ingin tambah pilihan "Minggu Ini"/"Bulan Ini", tinggal panggil fungsi yang sama dengan rentang tanggal berbeda, tidak perlu bikin fungsi baru.

---

## 5. Kriteria Selesai

1. Parser Alpines **tidak lagi** selalu mengambil nominal dari potongan saldo — sekarang mengutamakan sumber eksplisit (Bagian 2), fallback ke saldo hanya kalau benar-benar tidak ada sumber lain.
2. Biaya admin konter diterapkan untuk **kedua provider** (Digipos & Alpines), sesuai tabel tier final Bagian 3.2.
3. `voucher_fisik`, `paket_nelpon`, `game_topup`, dan kategori belum dikenal **tidak** mendapat admin (tetap `nominal = nominal_dasar` apa adanya) — ini disengaja, bukan bug, sampai ada info tarif pasti.
4. Semua field baru (`nominal_dasar`, `sumber_nominal_dasar`, `admin_konter`) tersimpan di `detail_tambahan` untuk audit, untuk **setiap** transaksi baik Digipos maupun Alpines.
5. Card "Pendapatan Bersih Hari Ini" tampil di dashboard utama, angka sesuai penjumlahan `admin_konter` transaksi sukses hari ini, terpisah dari card omzet total.
6. `test-parser-local.ts` diperbarui total — semua ekspektasi `nominal` untuk pulsa/paket data/PLN/e-wallet (Digipos maupun Alpines) direvisi sesuai nilai final yang sudah termasuk admin (lihat Bagian 6).

---

## 6. Update Wajib ke `test-parser-local.ts`

Ganti nilai `nominal` di seluruh test case yang terpengaruh dengan nilai final (sudah termasuk admin):

```typescript
// PULSA
// "Isi ulang pulsa Rp 20000..." -> nominal_dasar 20000, admin pulsa 2000 -> nominal: 22000
// "Axis Reguler 30000 AX30..." -> nominal_dasar 30000, admin pulsa 2000 -> nominal: 32000
// "Telkomsel BYU 15000 TSBYU15..." -> nominal_dasar 15000, admin pulsa 2000 -> nominal: 17000

// PAKET DATA
// "byU Kaget ... Rp41800..." -> nominal_dasar 41800, admin paket_data 2000 -> nominal: 43800
// "Combo Sakti ... Rp120000..." -> nominal_dasar 120000, admin paket_data 2000 -> nominal: 122000
// "Super Seru Internet ... Rp30000..." -> nominal_dasar 30000, admin paket_data 2000 -> nominal: 32000
// Voucher AIGO (fallback saldo, nominal_dasar = 11950, TIDAK ada aturan admin untuk paket_data
//   dari Alpines dgn sumber fallback -> tetap dapat admin paket_data 2000) -> nominal: 13950
// Voucher Three (fallback saldo, nominal_dasar = 13150) -> nominal: 15150

// PLN
// "...senilai 100000..." -> nominal_dasar 100000, admin PLN >50rb: 5000 -> nominal: 105000
// "...senilai 20000..." -> nominal_dasar 20000, admin PLN <=50rb: 4000 -> nominal: 24000
// Token PH "TOKEN 20000 PH20..." -> nominal_dasar 20000, admin PLN <=50rb: 4000 -> nominal: 24000

// E-WALLET
// DANA format 1 (nominal_dasar 50000, <=100rb) -> admin 3000 -> nominal: 53000
// DANA format 2 (NOMINAL:200000, >100rb) -> admin 5000 -> nominal: 205000
// GoPay (nominal_dasar 100000, e-wallet selain DANA flat) -> admin 5000 -> nominal: 105000

// GAME TOP-UP (TIDAK ada admin, tetap nominal_dasar apa adanya dari fallback saldo)
// Free Fire (fallback saldo, nominal_dasar = 14450) -> nominal: 14450 (TIDAK berubah, tanpa admin)
```

**Instruksikan agent untuk memperbarui SEMUA nilai `nominal` di test case sesuai perhitungan di atas**, jalankan `test-parser-local.ts`, pastikan semua PASS dengan nilai baru sebelum menyatakan pekerjaan selesai. Tambahkan juga assersi baru untuk field `detail_tambahan.admin_konter` dan `detail_tambahan.nominal_dasar` di beberapa kasus kunci (mis. DANA, PLN, pulsa) untuk memverifikasi kedua angka komponennya benar, bukan cuma hasil akhirnya.
