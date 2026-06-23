import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT_OPTIONS } from "@/constants/mockData";

/**
 * FontSelector — 2 font options for Phase 2 (Times New Roman Italic, Gotham Italic).
 * Renders as larger preview tiles since there are only two.
 */
export const FontSelector = ({ label, value, onChange, testId }) => {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <div
          className="font-display text-[13px] font-medium text-zinc-200"
          style={{ letterSpacing: "-0.01em" }}
        >
          {label}
        </div>
      )}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        data-testid={testId}
      >
        {FONT_OPTIONS.map((f) => {
          const selected = value === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              data-testid={`font-option-${f.id}`}
              className={cn(
                "relative flex flex-col rounded-xl border px-5 py-5 text-left transition-all duration-200",
                selected
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
              )}
            >
              <span
                className="text-[28px] text-zinc-100 leading-none"
                style={{
                  fontFamily: f.stack,
                  fontStyle: f.style?.fontStyle || "normal",
                  letterSpacing: "-2px",
                }}
              >
                Aa
              </span>
              <span className="text-[12px] text-zinc-400 mt-3 tracking-wide">
                {f.label}
              </span>
              {selected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                  <Check className="h-3 w-3 text-black" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FontSelector;
