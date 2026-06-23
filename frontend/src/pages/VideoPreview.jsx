import React, { useMemo, useRef, useState, useEffect } from "react";
import { Player } from "@remotion/player";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Layers, Film } from "lucide-react";
import StepLayout from "@/components/broll/StepLayout";
import GlassCard from "@/components/broll/GlassCard";
import { AppButton } from "@/components/broll/AppButton";
import { useProject } from "@/context/ProjectContext";
import { RATIOS } from "@/constants/mockData";
import {
  BrollComposition,
  calcDurationInFrames,
} from "@/remotion/BrollComposition";
import { cn } from "@/lib/utils";

const FPS = 30;

const EmptyState = () => (
  <GlassCard className="text-center" data-testid="preview-empty-state">
    <div className="mx-auto h-12 w-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-5">
      <Sparkles className="h-5 w-5 text-zinc-400" />
    </div>
    <h3 className="font-display text-2xl font-light tracking-tight">
      Nothing to preview yet
    </h3>
    <p className="mt-2 text-[13px] text-zinc-500 max-w-md mx-auto">
      Generate a B-roll plan from your script first — then return here to watch
      it animate.
    </p>
    <div className="mt-6 flex justify-center">
      <Link to="/script">
        <AppButton
          variant="primary"
          size="md"
          iconRight={<ArrowRight className="h-4 w-4" />}
          data-testid="preview-back-to-script-button"
        >
          Go to Script
        </AppButton>
      </Link>
    </div>
  </GlassCard>
);

