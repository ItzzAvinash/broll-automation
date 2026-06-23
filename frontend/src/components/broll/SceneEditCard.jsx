import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Hash,
  Film,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ASSET_TYPES,
  KEYWORD_REASONS,
  MOTION_STYLES,
  PLACEMENTS,
  PRIORITIES,
  PRIORITY_BADGE,
  REASON_STYLES,
} from "@/constants/editorOptions";
import { AppButton } from "@/components/broll/AppButton";

/**
 * SceneEditCard — fully editable card for a single scene in the AI Analysis
 * Review page. Inline editors for headline / textOverlay / scriptText /
 * duration / motionStyle, plus chip editors for keywords and B-roll
 * suggestions. Reorder via arrow buttons; regenerate via wand button.
 */
export const SceneEditCard = ({
  scene,
  isFirst,
  isLast,
  isActive,
  isRegenerating,
  onSelect,
  onChange,
  onReorder,
  onRegenerate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);

  const patch = (k, v) => onChange({ [k]: v });

  // --- keyword editors ---
  const addKeyword = () =>
    patch("highlightedKeywords", [
      ...(scene.highlightedKeywords || []),
      {
        text: "",
        reason: "visual",
        visualTreatment: "Highlight color",
        useHighlightColor: true,
        assetSuggestion: "",
        suggestedSearchQuery: "",
      },
    ]);
  const updateKeyword = (i, kPatch) =>
    patch(
      "highlightedKeywords",
      scene.highlightedKeywords.map((k, idx) =>
        idx === i ? { ...k, ...kPatch } : k,
      ),
    );
  const removeKeyword = (i) =>
    patch(
      "highlightedKeywords",
      scene.highlightedKeywords.filter((_, idx) => idx !== i),
    );

  // --- broll editors ---
  const addBroll = () =>
    patch("brollSuggestions", [
      ...(scene.brollSuggestions || []),
      {
        assetType: "video",
        description: "",
        suggestedSearchQuery: "",
        placement: "background",
        priority: "medium",
      },
    ]);
  const updateBroll = (i, bPatch) =>
    patch(
      "brollSuggestions",
      scene.brollSuggestions.map((b, idx) =>
        idx === i ? { ...b, ...bPatch } : b,
      ),
    );
  const removeBroll = (i) =>
    patch(
      "brollSuggestions",
      scene.brollSuggestions.filter((_, idx) => idx !== i),
    );

  return (
    <div
      data-testid={`scene-edit-card-${scene.order}`}
      onClick={onSelect}
      onFocus={onSelect}
      className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        isActive
          ? "border-white/25 bg-white/[0.04] shadow-[0_20px_60px_-30px_rgba(255,255,255,0.2)]"
          : "border-white/[0.06] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05] cursor-pointer"
        data-testid={`scene-header-${scene.order}`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          data-testid={`scene-toggle-${scene.order}`}
          className="text-zinc-500 hover:text-zinc-200 transition shrink-0"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <span className="text-[10px] font-mono-soft text-zinc-500 tabular-nums shrink-0">
          S{String(scene.order).padStart(2, "0")}
        </span>

        <div className="flex-1 min-w-0">
          <div className="font-display text-[14px] text-zinc-100 truncate">
            {scene.headline || "Untitled scene"}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
            <span>{scene.motionStyle}</span>
            <span>·</span>
            <span className="font-mono-soft tabular-nums">
              {Number(scene.duration || 0).toFixed(1)}s
            </span>
            <span>·</span>
            <span>{(scene.highlightedKeywords || []).length} keywords</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isFirst}
            data-testid={`scene-up-${scene.order}`}
            onClick={(e) => {
              e.stopPropagation();
              onReorder("up");
            }}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            data-testid={`scene-down-${scene.order}`}
            onClick={(e) => {
              e.stopPropagation();
              onReorder("down");
            }}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isRegenerating}
            data-testid={`scene-regenerate-${scene.order}`}
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] flex items-center gap-1.5 text-zinc-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-60 transition text-[11px]"
            title="Regenerate this scene"
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Regenerate
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-5 space-y-5">
          {/* Headline + Text overlay */}
          <div className="grid grid-cols-1 gap-4">
            <FieldLabel label="Headline">
              <input
                type="text"
                value={scene.headline || ""}
                onChange={(e) => patch("headline", e.target.value)}
                data-testid={`scene-headline-input-${scene.order}`}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[14px] text-zinc-100 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition"
                placeholder="Punchy on-screen caption"
              />
            </FieldLabel>
            <FieldLabel label="Text overlay">
              <input
                type="text"
                value={scene.textOverlay || ""}
                onChange={(e) => patch("textOverlay", e.target.value)}
                data-testid={`scene-overlay-input-${scene.order}`}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[14px] text-zinc-100 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition"
                placeholder="Optional subtitle line"
              />
            </FieldLabel>
            <FieldLabel label="Script text">
              <textarea
                value={scene.scriptText || ""}
                onChange={(e) => patch("scriptText", e.target.value)}
                data-testid={`scene-script-input-${scene.order}`}
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-zinc-200 leading-relaxed focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition resize-y"
                placeholder="The exact words from the script that this scene covers"
              />
            </FieldLabel>
          </div>

          {/* Motion + duration */}
          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="Motion style">
              <select
                value={scene.motionStyle || "Static"}
                onChange={(e) => patch("motionStyle", e.target.value)}
                data-testid={`scene-motion-select-${scene.order}`}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-zinc-100 focus:outline-none focus:border-white/30 transition"
              >
                {MOTION_STYLES.map((m) => (
                  <option key={m} value={m} className="bg-zinc-900">
                    {m}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel
              label={`Duration · ${Number(scene.duration || 0).toFixed(1)}s`}
            >
              <input
                type="range"
                min={2}
                max={8}
                step={0.1}
                value={scene.duration || 4}
                onChange={(e) => patch("duration", parseFloat(e.target.value))}
                data-testid={`scene-duration-input-${scene.order}`}
                className="w-full accent-white"
              />
            </FieldLabel>
          </div>

          {/* Keywords */}
          <div>
            <SectionHeader
              icon={Hash}
              title="Highlighted keywords"
              count={(scene.highlightedKeywords || []).length}
              onAdd={addKeyword}
              addTestId={`scene-add-keyword-${scene.order}`}
            />
            <div className="space-y-2 mt-3">
              {(scene.highlightedKeywords || []).map((k, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  data-testid={`keyword-row-${scene.order}-${i}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={k.text || ""}
                      onChange={(e) =>
                        updateKeyword(i, { text: e.target.value })
                      }
                      placeholder="keyword text"
                      data-testid={`keyword-text-${scene.order}-${i}`}
                      className="col-span-4 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
                    />
                    <select
                      value={k.reason || "visual"}
                      onChange={(e) =>
                        updateKeyword(i, { reason: e.target.value })
                      }
                      data-testid={`keyword-reason-${scene.order}-${i}`}
                      className={cn(
                        "col-span-3 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-zinc-100 focus:outline-none focus:border-white/30 bg-gradient-to-b",
                        REASON_STYLES[k.reason] || REASON_STYLES.visual,
                      )}
                    >
                      {KEYWORD_REASONS.map((r) => (
                        <option key={r.id} value={r.id} className="bg-zinc-900 text-zinc-100">
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={k.suggestedSearchQuery || ""}
                      onChange={(e) =>
                        updateKeyword(i, { suggestedSearchQuery: e.target.value })
                      }
                      placeholder="search query"
                      data-testid={`keyword-query-${scene.order}-${i}`}
                      className="col-span-4 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono-soft focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeKeyword(i)}
                      data-testid={`keyword-remove-${scene.order}-${i}`}
                      className="col-span-1 h-7 w-7 rounded-md border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-300 hover:border-red-300/30 transition justify-self-end"
                      title="Remove keyword"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B-roll suggestions */}
          <div>
            <SectionHeader
              icon={Film}
              title="B-roll suggestions"
              count={(scene.brollSuggestions || []).length}
              onAdd={addBroll}
              addTestId={`scene-add-broll-${scene.order}`}
            />
            <div className="space-y-2 mt-3">
              {(scene.brollSuggestions || []).map((b, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2"
                  data-testid={`broll-row-${scene.order}-${i}`}
                >
                  <input
                    type="text"
                    value={b.description || ""}
                    onChange={(e) =>
                      updateBroll(i, { description: e.target.value })
                    }
                    placeholder="Cinematic description"
                    data-testid={`broll-desc-${scene.order}-${i}`}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
                  />
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={b.suggestedSearchQuery || ""}
                      onChange={(e) =>
                        updateBroll(i, {
                          suggestedSearchQuery: e.target.value,
                        })
                      }
                      placeholder="search query"
                      data-testid={`broll-query-${scene.order}-${i}`}
                      className="col-span-5 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono-soft focus:outline-none focus:border-white/30"
                    />
                    <select
                      value={b.assetType || "video"}
                      onChange={(e) =>
                        updateBroll(i, { assetType: e.target.value })
                      }
                      data-testid={`broll-type-${scene.order}-${i}`}
                      className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5 text-[11px] text-zinc-100 focus:outline-none uppercase tracking-wider"
                    >
                      {ASSET_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-zinc-900">
                          {t}
                        </option>
                      ))}
                    </select>
                    <select
                      value={b.placement || "background"}
                      onChange={(e) =>
                        updateBroll(i, { placement: e.target.value })
                      }
                      data-testid={`broll-placement-${scene.order}-${i}`}
                      className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-1.5 text-[11px] text-zinc-100 focus:outline-none"
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p} value={p} className="bg-zinc-900">
                          {p}
                        </option>
                      ))}
                    </select>
                    <select
                      value={b.priority || "medium"}
                      onChange={(e) =>
                        updateBroll(i, { priority: e.target.value })
                      }
                      data-testid={`broll-priority-${scene.order}-${i}`}
                      className={cn(
                        "col-span-2 rounded-md px-1.5 py-1.5 text-[10px] uppercase tracking-wider focus:outline-none border border-white/[0.06]",
                        PRIORITY_BADGE[b.priority] || PRIORITY_BADGE.medium,
                      )}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p} className="bg-zinc-900 text-zinc-100">
                          {p}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeBroll(i)}
                      data-testid={`broll-remove-${scene.order}-${i}`}
                      className="col-span-1 h-7 w-7 rounded-md border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-300 hover:border-red-300/30 transition justify-self-end"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {onDelete && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onDelete}
                data-testid={`scene-delete-${scene.order}`}
                className="text-[11px] text-zinc-500 hover:text-red-300 flex items-center gap-1.5 transition"
              >
                <Trash2 className="h-3 w-3" />
                Delete scene
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FieldLabel = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
      {label}
    </span>
    {children}
  </label>
);

const SectionHeader = ({ icon: Icon, title, count, onAdd, addTestId }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-zinc-500" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </span>
      <span className="text-[10px] font-mono-soft text-zinc-600 tabular-nums">
        {count}
      </span>
    </div>
    <button
      type="button"
      onClick={onAdd}
      data-testid={addTestId}
      className="text-[11px] text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition"
    >
      <Plus className="h-3 w-3" />
      Add
    </button>
  </div>
);

export default SceneEditCard;
