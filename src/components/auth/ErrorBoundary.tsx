"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary to catch rendering errors in dashboard components
 * Prevents the entire app from crashing when a component throws
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 mb-6">
                Terjadi kesalahan saat memuat halaman. Silakan coba lagi.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left mb-4 p-4 bg-gray-100 rounded-lg text-sm">
                  <summary className="font-medium cursor-pointer">
                    Detail Error (Development)
                  </summary>
                  <pre className="mt-2 overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Coba Lagi
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full py-3 px-4 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Muat Ulang Halaman
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Jika masalah berlanjut, silakan hubungi administrator.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Client component wrapper for ErrorBoundary with router access
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleReload = () => {
    router.refresh();
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 mb-6">
                Terjadi kesalahan saat memuat halaman. Silakan coba lagi.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleReload}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Coba Lagi
              </Button>
              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full py-3 px-4 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Kembali ke Login
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Jika masalah berlanjut, silakan hubungi administrator.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
