import React from "react";
import { HelpCircle } from "lucide-react";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  children?: React.ReactNode;
  explanation?: string; // new optional prop
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon,
  className = "",
  size = "md",
  children,
  explanation,
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
        <div className={`${sizeClasses.title} text-muted-foreground flex items-center gap-2`}>
          <span>{title}</span>
          {explanation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${title} explanation`}
                  className="p-0.5 rounded-full hover:bg-muted/60 inline-flex items-center justify-center"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="max-w-xs">
                <div className="text-sm text-white">{explanation}</div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className={sizeClasses.value}>{value}</div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
};
