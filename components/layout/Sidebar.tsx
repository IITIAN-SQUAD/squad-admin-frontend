import React from "react";
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
import { SIDEBAR_LINKS } from "@/assets/constants/sidebar-links";
import { FileText } from "lucide-react";

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
                  {SIDEBAR_LINKS.adminManagement.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Content management</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2">
                <SidebarMenu>
                  {SIDEBAR_LINKS.contentManagement.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/blog-management">
                        <FileText />
                        <span>Blog Management</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
