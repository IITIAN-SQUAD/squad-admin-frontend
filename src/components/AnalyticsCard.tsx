import React from "react";
import { HelpCircle } from "lucide-react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  children?: React.ReactNode;
  explanation?: string;
  iconPlacement?: "default" | "top";
  childrenPlacement?: "below" | "right"; // new prop
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon,
  className = "",
  size = "md",
  children,
  explanation,
  iconPlacement = "default",
  childrenPlacement = "below",
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

  // title-inline icon sizing when iconPlacement === "top"
  const titleIconSizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div
      className={`bg-card rounded-lg shadow ${sizeClasses.container} flex-1 border flex items-center gap-4 ${className} h-fit`}
    >
      {/* default placement: icon in left column */}
      {iconPlacement === "default" && icon && (
        <div className={`${sizeClasses.icon} text-muted-foreground`}>
          {icon}
        </div>
      )}

      {/* content area: either stacked (default) or two-column with children on the right */}
      {childrenPlacement === "right" ? (
        <div className="flex-1 flex items-center justify-between gap-4">
          <div>
            <div
              className={`${sizeClasses.title} text-muted-foreground flex items-center gap-2`}
            >
              {iconPlacement === "top" && icon && (
                <>
                  <span
                    className={`${titleIconSizeClass} inline-flex items-center text-muted-foreground`}
                  >
                    {icon}
                  </span>
                </>
              )}

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
                  <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-xs"
                  >
                    <div className="text-sm text-white">{explanation}</div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className={sizeClasses.value}>{value}</div>
          </div>

          {/* right side: keep children compact and non-wrapping */}
          {children && (
            <div className="shrink-0 flex items-center">{children}</div>
          )}
        </div>
      ) : (
        <div>
          <div
            className={`${sizeClasses.title} text-muted-foreground flex items-center gap-2`}
          >
            {iconPlacement === "top" && icon && (
              <>
                <span
                  className={`${titleIconSizeClass} inline-flex items-center text-muted-foreground`}
                >
                  {icon}
                </span>
              </>
            )}

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
      )}
    </div>
  );
};
