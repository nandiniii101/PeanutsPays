import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BudgetMitra - Personal Budget Tracker",
  description:
    "Private, multi-user budget tracker to manage spending, lending, and AI insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f8fafc] min-h-screen text-slate-800`}>
        <Providers>
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
