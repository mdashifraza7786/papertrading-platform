import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "PaperTrading",
  description: "A Trading Platform for Learn",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-primary">
        {children}
      </body>
    </html>
  );
}
