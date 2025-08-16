import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className }) => (
  <section className={`py-6 ${className ?? ""}`}>
    {children}
  </section>
);
