import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import { Header } from "@/site/Header";
import { Sidebar } from "@/site/Sidebar";
import { Spotlight } from "@/site/Spotlight";
import { AutoReveal } from "@/site/AutoReveal";
import "./globals.css";

const unbounded = Unbounded({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "lofi90 · component control room", template: "%s · lofi90" },
  description:
    "Unique React + TypeScript + Tailwind components, each with a live playground, every variant and state, its full code and the prompt that built it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${unbounded.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <head>
        {/* apply the saved theme before first paint, so light mode never flashes dark */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("lofi90-theme")==="light")document.documentElement.dataset.theme="light";if(localStorage.getItem("lofi90-side")==="closed")document.documentElement.dataset.side="closed"}catch(e){}` }} />
      </head>
      <body className="min-h-screen antialiased">
        <Spotlight />
        <AutoReveal />
        <Header />
        <div className="shell">
          <Sidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
