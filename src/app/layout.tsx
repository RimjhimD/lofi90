import type { Metadata } from "next";
import { Baloo_2, Luckiest_Guy } from "next/font/google";
import { Header } from "@/site/Header";
import { FloatingPieces } from "@/site/FloatingPieces";
import "./globals.css";

const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-luckiest", display: "swap" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "lofi90 · a component library in your pocket", template: "%s · lofi90" },
  description:
    "React + TypeScript + Tailwind components: everyday UI with a twist and tools for real automation work. Every component ships with a live demo, full source and the prompt that built it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${luckiest.variable} ${baloo.variable}`}>
      <body className="min-h-screen antialiased">
        <FloatingPieces />
        <Header />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
