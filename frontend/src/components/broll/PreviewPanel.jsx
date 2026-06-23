import React, { useState } from "react";
import { Play, Pause, Volume2, Maximize2 } from "lucide-react";
import {
  BRAND_LETTER_SPACING,
  MOCK_BROLL,
  RATIOS,
  counterpartFontId,
  getFontById,
} from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";

/**
 * Premium video preview surface with mock playback bar.
 * Used in Step 5 (Preview/Editor).
 */
export const PreviewPanel = ({ activeSceneIndex = 0 }) => {
  const { state } = useProject();
  const [playing, setPlaying] = useState(false);
  const [time] = useState(2.4);

  const ratio = RATIOS.find((r) => r.id === state.ratio) || RATIOS[0];
  const aspect = `${ratio.w} / ${ratio.h}`;
  const totalDuration = state.scenes.reduce((acc, s) => acc + s.duration, 0);
  const scene = state.scenes[activeSceneIndex] || state.scenes[0];
  const thumbIdx = scene?.broll ?? 0;
  const thumbUrl = MOCK_BROLL[thumbIdx % MOCK_BROLL.length];

  const isVertical = ratio.h > ratio.w;

  const mainFont = getFontById(state.brand.mainFont);
  const keywordFont = getFontById(counterpartFontId(state.brand.mainFont));

  const mainStyle = {
    fontFamily: mainFont.stack,
    fontStyle: mainFont.style?.fontStyle || "italic",
    letterSpacing: BRAND_LETTER_SPACING,
  };
  const keywordStyle = {
    fontFamily: keywordFont.stack,
    fontStyle: keywordFont.style?.fontStyle || "italic",
    letterSpacing: BRAND_LETTER_SPACING,
  };

  // Render headline w/ highlighted keywords
  const renderHeadline = () => {
    if (!scene?.headline) return null;
    const highlights = new Set(
      (scene.highlightWords || []).map((w) => w.toLowerCase()),
    );
    const tokens = scene.headline.split(/(\s+)/);
    return tokens.map((tok, i) => {
      const clean = tok.replace(/[^\w]/g, "").toLowerCase();
      if (highlights.has(clean)) {
        return (
          <span
            key={i}
            style={{ ...keywordStyle, color: state.brand.highlight }}
          >
            {tok}
          </span>
        );
      }
      return <span key={i}>{tok}</span>;
    });
  };

  return (
    <div className="relative">
      <div
        data-testid="preview-stage"
        className="glass-panel rounded-2xl p-8 flex items-center justify-center min-h-[520px]"
      >
        <div
          className="relative rounded-xl overflow-hidden border border-white/15"
          style={{
            aspectRatio: aspect,
            width: isVertical ? "auto" : "100%",
            height: isVertical ? "460px" : "auto",
            maxWidth: "100%",
            backgroundColor: state.brand.primary,
          }}
        >
          <img
            src={thumbUrl}
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover opacity-65 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${state.brand.primary}E6 0%, ${state.brand.primary}55 45%, ${state.brand.primary}88 100%)`,
            }}
          />

          {/* Caption */}
          <div className="absolute inset-x-0 bottom-0 p-8">
            <div
              className="text-[10px] uppercase tracking-[0.22em] mb-3"
              style={{ ...keywordStyle, color: state.brand.highlight }}
            >
              Scene {scene?.index?.toString().padStart(2, "0")}
            </div>
            <div
              className="text-2xl sm:text-3xl font-light leading-tight max-w-[85%]"
              style={{ ...mainStyle, color: state.brand.secondary }}
            >
              {renderHeadline()}
            </div>
          </div>

          {/* Brand watermark */}
          <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: state.brand.highlight }}
            />
            <span
              className="text-[11px]"
              style={{ ...mainStyle, color: state.brand.secondary }}
            >
              {state.brand.brandName}
            </span>
          </div>
        </div>
      </div>

      {/* Transport controls */}
      <div
        data-testid="preview-transport"
        className="mt-4 glass-panel rounded-2xl px-6 py-4 flex items-center gap-5"
      >
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          data-testid="preview-play-button"
          className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200",
            playing
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/15 border border-white/15",
          )}
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <div className="font-mono-soft text-[12px] text-zinc-400 tabular-nums">
          {time.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </div>

        <div className="flex-1 relative h-1 rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-white/80 rounded-full transition-all"
            style={{ width: `${(time / totalDuration) * 100}%` }}
          />
        </div>

        <button
          className="text-zinc-500 hover:text-zinc-300 transition"
          data-testid="preview-volume-button"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <button
          className="text-zinc-500 hover:text-zinc-300 transition"
          data-testid="preview-fullscreen-button"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PreviewPanel;
