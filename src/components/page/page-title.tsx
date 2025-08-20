"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTitleProps {
  children: React.ReactNode;
}

export default function PageTitle({ children }: PageTitleProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="mr-2"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-xl font-bold">{children}</h1>
    </div>
  );
}
