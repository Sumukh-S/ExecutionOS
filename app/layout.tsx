import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/contexts/auth";
import { ThemeProvider } from "@/contexts/theme";
import { ExecutionDataProvider } from "@/contexts/execution-data";
import { PageMeta } from "@/components/layout/page-meta";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Execution OS", template: "%s · Execution OS" },
  description: "Personal execution and productivity operating system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background`}>
        <ThemeProvider>
          <ExecutionDataProvider>
            <AuthProvider>
              <PageMeta />
              <Header />
              <main className="min-w-0 overflow-x-hidden pb-24 lg:pb-32">{children}</main>
            </AuthProvider>
          </ExecutionDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}