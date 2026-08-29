export interface FieldConfig {
  key: string;
  label: string;
  tipe: "preset_angka" | "teks_bebas" | "angka_bebas" | "dropdown";
  presetOptions?: number[];
  dropdownOptions?: { value: string; label: string }[];
  wajib: boolean;
  placeholder?: string;
  labelDinamis?: Record<string, string>; // key = nilai field lain yang jadi acuan, value = label pengganti
}

export interface FormConfigJenisTransaksi {
  jenisTransaksi: string;
  labelTampilan: string;
  fields: FieldConfig[];
}

export const FORM_CONFIG_TRANSAKSI_MANUAL: FormConfigJenisTransaksi[] = [
  {
    jenisTransaksi: "pulsa",
    labelTampilan: "Pulsa",
    fields: [
      {
        key: "nominal",
        label: "Nominal Pulsa",
        tipe: "preset_angka",
        presetOptions: [
          5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 100000,
        ],
        wajib: true,
      },
      {
        key: "nomor_tujuan",
        label: "Nomor Tujuan",
        tipe: "angka_bebas",
        placeholder: "08xxxxxxxxxx",
        wajib: true,
      },
    ],
  },
  {
    jenisTransaksi: "paket_data",
    labelTampilan: "Paket Data",
    fields: [
      {
        key: "nama_produk",
        label: "Nama Paket",
        tipe: "teks_bebas",
        placeholder: "mis. byU Kaget 11GB 28 Hari",
        wajib: true,
      },
      { key: "nominal", label: "Nominal", tipe: "angka_bebas", wajib: true },
      {
        key: "nomor_tujuan",
        label: "Nomor Tujuan",
        tipe: "angka_bebas",
        wajib: true,
      },
    ],
  },
  {
    jenisTransaksi: "paket_nelpon",
    labelTampilan: "Paket Nelpon/SMS",
    fields: [
      {
        key: "nama_produk",
        label: "Nama Paket",
        tipe: "teks_bebas",
        wajib: true,
      },
      { key: "nominal", label: "Nominal", tipe: "angka_bebas", wajib: true },
      {
        key: "nomor_tujuan",
        label: "Nomor Tujuan",
        tipe: "angka_bebas",
        wajib: true,
      },
    ],
  },
  {
    jenisTransaksi: "pln",
    labelTampilan: "PLN",
    fields: [
      {
        key: "tipe_pln",
        label: "Jenis PLN",
        tipe: "dropdown",
        dropdownOptions: [
          { value: "prabayar", label: "Prabayar (Token)" },
          { value: "pascabayar", label: "Pascabayar (Rekening)" },
        ],
        wajib: true,
      },
      {
        key: "nomor_tujuan",
        label: "Nomor Meter / ID Pelanggan",
        labelDinamis: {
          prabayar: "Nomor Meter / ID Pelanggan",
          pascabayar: "Nomor Rekening PLN",
        },
        tipe: "angka_bebas",
        wajib: true,
      },
      { key: "nominal", label: "Nominal", tipe: "angka_bebas", wajib: true },
    ],
  },
  {
    jenisTransaksi: "ewallet",
    labelTampilan: "E-Wallet (Alpines)",
    fields: [
      {
        key: "nama_produk",
        label: "Jenis E-Wallet",
        tipe: "dropdown",
        dropdownOptions: [
          { value: "DANA", label: "DANA" },
          { value: "GoPay", label: "GoPay" },
          { value: "OVO", label: "OVO" },
          { value: "ShopeePay", label: "ShopeePay" },
        ],
        wajib: true,
      },
      { key: "nominal", label: "Nominal", tipe: "angka_bebas", wajib: true },
      {
        key: "nomor_tujuan",
        label: "Nomor Tujuan",
        tipe: "angka_bebas",
        wajib: true,
      },
      {
        key: "nama_pemilik",
        label: "Nama Pemilik (opsional)",
        tipe: "teks_bebas",
        wajib: false,
      },
    ],
  },
  {
    jenisTransaksi: "voucher_fisik",
    labelTampilan: "Voucher Fisik Internet",
    fields: [
      {
        key: "provider_seluler",
        label: "Provider Seluler",
        tipe: "dropdown",
        dropdownOptions: [
          { value: "Telkomsel", label: "Telkomsel" },
          { value: "byU", label: "byU" },
          { value: "Axis", label: "Axis" },
          { value: "Three", label: "Three (3)" },
          { value: "XL", label: "XL" },
          { value: "Smartfren", label: "Smartfren" },
          { value: "Indosat", label: "Indosat" },
          { value: "Lainnya", label: "Lainnya" },
        ],
        wajib: true,
      },
      {
        key: "nama_produk",
        label: "Nama/Detail Voucher",
        tipe: "teks_bebas",
        placeholder: "mis. Voucher 5GB 7 Hari",
        wajib: true,
      },
      {
        key: "nominal",
        label: "Harga Jual",
        tipe: "angka_bebas",
        wajib: true,
      },
    ],
  },
  {
    jenisTransaksi: "aksesoris",
    labelTampilan: "Aksesoris",
    fields: [
      {
        key: "nama_produk",
        label: "Nama Produk",
        tipe: "teks_bebas",
        placeholder: "mis. Casing HP, Kabel Data, Charger, Tempered Glass",
        wajib: true,
      },
      {
        key: "nominal",
        label: "Harga Jual",
        tipe: "angka_bebas",
        wajib: true,
      },
    ],
  },
];
