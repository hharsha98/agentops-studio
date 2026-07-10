import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { AccentBoot } from "@/components/accent-boot";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "AgentOps Studio",
  description: "A multi-agent workforce command center for business operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${inter.variable} ${syne.variable}`} data-accent="violet" data-theme="futuristic" lang="en">
      <body>
        <AccentBoot />
        {children}
      </body>
    </html>
  );
}
