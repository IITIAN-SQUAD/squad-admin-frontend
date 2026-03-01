"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Navbar() {
  const { admin, isAuthenticated, logout } = useAuth();
  const [adminName, setAdminName] = React.useState("");
  const [adminRole, setAdminRole] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");

  React.useEffect(() => {
    if (admin) {
      setAdminName(admin.name || "");
      setAdminEmail(admin.email || "");
      setAdminRole(admin.role?.name || "");
    }
  }, [admin]);

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center px-4 justify-end gap-4">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-yellow-400 text-gray-900">
                    {adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{adminName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {adminEmail}
                  </p>
                  {adminRole && (
                    <p className="text-xs leading-none text-muted-foreground font-medium mt-1">
                      {adminRole}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
