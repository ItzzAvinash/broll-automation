import React from "react";
import { Clock, GripVertical, Wand2 } from "lucide-react";
import { MOCK_BROLL } from "@/constants/mockData";
import { cn } from "@/lib/utils";

export const SceneEditorCard = ({
  scene,
  active,
  onSelect,
  onEdit,
}) => {
  const thumb = MOCK_BROLL[(scene.broll ?? 0) % MOCK_BROLL.length];

  const handleSelect = () => onSelect?.(scene.id);
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKey}
      data-testid={`scene-card-${scene.id}`}
      className={cn(
        "group w-full text-left rounded-xl border transition-all duration-200 flex gap-4 p-3 pr-5 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
        active
          ? "bg-white/[0.05] border-white/20"
          : "bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15",
      )}
    >
      <div className="flex items-center text-zinc-600 group-hover:text-zinc-400">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-white/10 shrink-0">
        <img
          src={thumb}
          alt={scene.headline}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-1 left-1.5 text-[10px] font-mono-soft text-white/80 tabular-nums">
          {scene.duration.toFixed(1)}s
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-soft text-zinc-500 tabular-nums">
            S{scene.index.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] text-zinc-600">·</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            {scene.transition}
          </span>
        </div>
        <div className="font-display text-[15px] text-zinc-100 mt-1 tracking-tight truncate">
          {scene.headline}
        </div>
        <div className="text-[12px] text-zinc-500 mt-0.5 truncate">
          {scene.text}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono-soft tabular-nums">
          <Clock className="h-3 w-3" />
          {scene.duration.toFixed(1)}s
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(scene.id);
          }}
          data-testid={`scene-edit-${scene.id}`}
          className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition"
        >
          <Wand2 className="h-3.5 w-3.5 text-zinc-300" />
        </button>
      </div>
    </div>
  );
};

export default SceneEditorCard;
