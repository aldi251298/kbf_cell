"use client";

import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, LogIn } from "lucide-react";

interface SessionExpiredProps {
  onRetry?: () => void;
}

export function SessionExpired({ onRetry }: SessionExpiredProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
    router.refresh();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sesi Anda Telah Berakhir
          </h1>
          <p className="text-gray-600 mb-6">
            Sesi login Anda telah kedaluwarsa. Silakan login kembali untuk
            melanjutkan.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Login Kembali
          </button>

          <button
            onClick={handleRetry}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5" />
            Coba Lagi
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Jika masalah berlanjut, silakan hubungi administrator.
        </p>
      </div>
    </div>
  );
}
