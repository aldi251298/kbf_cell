"use client";

import { useState, useEffect, useRef } from "react";
import { FORM_CONFIG_TRANSAKSI_MANUAL, FieldConfig } from "@/lib/formConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectFloating } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  CreditCard,
  Receipt,
  Smartphone,
  Zap,
  Wallet,
  Package,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

const DAFTAR_KONTER = [
  { id: "KONTER-001", nama: "KBF Cell Pasar Baru" },
  { id: "KONTER-002", nama: "KBF Cell Jawi Jawi" },
  { id: "KONTER-003", nama: "KBF Cell Cupak" },
];

const konterOptions = DAFTAR_KONTER.map((k) => ({
  value: k.id,
  label: k.nama,
}));
const jenisTransaksiOptions = FORM_CONFIG_TRANSAKSI_MANUAL.map((c) => ({
  value: c.jenisTransaksi,
  label: c.labelTampilan,
}));

// Icon mapping for transaction types
const transactionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  pulsa: Smartphone,
  data: Zap,
  pln: Zap,
  emoney: Wallet,
  voucher: CreditCard,
  qris: Package,
  aksesoris: Package,
  default: Receipt,
};

export default function FormTransaksiManual() {
  const [konterTerpilih, setKonterTerpilih] = useState<string>("");
  const [jenisTerpilih, setJenisTerpilih] = useState<string>("");
  const [nilaiField, setNilaiField] = useState<Record<string, string>>({});
  const [statusSubmit, setStatusSubmit] = useState<
    "idle" | "loading" | "sukses" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showNotification, setShowNotification] = useState(false);

  const config = FORM_CONFIG_TRANSAKSI_MANUAL.find(
    (c) => c.jenisTransaksi === jenisTerpilih,
  );

  // Track if notification was already shown for current status
  const notificationShownRef = useRef(false);

  // Auto-close notification after 3 seconds
  useEffect(() => {
    if (statusSubmit === "sukses" || statusSubmit === "error") {
      const timer = setTimeout(() => {
        setShowNotification(false);
        setStatusSubmit("idle");
        setErrorMessage("");
        notificationShownRef.current = false;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusSubmit]);

  // Show notification when status changes to sukses or error
  useEffect(() => {
    if (
      (statusSubmit === "sukses" || statusSubmit === "error") &&
      !notificationShownRef.current
    ) {
      setShowNotification(true);
      notificationShownRef.current = true;
    }
  }, [statusSubmit]);
  const TransactionIcon = config
    ? transactionIcons[config.jenisTransaksi] || transactionIcons.default
    : transactionIcons.default;

  function updateField(key: string, value: string) {
    setNilaiField((prev) => ({ ...prev, [key]: value }));
  }

  function validasiLengkap(): boolean {
    if (!konterTerpilih || !config) return false;
    return config.fields
      .filter((f) => f.wajib)
      .every((f) => nilaiField[f.key]?.trim());
  }

  async function submit() {
    if (!validasiLengkap()) return;
    setStatusSubmit("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/transaksi/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis_transaksi: jenisTerpilih,
          konter_id: konterTerpilih,
          ...nilaiField,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusSubmit("sukses");
        setJenisTerpilih("");
        setNilaiField({});
      } else {
        setStatusSubmit("error");
        setErrorMessage(data.error || "Gagal menyimpan transaksi");
      }
    } catch {
      setStatusSubmit("error");
      setErrorMessage("Terjadi kesalahan jaringan");
    }
  }

  function resetForm() {
    setKonterTerpilih("");
    setJenisTerpilih("");
    setNilaiField({});
    setStatusSubmit("idle");
    setErrorMessage("");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background decorative elements */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-6 fade-in-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 mb-4">
            <TransactionIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-1xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Input Transaksi Manual
          </h1>
          <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
            Catat transaksi yang tidak tertangkap notifikasi otomatis dengan
            cepat dan akurat
          </p>
        </div>

        {/* Notification Popup - Centered Modal */}
        {showNotification &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
              role="alert"
              aria-live="polite"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
              }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowNotification(false)}
              />

              {/* Popup Content */}
              <div
                className={cn(
                  "relative w-full max-w-md animate-scale-in mx-auto",
                  "bg-white rounded-2xl shadow-2xl border p-6",
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                      statusSubmit === "sukses"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600",
                    )}
                  >
                    {statusSubmit === "sukses" ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <AlertCircle className="h-7 w-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-semibold text-lg",
                        statusSubmit === "sukses"
                          ? "text-green-800"
                          : "text-red-800",
                      )}
                    >
                      {statusSubmit === "sukses" ? "Berhasil" : "Gagal"}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        statusSubmit === "sukses"
                          ? "text-green-700"
                          : "text-red-700",
                      )}
                    >
                      {statusSubmit === "sukses"
                        ? "Transaksi berhasil disimpan"
                        : errorMessage || "Gagal menyimpan transaksi"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotification(false);
                      setStatusSubmit("idle");
                      setErrorMessage("");
                    }}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar for auto-close */}
                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      statusSubmit === "sukses" ? "bg-green-500" : "bg-red-500",
                    )}
                    style={{
                      width: "100%",
                      animation: "progressBar 3s linear forwards",
                    }}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Main Form Card */}
        <Card className="border-gray-200 shadow-xl shadow-gray-900/5 overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Detail Transaksi
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Isi informasi transaksi di bawah ini
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 lg:p-10 space-y-7">
            {/* Konter Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <span>Konter</span>
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <Select
                  options={konterOptions}
                  value={konterTerpilih}
                  onChange={setKonterTerpilih}
                  placeholder="Pilih konter"
                  className="w-full"
                />
              </div>
            </div>

            {/* Jenis Transaksi Selection */}
            {konterTerpilih && (
              <div className="space-y-3 fade-in">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span>Jenis Transaksi</span>
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <SelectFloating
                    options={jenisTransaksiOptions}
                    value={jenisTerpilih}
                    onChange={(v) => {
                      setJenisTerpilih(v);
                      setNilaiField({});
                    }}
                    placeholder="Pilih jenis transaksi"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Fields */}
            {konterTerpilih && config && (
              <div className="space-y-6 fade-in border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TransactionIcon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-gray-700">
                    {config.labelTampilan}
                  </span>
                </div>
                <div
                  className="space-y-5"
                  role="group"
                  aria-labelledby="dynamic-fields-heading"
                >
                  <h3 id="dynamic-fields-heading" className="sr-only">
                    Field Transaksi
                  </h3>
                  {config.fields.map((field) => (
                    <RenderField
                      key={field.key}
                      field={field}
                      nilai={nilaiField[field.key]}
                      nilaiFieldLain={nilaiField}
                      onChange={(v) => updateField(field.key, v)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Section */}
            {konterTerpilih && config && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <Button
                  onClick={submit}
                  disabled={!validasiLengkap() || statusSubmit === "loading"}
                  className={cn(
                    "w-full py-4 text-base font-semibold rounded-xl transition-all duration-200",
                    "shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    !validasiLengkap() && "opacity-50 cursor-not-allowed",
                    statusSubmit === "loading" && "opacity-75",
                  )}
                  size="default"
                >
                  {statusSubmit === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    "Simpan Transaksi"
                  )}
                </Button>

                {statusSubmit === "sukses" && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="w-full py-3 text-base font-medium rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    size="default"
                  >
                    Input Transaksi Lain
                  </Button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!konterTerpilih && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                  <HelpCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Silakan pilih konter terlebih dahulu untuk memulai
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Semua data transaksi tersimpan aman dan terenkripsi
        </p>
      </div>
    </div>
  );
}

function RenderField({
  field,
  nilai,
  nilaiFieldLain,
  onChange,
}: {
  field: FieldConfig;
  nilai: string;
  nilaiFieldLain: Record<string, string>;
  onChange: (v: string) => void;
}) {
  const label = field.labelDinamis?.[nilaiFieldLain.tipe_pln] ?? field.label;
  const isRequired = field.wajib;

  switch (field.tipe) {
    case "preset_angka":
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {isRequired && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {field.presetOptions!.map((opt) => (
              <Button
                type="button"
                key={opt}
                onClick={() => onChange(String(opt))}
                variant={nilai === String(opt) ? "default" : "outline"}
                className={cn(
                  "h-16 text-lg font-medium rounded-xl transition-all duration-200",
                  "border-2",
                  nilai === String(opt)
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                Rp{opt.toLocaleString("id-ID")}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Atau isi manual"
            value={nilai ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            inputMode="numeric"
          />
        </div>
      );
    case "angka_bebas":
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {isRequired && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={field.placeholder}
            value={nilai ?? ""}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full"
          />
        </div>
      );
    case "teks_bebas":
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {isRequired && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          <Input
            type="text"
            placeholder={field.placeholder}
            value={nilai ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
        </div>
      );
    case "dropdown":
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            {label}
            {isRequired && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          <Select
            options={field.dropdownOptions!.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={nilai ?? ""}
            onChange={onChange}
            placeholder={`Pilih ${label}`}
            className="w-full"
          />
        </div>
      );
  }
}
