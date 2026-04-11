import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexayra Arc — Document Portal",
  description: "Generate LPOs, Quotations, and Receiver Copies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
