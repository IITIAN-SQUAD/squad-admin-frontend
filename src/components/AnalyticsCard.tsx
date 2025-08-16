import React from "react";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, icon }) => (
  <div className="bg-card rounded-lg shadow p-6 flex-1 min-w-[200px] border flex items-center gap-4">
    {icon && <div className="text-2xl text-muted-foreground">{icon}</div>}
    <div>
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  </div>
);
