import React from "react";
import {
  BRAND_LETTER_SPACING,
  MOCK_BROLL,
  RATIOS,
  counterpartFontId,
  getFontById,
} from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";

/**
 * PlanPreviewPanel — renders a brand-styled video preview for ONE scene
 * from the generated plan (with highlighted keywords styled in the
 * counterpart font + highlight color). Used in the AI Analysis Review
 * page's right column.
 */
export const PlanPreviewPanel = ({ scene }) => {
  const { state } = useProject();
  const ratio = RATIOS.find((r) => r.id === state.ratio) || RATIOS[0];
  const isVertical = ratio.h > ratio.w;
  const aspect = `${ratio.w} / ${ratio.h}`;
  const thumbIdx = (scene?.order ?? 1) - 1;
  const thumbUrl = MOCK_BROLL[thumbIdx % MOCK_BROLL.length];

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

  const renderHeadline = () => {
    if (!scene?.headline) return null;
    const highlights = new Set(
      (scene.highlightedKeywords || [])
        .filter((k) => k.useHighlightColor !== false)
        .map((k) => (k.text || "").toLowerCase()),
    );
    // Token-aware highlight: match whole-word keywords ignoring punctuation
    const tokens = scene.headline.split(/(\s+)/);
    return tokens.map((tok, i) => {
      const clean = tok.replace(/[^\w]/g, "").toLowerCase();
      if (clean && highlights.has(clean)) {
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

  if (!scene) return null;

  return (
    <div
      data-testid="plan-preview-stage"
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-eyebrow">Preview</div>
          <div className="font-display text-[15px] text-zinc-100 mt-1">
            Scene {String(scene.order).padStart(2, "0")} ·{" "}
            <span className="text-zinc-500">{scene.motionStyle}</span>
          </div>
        </div>
        <span className="font-mono-soft text-[11px] text-zinc-500 tabular-nums">
          {Number(scene.duration || 0).toFixed(1)}s
        </span>
      </div>

      <div className="flex items-center justify-center min-h-[360px]">
        <div
          className="relative rounded-xl overflow-hidden border border-white/15"
          style={{
            aspectRatio: aspect,
            width: isVertical ? "auto" : "100%",
            height: isVertical ? "400px" : "auto",
            maxWidth: "100%",
            backgroundColor: state.brand.primary,
          }}
        >
          <img
            src={thumbUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${state.brand.primary}E6 0%, ${state.brand.primary}55 45%, ${state.brand.primary}88 100%)`,
            }}
          />

          <div className="absolute inset-x-0 bottom-0 p-6">
            <div
              className="text-[10px] uppercase tracking-[0.22em] mb-2"
              style={{ ...keywordStyle, color: state.brand.highlight }}
            >
              Scene {String(scene.order).padStart(2, "0")}
            </div>
            <div
              className="text-[22px] sm:text-[26px] font-light leading-tight"
              style={{ ...mainStyle, color: state.brand.secondary }}
              data-testid="plan-preview-headline"
            >
              {renderHeadline()}
            </div>
            {scene.textOverlay && (
              <div
                className="text-[12px] mt-2 opacity-75"
                style={{ ...mainStyle, color: state.brand.secondary }}
                data-testid="plan-preview-overlay"
              >
                {scene.textOverlay}
              </div>
            )}
          </div>

          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
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
    </div>
  );
};

export default PlanPreviewPanel;
