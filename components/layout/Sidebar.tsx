"use client";
import React from "react";
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
import { SIDEBAR_LINKS, SidebarLink } from "@/assets/constants/sidebar-links";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CloudLightning } from "lucide-react";

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
      <SidebarFooter className="overflow-hidden">
        <SidebarMenu className="overflow-hidden">
          <SidebarMenuItem className="p-2 overflow-hidden">
            <SidebarMenuButton className="m-0 space-x-2 w-full h-auto">
                <Avatar className="size-4">
                  <AvatarImage src="/profile.jpg" alt="Profile" />
                  <AvatarFallback>IS</AvatarFallback>
                </Avatar>
                <div className="w-full overflow-hidden">
                  <p className="font-medium">Your Name</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
