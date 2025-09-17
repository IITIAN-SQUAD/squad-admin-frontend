import React from "react";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  children?: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon,
  className = "",
  size = "md",
  children,
}) => {
  // size-specific classes
  const sizeClasses =
    size === "sm"
      ? {
          container: "p-3 min-w-[140px] text-sm",
          icon: "text-xl",
          title: "text-xs mb-1",
          value: "text-xl font-semibold",
        }
      : {
          container: "p-6 min-w-[200px]",
          icon: "text-2xl",
          title: "text-sm mb-2",
          value: "text-3xl font-bold",
        };

  return (
    <div
      className={`bg-card rounded-lg shadow ${sizeClasses.container} flex-1 border flex items-center gap-4 ${className} h-fit`}
    >
      {icon && <div className={`${sizeClasses.icon} text-muted-foreground`}>{icon}</div>}
      <div>
        <div className={`${sizeClasses.title} text-muted-foreground`}>{title}</div>
        <div className={sizeClasses.value}>{value}</div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
};
