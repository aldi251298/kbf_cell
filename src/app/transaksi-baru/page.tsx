"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  addTransaksiManual,
  getKonterList,
} from "@/services";
import type { Konter } from "@/types";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Receipt,
  Phone,
  Wallet,
  Gamepad2,
  CreditCard,
  Building2,
  Wifi,
  DollarSign,
} from "lucide-react";

// Product categories with their options
const KATEGORI_PRODUK = [
  { value: "pulsa", label: "Pulsa", icon: Phone },
  { value: "data", label: "Paket Data", icon: Wifi },
  { value: "voucher", label: "Voucher", icon: Receipt },
  { value: "p2p", label: "Transfer P2P", icon: DollarSign },
  { value: "ewallet", label: "Top-Up E-Wallet", icon: Wallet },
  { value: "ppob", label: "PPOB & Tagihan", icon: Building2 },
  { value: "gametopup", label: "Top-Up Game", icon: Gamepad2 },
  { value: "keuangan", label: "Jasa Keuangan", icon: CreditCard },
];

// Product list by category
const PRODUK_BY_KATEGORI: Record<string, { kode: string; nama: string; harga: number }[]> = {
  pulsa: [
    { kode: "P5", nama: "Pulsa 5.000", harga: 5500 },
    { kode: "P10", nama: "Pulsa 10.000", harga: 10500 },
    { kode: "P20", nama: "Pulsa 20.000", harga: 20500 },
    { kode: "P25", nama: "Pulsa 25.000", harga: 25500 },
    { kode: "P50", nama: "Pulsa 50.000", harga: 50500 },
    { kode: "P100", nama: "Pulsa 100.000", harga: 100500 },
  ],
  data: [
    { kode: "D1", nama: "Data 1GB/30 Hari", harga: 15000 },
    { kode: "D2", nama: "Data 3GB/30 Hari", harga: 35000 },
    { kode: "D3", nama: "Data 5GB/30 Hari", harga: 50000 },
    { kode: "D4", nama: "Data 10GB/30 Hari", harga: 85000 },
  ],
  voucher: [
    { kode: "V1", nama: "Voucher 20.000", harga: 21000 },
    { kode: "V2", nama: "Voucher 50.000", harga: 51000 },
    { kode: "V3", nama: "Voucher 100.000", harga: 101000 },
  ],
  p2p: [
    { kode: "P2P10", nama: "Transfer 10.000", harga: 10500 },
    { kode: "P2P20", nama: "Transfer 20.000", harga: 20500 },
    { kode: "P2P50", nama: "Transfer 50.000", harga: 50500 },
  ],
  ewallet: [
    { kode: "EW-DANA10", nama: "Top-Up DANA 10.000", harga: 10500 },
    { kode: "EW-DANA25", nama: "Top-Up DANA 25.000", harga: 25500 },
    { kode: "EW-DANA50", nama: "Top-Up DANA 50.000", harga: 50500 },
    { kode: "EW-OVO10", nama: "Top-Up OVO 10.000", harga: 10500 },
    { kode: "EW-OVO25", nama: "Top-Up OVO 25.000", harga: 25500 },
    { kode: "EW-OVO50", nama: "Top-Up OVO 50.000", harga: 50500 },
    { kode: "EW-GOPAY10", nama: "Top-Up GoPay 10.000", harga: 10500 },
    { kode: "EW-GOPAY25", nama: "Top-Up GoPay 25.000", harga: 25500 },
    { kode: "EW-GOPAY50", nama: "Top-Up GoPay 50.000", harga: 50500 },
    { kode: "EW-SHOPPEE10", nama: "Top-Up ShopeePay 10.000", harga: 10500 },
    { kode: "EW-SHOPPEE25", nama: "Top-Up ShopeePay 25.000", harga: 25500 },
    { kode: "EW-SHOPPEE50", nama: "Top-Up ShopeePay 50.000", harga: 50500 },
    { kode: "EW-LINKAJA10", nama: "Top-Up LinkAja 10.000", harga: 10500 },
    { kode: "EW-LINKAJA25", nama: "Top-Up LinkAja 25.000", harga: 25500 },
    { kode: "EW-LINKAJA50", nama: "Top-Up LinkAja 50.000", harga: 50500 },
  ],
  ppob: [
    { kode: "PLN-20K", nama: "PLN 20.000", harga: 21000 },
    { kode: "PLN-50K", nama: "PLN 50.000", harga: 51000 },
    { kode: "PLN-100K", nama: "PLN 100.000", harga: 101000 },
    { kode: "PLN-200K", nama: "PLN 200.000", harga: 201000 },
    { kode: "PLN-500K", nama: "PLN 500.000", harga: 501000 },
    { kode: "PDAM-MIN", nama: "PDAM (Min. 15.000)", harga: 16000 },
    { kode: "BPJS-1", nama: "BPJS Kelas 1", harga: 155000 },
    { kode: "BPJS-2", nama: "BPJS Kelas 2", harga: 135000 },
    { kode: "BPJS-3", nama: "BPJS Kelas 3", harga: 115000 },
    { kode: "INET-ILM", nama: "Tagihan IndiHome", harga: 25500 },
    { kode: "INET-BIZ", nama: "Tagihan Biznet", harga: 30500 },
    { kode: "KREDIT-MIN", nama: "Angsuran Kredit (Min. 50.000)", harga: 55000 },
  ],
  gametopup: [
    { kode: "ML-50", nama: "Mobile Legends 50 Diamond", harga: 11000 },
    { kode: "ML-150", nama: "Mobile Legends 150 Diamond", harga: 32000 },
    { kode: "ML-350", nama: "Mobile Legends 350 Diamond", harga: 72000 },
    { kode: "FF-70", nama: "Free Fire 70 Diamond", harga: 11000 },
    { kode: "FF-360", nama: "Free Fire 360 Diamond", harga: 52000 },
    { kode: "PUBG-60", nama: "PUBG Mobile 60 UC", harga: 16000 },
    { kode: "PUBG-325", nama: "PUBG Mobile 325 UC", harga: 77000 },
    { kode: "GI-60", nama: "Genshin Impact 60 Genesis Crystal", harga: 17000 },
    { kode: "GP-10K", nama: "Google Play Voucher 10.000", harga: 11000 },
    { kode: "GP-50K", nama: "Google Play Voucher 50.000", harga: 52000 },
    { kode: "NET-30", nama: "Netflix Voucher 30 Hari", harga: 125000 },
    { kode: "SPOT-1", nama: "Spotify Premium 1 Bulan", harga: 17000 },
  ],
  keuangan: [
    { kode: "TF-MIN", nama: "Transfer Min. 10.000", harga: 11000 },
    { kode: "TF-50", nama: "Transfer 50.000", harga: 51500 },
    { kode: "TF-100", nama: "Transfer 100.000", harga: 101500 },
    { kode: "TUNAI-MIN", nama: "Tarik Tunai Min. 100.000", harga: 102000 },
  ],
};