export default function VideoPreview() {
  const { state } = useProject();
  const plan = state.plan;
  const brand = state.brand;
  const ratio = useMemo(
    () => RATIOS.find((r) => r.id === state.ratio) || RATIOS[0],
    [state.ratio],
  );

  // Composition dimensions
  const baseSize = ratio.h > ratio.w ? 1080 : 1920;
  const compositionWidth =
    ratio.h > ratio.w ? baseSize : Math.round(baseSize * (ratio.w / ratio.h));
  const compositionHeight =
    ratio.h > ratio.w ? Math.round(baseSize * (ratio.h / ratio.w)) : 1080;
  // Use canonical 1920x1080 / 1080x1920 for cleanliness
  const W = ratio.id === "16:9" ? 1920 : 1080;
  const H = ratio.id === "16:9" ? 1080 : 1920;

  const totalFrames = useMemo(
    () => calcDurationInFrames(plan, FPS),
    [plan],
  );

  const playerRef = useRef(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  // Build a frame->scene index map for quick lookup
  const sceneOffsets = useMemo(() => {
    if (!plan?.scenes?.length) return [];
    const offsets = [];
    let f = 0;
    plan.scenes.forEach((s) => {
      offsets.push(f);
      f += Math.floor((s.duration || 4) * FPS);
    });
    return offsets;
  }, [plan]);

  // Subscribe to Player frame updates to keep the active scene chip in sync
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !plan?.scenes?.length) return;
    const onFrameUpdate = (e) => {
      const frame = e.detail.frame;
      // Find scene whose offset is ≤ frame and next > frame
      let idx = 0;
      for (let i = 0; i < sceneOffsets.length; i++) {
        if (sceneOffsets[i] <= frame) idx = i;
      }
      setActiveSceneIdx(idx);
    };
    p.addEventListener("frameupdate", onFrameUpdate);
    return () => p.removeEventListener("frameupdate", onFrameUpdate);
  }, [plan, sceneOffsets]);

  const seekToScene = (idx) => {
    const p = playerRef.current;
    const target = sceneOffsets[idx] ?? 0;
    if (p && p.seekTo) p.seekTo(target);
    setActiveSceneIdx(idx);
  };

  if (!plan || !plan.scenes?.length) {
    return (
      <StepLayout
        stepId={5}
        eyebrow="Step 05 · Editor"
        title="Preview your video."
        description="Once you've generated a plan, you'll see your B-roll come to life right here — animated word-by-word, frame-by-frame."
      >
        <EmptyState />
      </StepLayout>
    );
  }

  const totalSeconds = (totalFrames / FPS).toFixed(1);

  return (
    <StepLayout
      stepId={5}
      eyebrow="Step 05 · Editor"
      title="Preview your video."
      description={`${plan.scenes.length} scenes · ${totalSeconds}s · rendered via Remotion in your browser. Edit any scene back on Step 04 — changes appear here instantly.`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT — Player */}
        <div className="xl:col-span-3 space-y-4">
          <GlassCard padded={false} className="overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Film className="h-3.5 w-3.5 text-zinc-400" />
                <div className="text-eyebrow">Live preview · Remotion</div>
                <span className="font-mono-soft text-[11px] text-zinc-500 ml-2">
                  {W} × {H} @ {FPS}fps
                </span>
              </div>
              <span className="font-mono-soft text-[11px] text-zinc-500 tabular-nums">
                {totalSeconds}s · {plan.scenes.length} scenes
              </span>
            </div>

            <div
              className="flex items-center justify-center p-6 min-h-[500px]"
              data-testid="player-stage"
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: ratio.h > ratio.w ? 360 : "100%",
                  aspectRatio: `${ratio.w} / ${ratio.h}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
                }}
              >
                <Player
                  ref={playerRef}
                  component={BrollComposition}
                  durationInFrames={totalFrames}
                  fps={FPS}
                  compositionWidth={W}
                  compositionHeight={H}
                  inputProps={{ plan, brand }}
                  controls
                  loop
                  clickToPlay
                  acknowledgeRemotionLicense
                  doubleClickToFullscreen
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: brand.primary,
                  }}
                  data-testid="remotion-player"
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT — Scene strip + brand summary */}
        <div className="xl:col-span-2 space-y-5">
          <GlassCard padded={false}>
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                <div className="text-eyebrow">Scene strip</div>
              </div>
              <span className="font-mono-soft text-[11px] text-zinc-500">
                click to scrub
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto" data-testid="scene-strip">
              {plan.scenes.map((s, idx) => {
                const active = idx === activeSceneIdx;
                return (
                  <button
                    key={s.order ?? idx}
                    type="button"
                    onClick={() => seekToScene(idx)}
                    data-testid={`scene-strip-${s.order ?? idx + 1}`}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-3 transition-all duration-200",
                      active
                        ? "bg-white/[0.06] border-white/25"
                        : "bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-soft text-zinc-500 tabular-nums">
                        S{String(s.order ?? idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {s.motionStyle}
                      </span>
                      <span className="text-[10px] font-mono-soft text-zinc-500 ml-auto tabular-nums">
                        {Number(s.duration || 0).toFixed(1)}s
                      </span>
                    </div>
                    <div className="font-display text-[14px] text-zinc-100 mt-1.5 line-clamp-2 leading-snug">
                      {s.headline}
                    </div>
                    {s.brollSuggestions?.[0]?.description && (
                      <div className="text-[11px] text-zinc-500 mt-1 truncate font-mono-soft">
                        ▸ {s.brollSuggestions[0].description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard padded={false} data-testid="preview-summary">
            <div className="px-6 py-4 border-b border-white/[0.05] text-eyebrow">
              Render summary
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Row label="Ratio" value={`${ratio.id} · ${ratio.resolution}`} />
              <Row label="Frames" value={`${totalFrames}`} mono />
              <Row
                label="Duration"
                value={`${totalSeconds}s`}
                mono
              />
              <Row label="Composition" value={`${W} × ${H} @ ${FPS}fps`} mono />
              <Row label="Background" value={brand.primary.toUpperCase()} mono />
              <Row label="Highlight" value={brand.highlight.toUpperCase()} mono />
            </div>
          </GlassCard>
        </div>
      </div>
    </StepLayout>
  );
}

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
      {label}
    </span>
    <span
      className={`text-[13px] text-zinc-100 ${mono ? "font-mono-soft tabular-nums" : ""}`}
    >
      {value}
    </span>
  </div>
);
