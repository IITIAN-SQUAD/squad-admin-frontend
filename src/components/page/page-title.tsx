"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTitleProps {
  children: React.ReactNode;
  disableMargin?: boolean;
  backButton?: {
    enabled: boolean;
    onClick?: () => void;
  };
}

export default function PageTitle({
  children,
  disableMargin,
  backButton = {
    enabled: true,
  },
}: PageTitleProps) {
  const router = useRouter();

  return (
    <div className={`flex items-center gap-2 ${disableMargin ? "" : "mb-4"}`}>
      {backButton.enabled && <Button
        
        size="icon"
        onClick={backButton.onClick ? backButton.onClick : () => router.back()}
        className="mr-2 bg-zinc-100 hover:bg-zinc-200 focus:ring-2 focus:ring-zinc-300 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 text-zinc-800" />
      </Button>}
      <h1 className="text-xl font-bold">{children}</h1>
    </div>
  );
}
