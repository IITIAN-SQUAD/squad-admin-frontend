"use client";
import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SIDEBAR_LINKS, SidebarLink } from "@/assets/constants/sidebar-links";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CloudLightning, LogOut } from "lucide-react";

function SidebarMenuRender(props: { items: SidebarLink[]; fullUrl: string }) {
  return (
    <>
      {props.items.map((item) => {
        const isActive = props.fullUrl && props.fullUrl.includes(item.url);
        return (
          <SidebarMenuItem
            key={item.title}
            className={`rounded-lg ${
              isActive ? "text-zinc-100 hover:text-zinc-100" : ""
            }`}
          >
            <SidebarMenuButton
              asChild
              className={`${
                isActive
                  ? "bg-zinc-900 border text-zinc-100 hover:bg-zinc-900 hover:text-zinc-100"
                  : ""
              }`}
              tooltip={item.title}
            >
              <Link
                href={item.url}
                prefetch
                className="flex items-center gap-2"
              >
                <item.icon />
                <p className="leading-0">{item.title}</p>
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
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Administrator");

  useEffect(() => {
    // Get admin info from localStorage
    const admin = localStorage.getItem('admin');
    if (admin) {
      try {
        const adminData = JSON.parse(admin);
        setAdminName(adminData.name || "Admin");
        setAdminRole(adminData.role?.name || "Administrator");
      } catch (e) {
        // Use defaults
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    document.cookie = 'auth_token=; path=/; max-age=0';
    window.location.href = '/login';
  };

  return (
    <Sidebar className="w-64 overflow-hidden" collapsible="icon">
      <SidebarHeader className="bg-yellow-500 h-[49px] flex justify-center items-center px-2 border-b border-yellow-600">
        <SidebarMenu>
          <SidebarMenuItem className="p-2">
            <SidebarMenuButton asChild className="m-0">
              <Link href={"/"} prefetch className="flex items-center gap-2">
                <CloudLightning className="size-4" />
                <p className="leading-0 font-bold text-md">IITian Squad</p>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-2 overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Admin management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuRender
                items={SIDEBAR_LINKS.adminManagement}
                fullUrl={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Exam management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuRender
                items={SIDEBAR_LINKS.examManagement}
                fullUrl={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Content management</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <SidebarMenu>
              <SidebarMenuRender
                items={SIDEBAR_LINKS.contentManagement}
                fullUrl={pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="overflow-hidden border-t">
        <SidebarMenu className="overflow-hidden">
          <SidebarMenuItem className="p-2 overflow-hidden">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarFallback className="bg-yellow-400 text-gray-900 text-xs">
                    {adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-medium text-sm truncate">{adminName}</p>
                  <p className="text-xs text-muted-foreground truncate">{adminRole}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="flex-shrink-0 h-8 w-8 hover:bg-red-100 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
