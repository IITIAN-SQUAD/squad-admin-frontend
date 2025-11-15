import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <>
      <header className="w-full px-6 h-[49px] flex items-center fixed top-0 z-50 bg-yellow-500 gap-3 border-b border-yellow-600">
        <SidebarTrigger className="hover:bg-yellow-600 hover:text-black transition-colors" />
        <h1 className="text-sm font-bold">{title}</h1>
      </header>
      <div className="h-[49px]"/>
    </>
  );
}
