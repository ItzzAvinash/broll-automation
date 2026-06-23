import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import BRollPlaceholder from "@/remotion/BRollPlaceholder";
import Caption from "@/remotion/Caption";

const TRANSITION_FRAMES = 12;

/**
 * Single scene — composes a B-roll placeholder + animated caption.
 * Wrapped in a fade-in/out shell so consecutive scenes cross-fade.
 */
const Scene = ({ scene, brand, isFirst, isLast }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
        extrapolateRight: "clamp",
      });
  const fadeOut = isLast
    ? 1
    : interpolate(
        frame,
        [durationInFrames - TRANSITION_FRAMES, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp" },
      );
  const opacity = fadeIn * fadeOut;

  const primaryBroll = (scene.brollSuggestions || [])[0];
  const description =
    primaryBroll?.description ||
    `B-roll · ${scene.headline || "Scene"}`;
  const accentTone = primaryBroll?.assetType || "Visual";

  return (
    <AbsoluteFill style={{ backgroundColor: brand.primary, opacity }}>
      <BRollPlaceholder
        description={description}
        accentTone={accentTone}
        brand={brand}
      />
      <Caption
        headline={scene.headline}
        textOverlay={scene.textOverlay}
        highlightedKeywords={scene.highlightedKeywords}
        brand={brand}
      />
    </AbsoluteFill>
  );
};

/**
 * BrollComposition — root Remotion composition.
 * Renders all scenes sequentially with cross-fade transitions.
 *
 * Props:
 * - plan:  { projectTitle, scenes: [...] }
 * - brand: { primary, secondary, highlight, mainFont, brandName, ... }
 * - fps:   30 (provided via Player config)
 */
export const BrollComposition = ({ plan, brand }) => {
  const { fps } = useVideoConfig();
  const scenes = plan?.scenes || [];

  let offset = 0;
  const sequences = scenes.map((scene, idx) => {
    const sceneFrames = Math.max(
      Math.floor((scene.duration || 4) * fps),
      Math.floor(2 * fps),
    );
    const seq = (
      <Sequence
        key={scene.order ?? idx}
        from={Math.max(offset - (idx === 0 ? 0 : TRANSITION_FRAMES), 0)}
        durationInFrames={sceneFrames + (idx === 0 ? 0 : TRANSITION_FRAMES)}
      >
        <Scene
          scene={scene}
          brand={brand}
          isFirst={idx === 0}
          isLast={idx === scenes.length - 1}
        />
      </Sequence>
    );
    offset += sceneFrames;
    return seq;
  });

  return <AbsoluteFill>{sequences}</AbsoluteFill>;
};

/** Helper — compute total duration in frames for a given plan at given fps */
export const calcDurationInFrames = (plan, fps = 30) => {
  if (!plan?.scenes?.length) return fps * 2; // 2s placeholder
  const total = plan.scenes.reduce(
    (acc, s) => acc + Math.max(s.duration || 4, 2),
    0,
  );
  return Math.max(Math.floor(total * fps), fps);
};

export default BrollComposition;
