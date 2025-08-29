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
import { usePathname } from "next/navigation";

function SidebarMenuRender(props: {
  items: SidebarLink[];
}) {
  const pathname = usePathname() || "/";

  return (
    <>
      {props.items.map((item) => {
        const isActive = pathname && pathname.includes(item.url);
        return (
          <SidebarMenuItem key={item.title} className={`rounded-sm ${isActive ? "bg-muted border" : ""}`}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export default function AppSidebar() {

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
                  <SidebarMenuRender items={SIDEBAR_LINKS.adminManagement} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Content management</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2">
                <SidebarMenu>
                  <SidebarMenuRender items={SIDEBAR_LINKS.contentManagement} />
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
