"use client"
import React, { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"; // shadcn sidebar import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SIDEBAR_LINKS, SidebarLink } from "@/assets/constants/sidebar-links";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

function SidebarMenuRender(props: {
  items: SidebarLink[];
  fullUrl: string;
}) {
  const pathname = usePathname() || "/";

  return (
    <>
      {props.items.map((item) => {
        const isActive = props.fullUrl && props.fullUrl.includes(item.url);
        return (
          <SidebarMenuItem key={item.title} className={`rounded-sm ${isActive ? "bg-muted border" : "border border-transparent"}`}>
            <SidebarMenuButton asChild>
              <Link href={item.url} prefetch>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export default function AppSidebar() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState<string>("");
  const [fullUrl, setFullUrl] = useState<string>("");

  // read origin (provided by server via meta or data attribute), fallback to window.location.origin
  useEffect(() => {
    const meta = document.querySelector('meta[name="origin"]') as HTMLMetaElement | null;
    const docOrigin = meta?.content || (document.documentElement.dataset.origin ?? "");
    const resolved = docOrigin || (typeof window !== "undefined" ? window.location.origin : "");
    setOrigin(resolved);
  }, []);

  // compute full URL whenever origin, pathname or search params change
  useEffect(() => {
    const search = searchParams ? searchParams.toString() : "";
    const url = origin
      ? `${origin}${pathname}${search ? `?${search}` : ""}`
      : (typeof window !== "undefined" ? window.location.href : `${pathname}${search ? `?${search}` : ""}`);
    setFullUrl(url);
    console.log("fullUrl", url);
  }, [origin, pathname, searchParams]);
  
  return (
    <div className="sidebar-wrapper">
      <SidebarProvider>
        <Sidebar className="w-64 ">
          <SidebarHeader className="p-[14px] bg-yellow-500 px-6">
            <span className="font-bold text-md">IITian Squad</span>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel>Admin management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuRender items={SIDEBAR_LINKS.adminManagement} fullUrl={fullUrl} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Content management</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2">
                <SidebarMenu>
                  <SidebarMenuRender items={SIDEBAR_LINKS.contentManagement} fullUrl={fullUrl} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-start gap-4 px-4 py-4">
              <Avatar>
                <AvatarImage src="/profile.jpg" alt="Profile" />
                <AvatarFallback>IS</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Your Name</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
