"use client";

import { DashboardLayout } from "@/components/layout/layout";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { ReactNode } from "react";

function DashboardContent({ children }: { children: ReactNode }) {
  const { loading, sessionExpired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (sessionExpired) {
    return <SessionExpired />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function DashboardLayoutWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
