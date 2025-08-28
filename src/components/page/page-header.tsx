import React from "react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="w-full border-b px-6 py-4 flex items-center sticky top-0 z-50 bg-yellow-500">
      <h1 className="text-sm font-medium">{title}</h1>
      {children}
    </header>
  );
}
