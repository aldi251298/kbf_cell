import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/layout";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KBF Cell",
    template: "%s | KBF Cell",
  },
  description:
    "Monitoring transaksi harian untuk 3 konter pulsa — omzet, jumlah transaksi, status perangkat, dan laporan lengkap.",
  applicationName: "KBF Cell",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KBF Cell",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/logo_kbf.png",
    shortcut: "/logo_kbf.png",
    apple: "/logo_kbf.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
