import React from "react";
import { cn } from "@/lib/utils";

/**
 * AppButton — premium glassmorphism button
 * variants: primary | secondary | ghost
 * sizes: sm | md | lg
 */
export const AppButton = React.forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      className,
      children,
      iconLeft,
      iconRight,
      ...props
    },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

    const variants = {
      primary:
        "bg-white text-black hover:bg-zinc-200 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.35)]",
      secondary:
        "bg-white/[0.04] border border-white/10 text-zinc-100 hover:bg-white/[0.08] hover:border-white/20 backdrop-blur-xl",
      ghost:
        "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]",
      danger:
        "bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/15",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-5 text-sm",
      lg: "h-12 px-7 text-[15px]",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {iconLeft && <span className="flex">{iconLeft}</span>}
        <span>{children}</span>
        {iconRight && <span className="flex">{iconRight}</span>}
      </button>
    );
  },
);
AppButton.displayName = "AppButton";

export default AppButton;
