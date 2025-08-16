import React from "react";

interface AnalyticsCardProps {
  title: string;
  value: number;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value }) => (
  <div className="bg-card rounded-lg shadow p-6 flex-1 min-w-[200px] border">
    <div className="text-sm text-muted-foreground mb-2">{title}</div>
    <div className="text-3xl font-bold">{value}</div>
  </div>
);
