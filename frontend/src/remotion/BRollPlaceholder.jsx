import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { BRAND_LETTER_SPACING } from "@/constants/mockData";

/**
 * BRollPlaceholder — premium animated placeholder block that stands in for
 * real B-roll footage during MVP preview. Slow zoom + subtle moving gradient
 * + label that reads "B-ROLL · {description}".
 */
export const BRollPlaceholder = ({ description, brand, accentTone }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slow Push effect: scale 1.0 -> 1.06 over the scene
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  // Drift the gradient over time
  const drift = (frame / fps) * 8; // px/sec
  const gridPos = (frame % 90) * 1.4;

  // Soft fade-in
  const opacity = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 90, mass: 0.7 },
    durationInFrames: Math.floor(fps * 0.6),
  });

  const primary = brand?.primary || "#0A0A0B";
  const highlight = brand?.highlight || "#E4B8A0";
  const secondary = brand?.secondary || "#FAFAFA";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* Base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: primary,
        }}
      />

      {/* Layered cinematic gradient using brand colors */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(900px 600px at ${20 + drift}% 30%, ${highlight}22, transparent 60%),
                       radial-gradient(700px 500px at 80% ${70 + drift}%, ${secondary}10, transparent 55%)`,
        }}
      />

      {/* Moving grid (very subtle) */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          mixBlendMode: "screen",
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${gridPos} 0)`}
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke={secondary}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Soft vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${primary}EE 0%, ${primary}55 40%, ${primary}AA 100%)`,
        }}
      />

      {/* B-ROLL label chip */}
      <div
        style={{
          position: "absolute",
          top: 36,
          right: 36,
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${secondary}22`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: highlight,
            boxShadow: `0 0 12px ${highlight}AA`,
          }}
        />
        <span
          style={{
            color: secondary,
            fontSize: 14,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          B-roll · {accentTone || "Visual"}
        </span>
      </div>

      {/* Description in the centre — large but minimal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 64,
        }}
      >
        <div
          style={{
            color: `${secondary}55`,
            fontSize: 36,
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: "70%",
            letterSpacing: BRAND_LETTER_SPACING,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 200,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

export default BRollPlaceholder;
