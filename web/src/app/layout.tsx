import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keep Rates",
  description: "Stay updated with the latest USD to LKR exchange rates in Commercial Bank, Sri Lanka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="bg-amber-500 text-black text-center py-2 px-4 text-sm font-medium">
          This is an archived version.{" "}
          <a
            href="https://keeprates.kanushka.com"
            className="underline font-semibold hover:opacity-80"
          >
            Visit the new Keep Rates →
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
