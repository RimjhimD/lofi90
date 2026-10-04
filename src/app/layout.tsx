import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Header } from "@/site/Header";
import { Sidebar } from "@/site/Sidebar";
import { Spotlight } from "@/site/Spotlight";
import { AutoReveal } from "@/site/AutoReveal";
import "./globals.css";

const grotesk = Space_Grotesk({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "lofi90 · component control room", template: "%s · lofi90" },
  description:
    "Unique React + TypeScript + Tailwind components, each with a live playground, every variant and state, its full code and the prompt that built it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${grotesk.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        {/* apply the saved theme before first paint, so light mode never flashes dark */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("lofi90-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}` }} />
      </head>
      <body className="min-h-screen antialiased">
        <Spotlight />
        <AutoReveal />
        <Header />
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
