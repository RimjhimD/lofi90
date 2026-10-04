import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Big_Shoulders, DM_Mono } from "next/font/google";
import { Header } from "@/site/Header";
import "./globals.css";

const shoulders = Big_Shoulders({ weight: ["500", "700", "900"], subsets: ["latin"], variable: "--font-shoulders", display: "swap" });
const atkinson = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-atkinson", display: "swap" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "lofi90 · every line connected", template: "%s · lofi90" },
  description:
    "React + TypeScript + Tailwind components for the front desk of a real business: calls, texts, bots and bookings. Every component ships with a live demo, full source and the prompt that built it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${shoulders.variable} ${atkinson.variable} ${dmMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
