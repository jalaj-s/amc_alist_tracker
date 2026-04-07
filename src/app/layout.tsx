import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMC Tracker",
  description: "Track your AMC A-List savings",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AMC Tracker",
  },
  icons: {
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
