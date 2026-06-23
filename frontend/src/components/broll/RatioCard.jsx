import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visualize an aspect ratio as a thin glass card with proportional preview.
 */
export const RatioCard = ({ ratio, selected, onSelect }) => {
  const { id, label, sub, w, h, resolution } = ratio;

  // Compute a contained box width given a max area
  const max = 96;
  const longest = Math.max(w, h);
  const boxW = (w / longest) * max;
  const boxH = (h / longest) * max;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      data-testid={`ratio-card-${id.replace(":", "-")}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-7 text-left transition-all duration-300",
        "glass-panel-soft",
        selected
          ? "border-white/30 bg-white/[0.06] shadow-[0_20px_60px_-20px_rgba(255,255,255,0.15)]"
          : "border-white/[0.07] hover:border-white/15 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-eyebrow">{id}</div>
        <div
          className={cn(
            "h-6 w-6 rounded-full border flex items-center justify-center transition-all",
            selected
              ? "bg-white border-white"
              : "border-white/15 group-hover:border-white/30",
          )}
        >
          {selected && (
            <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
          )}
        </div>
      </div>

      <div className="my-10 flex items-center justify-center h-28">
        <div
          className={cn(
            "rounded-md border transition-all duration-300",
            selected
              ? "bg-white/85 border-white/40 shadow-[0_8px_32px_-8px_rgba(255,255,255,0.4)]"
              : "bg-white/[0.06] border-white/15 group-hover:bg-white/[0.10] group-hover:border-white/25",
          )}
          style={{ width: `${boxW}px`, height: `${boxH}px` }}
        />
      </div>

      <div>
        <div className="font-display text-lg font-medium text-zinc-100 tracking-tight">
          {label}
        </div>
        <div className="text-[12px] text-zinc-500 mt-1">{sub}</div>
        <div className="mt-4 font-mono-soft text-[11px] text-zinc-600">
          {resolution}
        </div>
      </div>
    </button>
  );
};

export default RatioCard;
