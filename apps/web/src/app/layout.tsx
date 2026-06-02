import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { PwaRegistration } from "@/components/layout/PwaRegistration";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intranet",
  description: "Portal interno da empresa",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-icon-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "Intranet",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
      </head>
      <body className="h-full bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        <PwaRegistration />
      </body>
    </html>
  );
}