// E-wallet platforms
const E_WALLET_PLATFORMS = [
  { value: "dana", label: "DANA" },
  { value: "ovo", label: "OVO" },
  { value: "gopay", label: "GoPay" },
  { value: "shopeepay", label: "ShopeePay" },
  { value: "linkaja", label: "LinkAja" },
  { value: "grabpay", label: "GrabPay" },
  { value: "maxim", label: "Maxim" },
];

// PPOB payment types
const PPOB_PAYMENT_TYPES = [
  { value: "pln", label: "Listrik (PLN)" },
  { value: "pdam", label: "Air (PDAM)" },
  { value: "bpjs", label: "BPJS Kesehatan" },
  { value: "internet", label: "Internet (IndiHome, Biznet, dll)" },
  { value: "cicilan", label: "Cicilan/Kredit" },
];

export default function TransaksiBaruPage() {
  const router = useRouter();
  const [konterList, setKonterList] = useState<Konter[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [konterId, setKonterId] = useState("");
  const [kategori, setKategori] = useState("");
  const [produk, setProduk] = useState("");
  const [nomorTujuan, setNomorTujuan] = useState("");
  const [platform, setPlatform] = useState("");
  const [jenisPembayaran, setJenisPembayaran] = useState("");
  const [idGame, setIdGame] = useState("");
  const [namaPenerima, setNamaPenerima] = useState("");
  const [rekeningTujuan, setRekeningTujuan] = useState("");
  const [status, setStatus] = useState<"sukses" | "gagal" | "pending">("sukses");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch konter list
  useEffect(() => {
    getKonterList().then(setKonterList);
  }, []);

  // Get selected product details
  const selectedProduct = useMemo(() => {
    if (!kategori || !produk) return null;
    const products = PRODUK_BY_KATEGORI[kategori] || [];
    return products.find((p) => p.kode === produk);
  }, [kategori, produk]);

  // Reset product when category changes
  const handleKategoriChange = (value: string) => {
    setKategori(value);
    setProduk("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!konterId) {
      setError("Pilih konter terlebih dahulu");
      return;
    }
    if (!kategori) {
      setError("Pilih kategori produk");
      return;
    }
    if (!produk) {
      setError("Pilih produk");
      return;
    }

    // Validate nomor tujuan for certain categories
    if (["pulsa", "data", "p2p"].includes(kategori) && !nomorTujuan.trim()) {
      setError(`Nomor tujuan wajib diisi untuk ${kategori}`);
      return;
    }

    // Validate platform for e-wallet
    if (kategori === "ewallet" && !platform) {
      setError("Pilih platform e-wallet");
      return;
    }

    // Validate payment type for PPOB
    if (kategori === "ppob" && !jenisPembayaran) {
      setError("Pilih jenis pembayaran");
      return;
    }

    setLoading(true);

    try {
      const konter = konterList.find((k) => k.id === konterId);

      await addTransaksiManual({
        konterId,
        konterNama: konter?.nama || "Unknown",
        nomorTujuan: nomorTujuan || "",
        produk: {
          nama: selectedProduct?.nama || produk,
          kategori: kategori as any,
          nominal: selectedProduct?.harga || 0,
        },
        nominal: selectedProduct?.harga || 0,
        status,
        detail: {
          platform: platform || undefined,
          jenisPembayaran: jenisPembayaran || undefined,
          idGame: idGame || undefined,
          namaPenerima: namaPenerima || undefined,
          rekeningTujuan: rekeningTujuan || undefined,
          namaProduk: selectedProduct?.nama || undefined,
        },
        errorMessage: status === "gagal" ? errorMessage || "Transaksi gagal" : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/transaksi");
      }, 1500);
    } catch (err) {
      setError("Gagal menambahkan transaksi. Silakan coba lagi.");
      console.error("Error adding transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setKonterId("");
    setKategori("");
    setProduk("");
    setNomorTujuan("");
    setPlatform("");
    setJenisPembayaran("");
    setIdGame("");
    setNamaPenerima("");
    setRekeningTujuan("");
    setStatus("sukses");
    setErrorMessage("");
    setError("");
    setSuccess(false);
  };

  // Konter options
  const konterOptions = [
    { value: "", label: "Pilih Konter" },
    ...konterList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  // Kategori options
  const kategoriOptions = [
    { value: "", label: "Pilih Kategori" },
    ...KATEGORI_PRODUK.map((k) => ({
      value: k.value,
      label: k.label,
    })),
  ];

  // Product options
  const productOptions = (PRODUK_BY_KATEGORI[kategori] || []).map((p) => ({
    value: p.kode,
    label: `${p.nama} - ${formatRupiah(p.harga)}`,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Input Transaksi Baru
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Tambahkan transaksi secara manual
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            Reset Form
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={loading}
            disabled={loading}
          >
            Simpan Transaksi
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Transaksi berhasil ditambahkan!</p>
              <p className="text-sm text-green-600">Mengalihkan ke halaman transaksi...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Konter Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Konter <span className="text-red-500">*</span>
              </label>
              <Select
                options={konterOptions}
                value={konterId}
                onChange={setKonterId}
                placeholder="Pilih Konter"
              />
            </div>

            {/* Kategori Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <Select
                options={kategoriOptions}
                value={kategori}
                onChange={handleKategoriChange}
                placeholder="Pilih Kategori"
              />
            </div>

            {/* Product Selection */}
            {kategori && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Produk <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[{ value: "", label: "Pilih Produk" }, ...productOptions]}
                  value={produk}
                  onChange={setProduk}
                  placeholder="Pilih Produk"
                />
              </div>
            )}

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">{selectedProduct.nama}</p>
                    <p className="text-sm text-blue-600">Harga: {formatRupiah(selectedProduct.harga)}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {KATEGORI_PRODUK.find((k) => k.value === kategori)?.label}
                  </Badge>
                </div>
              </div>
            )}

            {/* Dynamic Fields based on Category */}
            {["pulsa", "data", "p2p"].includes(kategori) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nomor Tujuan <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: 08123456789"
                  value={nomorTujuan}
                  onChange={(e) => setNomorTujuan(e.target.value)}
                />
              </div>
            )}

            {/* E-Wallet Platform Selection */}
            {kategori === "ewallet" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Platform E-Wallet <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[{ value: "", label: "Pilih Platform" }, ...E_WALLET_PLATFORMS]}
                    value={platform}
                    onChange={setPlatform}
                    placeholder="Pilih Platform"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nomor HP / Akun
                  </label>
                  <Input
                    placeholder="Nomor HP yang terdaftar"
                    value={nomorTujuan}
                    onChange={(e) => setNomorTujuan(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* PPOB Payment Type */}
            {kategori === "ppob" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Jenis Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={[{ value: "", label: "Pilih Jenis Pembayaran" }, ...PPOB_PAYMENT_TYPES]}
                    value={jenisPembayaran}
                    onChange={setJenisPembayaran}
                    placeholder="Pilih Jenis Pembayaran"
                  />
                </div>
                {jenisPembayaran === "pln" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nomor Meter / Pelanggan
                    </label>
                    <Input
                      placeholder="Masukkan nomor meter PLN"
                      value={nomorTujuan}
                      onChange={(e) => setNomorTujuan(e.target.value)}
                    />
                  </div>
                )}
                {(jenisPembayaran === "pdam" || jenisPembayaran === "internet") && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nomor Pelanggan
                    </label>
                    <Input
                      placeholder="Masukkan nomor pelanggan"
                      value={nomorTujuan}
                      onChange={(e) => setNomorTujuan(e.target.value)}
                    />
                  </div>
                )}
                {jenisPembayaran === "bpjs" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nomor BPJS
                    </label>
                    <Input
                      placeholder="Masukkan nomor BPJS"
                      value={nomorTujuan}
                      onChange={(e) => setNomorTujuan(e.target.value)}
                    />
                  </div>
                )}
                {jenisPembayaran === "cicilan" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nama Perusahaan Kredit
                      </label>
                      <Input
                        placeholder="Contoh: FIF, Adira, WOM, dll"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nomor Pelanggan
                      </label>
                      <Input
                        placeholder="Masukkan nomor pelanggan"
                        value={nomorTujuan}
                        onChange={(e) => setNomorTujuan(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Game Top-Up */}
            {kategori === "gametopup" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    ID Game
                  </label>
                  <Input
                    placeholder="Masukkan ID Game"
                    value={idGame}
                    onChange={(e) => setIdGame(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Server (jika ada)
                  </label>
                  <Input
                    placeholder="Contoh: Server 1234"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Transfer / Keuangan */}
            {kategori === "keuangan" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nomor Tujuan / Rekening
                  </label>
                  <Input
                    placeholder="Nomor HP atau rekening tujuan"
                    value={nomorTujuan}
                    onChange={(e) => setNomorTujuan(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nama Penerima
                  </label>
                  <Input
                    placeholder="Nama penerima (opsional)"
                    value={namaPenerima}
                    onChange={(e) => setNamaPenerima(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Status Transaksi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("sukses")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    status === "sukses"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Sukses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    status === "pending"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span>Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("gagal")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    status === "gagal"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <XCircle className="h-5 w-5" />
                  <span>Gagal</span>
                </button>
              </div>
            </div>

            {/* Error Message (if failed) */}
            {status === "gagal" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Pesan Error
                </label>
                <Input
                  placeholder="Alasan transaksi gagal"
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
