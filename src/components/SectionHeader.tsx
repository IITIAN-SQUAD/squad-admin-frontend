import React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ children }) => (
  <h2 className="text-sm font-semibold mb-4">{children}</h2>
);
