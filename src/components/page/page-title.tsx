import React from "react";

interface PageTitleProps {
  children: React.ReactNode;
}

export default function PageTitle({ children }: PageTitleProps) {
  return (
    <h1 className="text-xl font-bold mb-4">{children}</h1>
  );
}