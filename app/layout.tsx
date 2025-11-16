import type { Metadata } from "next";
import { Inter, Geist, Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import AppSidebar from "@/components/layout/Sidebar"; // added
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const fontImport = Geist({
  variable: "--font-urbanist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IITian Squad - Admin Dashboard",
  description: "Comprehensive exam management system for competitive exams worldwide",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontImport.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
