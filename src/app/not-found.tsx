"use client";

import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Content */}
        <div className="text-center space-y-8">
          {/* 404 Number with Animation */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            </div>
            <h1 className="relative text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 tracking-tight">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                Halaman Tidak Ditemukan
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan atau dihapus.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push("/")}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200"
            >
              <Home className="h-5 w-5 mr-2" />
              Kembali ke Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-12 px-6 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Halaman Sebelumnya
            </Button>
          </div>

          {/* Common Pages */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Atau kunjungi halaman berikut:</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Dashboard", href: "/" },
                { label: "Transaksi Baru", href: "/transaksi-baru" },
                { label: "Riwayat Transaksi", href: "/transaksi" },
                { label: "Laporan", href: "/laporan" },
                { label: "Perangkat", href: "/perangkat" },
              ].map((page) => (
                <Button
                  key={page.href}
                  variant="ghost"
                  onClick={() => router.push(page.href)}
                  className="h-10 px-4 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {page.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="pt-12 flex items-center justify-center gap-2 text-gray-400">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-blue-300 rounded"></div>
            <span className="text-xs font-medium">KBF Cell Dashboard</span>
            <div className="h-1 w-12 bg-gradient-to-l from-transparent to-blue-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
