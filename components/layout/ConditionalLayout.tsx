"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AuthCheck from "@/components/auth/AuthCheck";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

// Pages that should NOT show sidebar/navbar
const AUTH_PAGES = ['/login', '/forgot-password', '/set-password'];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isAuthPage) {
    // Auth pages: no sidebar, no navbar, no auth check
    return <>{children}</>;
  }

  // Regular pages: show sidebar and navbar, with auth protection
  return (
    <AuthCheck>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Navbar />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
