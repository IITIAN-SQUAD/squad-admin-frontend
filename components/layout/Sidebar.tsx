"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  CloudLightning,
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  FolderOpen,
  UserCircle,
  LogOut,
  FileQuestion,
  Upload,
  Image,
  Layers,
  BookMarked,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SIDEBAR_LINKS, SidebarLink } from "@/assets/constants/sidebar-links";

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
    // Fetch admin info from API
    const fetchAdminData = async () => {
      console.log('[Sidebar] useEffect triggered');
      const token = localStorage.getItem('auth_token');
      const hasCookies = document.cookie.includes('auth_token') || document.cookie.includes('jwt');
      
      console.log('[Sidebar] Token:', !!token, 'Cookies:', hasCookies);
      
      // Don't redirect here - let middleware handle it
      // Just skip API call if no auth
      if (!token && !hasCookies) {
        console.log('[Sidebar] No token or cookies, skipping API call');
        return;
      }

      try {
        console.log('[Sidebar] Fetching admin data from API...');
        const authService = (await import('@/src/services/auth.service')).default;
        const response = await authService.getAdminProfile();
        
        console.log('[Sidebar] Full API response:', JSON.stringify(response, null, 2));
        
        // Check if response has admin property or is the admin data directly
        const adminData = response.admin || response;
        console.log('[Sidebar] Admin data:', adminData);
        console.log('[Sidebar] Admin name:', adminData.name);
        
        if (adminData && adminData.name) {
          console.log('[Sidebar] Setting admin name to:', adminData.name);
          setAdminName(adminData.name);
          setAdminRole("Administrator");
          
          // Store in localStorage for future use
          localStorage.setItem('admin', JSON.stringify(adminData));
          console.log('[Sidebar] Admin data stored in localStorage');
        } else {
          console.warn('[Sidebar] No admin name in response');
        }
      } catch (error: any) {
        console.error('[Sidebar] Failed to fetch admin data:', error);
        console.error('[Sidebar] Error message:', error.message);
        console.error('[Sidebar] Error status:', error.status);
        
        // If 401 unauthorized, clear session and redirect to login
        if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          console.log('[Sidebar] 401 error, clearing session and redirecting to login');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin');
          document.cookie = 'auth_token=; path=/; max-age=0';
          document.cookie = 'jwt=; path=/; max-age=0';
          window.location.href = '/login';
          return;
        }
        
        // Try to use cached data from localStorage for other errors
        const admin = localStorage.getItem('admin');
        if (admin && admin !== 'undefined' && admin !== 'null') {
          try {
            const adminData = JSON.parse(admin);
            if (adminData.name) {
              setAdminName(adminData.name);
              setAdminRole("Administrator");
            }
          } catch (e) {
            console.error('[Sidebar] Failed to parse cached admin data:', e);
          }
        }
      }
    };

    fetchAdminData();

    // Listen for storage changes
    window.addEventListener('storage', fetchAdminData);

    return () => {
      window.removeEventListener('storage', fetchAdminData);
    };
  }, []);

  const handleLogout = async () => {
    // Clear local storage and cookies first
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'jwt=; path=/; max-age=0';
    
    // Call logout API (non-blocking)
    try {
      const authService = (await import('@/src/services/auth.service')).default;
      await authService.logout();
    } catch (error) {
      // Ignore API errors, already cleared local data
      console.warn('Logout API failed (non-critical):', error);
    }
    
    // Redirect to login
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
