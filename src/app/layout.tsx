import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "PaperTrade — Practice Crypto Trading",
  description: "Paper trading platform to practice crypto trading with virtual funds",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body className="min-h-screen bg-background-primary">
        {children}
      </body>
    </html>
  );
}
