import React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef(
  (
    { className, children, padded = true, hoverable = false, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "glass-panel rounded-2xl",
        padded && "p-8",
        hoverable &&
          "transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
