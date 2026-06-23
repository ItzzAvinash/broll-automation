import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {
  BRAND_LETTER_SPACING,
  counterpartFontId,
  getFontById,
} from "@/constants/mockData";

/**
 * Caption — animates a headline word-by-word with a keyword pop animation.
 * Keywords use the opposite font + highlight color.
 */
export const Caption = ({ headline, textOverlay, highlightedKeywords, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainFont = getFontById(brand.mainFont);
  const keywordFont = getFontById(counterpartFontId(brand.mainFont));

  const highlightSet = new Set(
    (highlightedKeywords || [])
      .filter((k) => k.useHighlightColor !== false)
      .map((k) => (k.text || "").toLowerCase()),
  );

  const tokens = (headline || "").split(/(\s+)/);
  // Pace word-by-word reveal — every 5 frames
  const PER_WORD = 5;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 64,
        zIndex: 3,
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          color: brand.highlight,
          fontSize: 16,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontFamily: keywordFont.stack,
          fontStyle: keywordFont.style?.fontStyle || "italic",
          marginBottom: 18,
          opacity: interpolate(frame, [0, 8], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        {brand.brandName || "Roll"}
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: mainFont.stack,
          fontStyle: mainFont.style?.fontStyle || "italic",
          letterSpacing: BRAND_LETTER_SPACING,
          fontSize: 78,
          lineHeight: 1.05,
          color: brand.secondary,
          maxWidth: "85%",
          fontWeight: 300,
        }}
      >
        {tokens.map((tok, i) => {
          if (tok.match(/^\s+$/)) return <span key={i}>{tok}</span>;

          const enterFrame = (Math.floor(i / 2)) * PER_WORD;
          const localFrame = frame - enterFrame;

          const wordOpacity = interpolate(localFrame, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const yOffset = interpolate(localFrame, [0, 10], [10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const clean = tok.replace(/[^\w]/g, "").toLowerCase();
          const isKeyword = clean && highlightSet.has(clean);

          // Spring scale for keyword "pop"
          let popScale = 1;
          if (isKeyword && localFrame >= 0) {
            popScale = spring({
              frame: localFrame,
              fps,
              from: 0.86,
              to: 1.0,
              config: { damping: 12, stiffness: 220, mass: 0.4 },
              durationInFrames: 14,
            });
          }

          const wordStyle = isKeyword
            ? {
                fontFamily: keywordFont.stack,
                fontStyle: keywordFont.style?.fontStyle || "italic",
                color: brand.highlight,
              }
            : {};

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: wordOpacity,
                transform: `translateY(${yOffset}px) scale(${popScale})`,
                transformOrigin: "left center",
                letterSpacing: BRAND_LETTER_SPACING,
                ...wordStyle,
              }}
            >
              {tok}
            </span>
          );
        })}
      </div>

      {/* Text overlay (subtitle) */}
      {textOverlay && (
        <div
          style={{
            marginTop: 22,
            fontFamily: mainFont.stack,
            fontStyle: mainFont.style?.fontStyle || "italic",
            letterSpacing: BRAND_LETTER_SPACING,
            fontSize: 22,
            color: brand.secondary,
            opacity: interpolate(frame, [10, 24], [0, 0.78], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            maxWidth: "65%",
          }}
        >
          {textOverlay}
        </div>
      )}
    </div>
  );
};

export default Caption;
