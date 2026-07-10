import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
