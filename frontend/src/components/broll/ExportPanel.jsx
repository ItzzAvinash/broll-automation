import React, { useMemo, useRef, useState, useEffect } from "react";
import { Player } from "@remotion/player";
import { Link } from "react-router-dom";
import {
  Check,
  Download,
  Loader2,
  Film,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { RATIOS } from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";
import { AppButton } from "@/components/broll/AppButton";
import { GlassCard } from "@/components/broll/GlassCard";
import {
  BrollComposition,
  calcDurationInFrames,
} from "@/remotion/BrollComposition";
import {
  exportVideo,
  totalSeconds,
  safeFileName,
  triggerDownload,
  pickMimeType,
} from "@/lib/videoExport";
import { cn } from "@/lib/utils";

const FPS = 30;

const EmptyState = () => (
  <GlassCard className="text-center" data-testid="export-empty-state">
    <div className="mx-auto h-12 w-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-5">
      <Sparkles className="h-5 w-5 text-zinc-400" />
    </div>
    <h3 className="font-display text-2xl font-light tracking-tight">
      Nothing to export yet
    </h3>
    <p className="mt-2 text-[13px] text-zinc-500 max-w-md mx-auto">
      Generate a B-roll plan from your script, review it in the editor, then come
      back here to render and download your MP4.
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <Link to="/script">
        <AppButton
          variant="secondary"
          size="md"
          data-testid="export-back-to-script-button"
        >
          Go to Script
        </AppButton>
      </Link>
      <Link to="/preview">
        <AppButton
          variant="primary"
          size="md"
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          Open Preview
        </AppButton>
      </Link>
    </div>
  </GlassCard>
);

export const ExportPanel = () => {
  const { state } = useProject();
  const plan = state.plan;
  const brand = state.brand;
  const ratio = useMemo(
    () => RATIOS.find((r) => r.id === state.ratio) || RATIOS[0],
    [state.ratio],
  );

  const W = ratio.id === "9:16" ? 1080 : 1920;
  const H = ratio.id === "9:16" ? 1920 : 1080;

  const durationFrames = useMemo(() => calcDurationInFrames(plan, FPS), [plan]);
  const seconds = useMemo(() => (plan ? totalSeconds(plan, FPS) : 0), [plan]);

  const [status, setStatus] = useState("idle"); // idle | rendering | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null); // { blob, mime, ext }
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const mimeSupported = useMemo(() => pickMimeType(), []);

  // Clean up any object URLs / abort on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  if (!plan || !plan.scenes?.length) {
    return <EmptyState />;
  }

  const projectTitle = plan.projectTitle || "Untitled B-roll";
  const sceneCount = plan.scenes.length;

  const handleExport = async () => {
    if (status === "rendering") return;
    setError(null);
    setResult(null);
    setProgress(0);
    setStatus("rendering");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const out = await exportVideo({
        plan,
        brand,
        ratioId: ratio.id,
        fps: FPS,
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
      });
      setResult(out);
      setStatus("done");
      // auto-download once finished
      triggerDownload(out.blob, safeFileName(projectTitle, out.ext));
    } catch (e) {
      if (e?.name === "AbortError") {
        setStatus("idle");
      } else {
        setError(e?.message || "Export failed.");
        setStatus("error");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const handleDownloadAgain = () => {
    if (result?.blob) {
      triggerDownload(result.blob, safeFileName(projectTitle, result.ext));
    }
  };

  const pct = Math.round(progress * 100);
  const willBeMp4 = (mimeSupported || "").includes("mp4");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* LEFT — final preview */}
      <div className="xl:col-span-3 space-y-4">
        <GlassCard padded={false} className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Film className="h-3.5 w-3.5 text-zinc-400" />
              <div className="text-eyebrow">Final preview</div>
              <span className="font-mono-soft text-[11px] text-zinc-500 ml-2">
                {W} × {H} @ {FPS}fps
              </span>
            </div>
            <span className="font-mono-soft text-[11px] text-zinc-500 tabular-nums">
              {seconds.toFixed(1)}s · {sceneCount} scenes
            </span>
          </div>
          <div
            className="flex items-center justify-center p-6 min-h-[460px]"
            data-testid="export-player-stage"
          >
            <div
              style={{
                width: "100%",
                maxWidth: ratio.h > ratio.w ? 320 : "100%",
                aspectRatio: `${ratio.w} / ${ratio.h}`,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
              }}
            >
              <Player
                component={BrollComposition}
                durationInFrames={durationFrames}
                fps={FPS}
                compositionWidth={W}
                compositionHeight={H}
                inputProps={{ plan, brand }}
                controls
                loop
                clickToPlay
                acknowledgeRemotionLicense
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: brand.primary,
                }}
                data-testid="export-remotion-player"
              />
            </div>
          </div>
        </GlassCard>
        <p className="text-[11px] text-zinc-600 text-center">
          The exported MP4 is rendered from this exact plan — same ratio, brand
          colors, fonts, keyword highlights, scene order and B-roll placeholders.
        </p>
      </div>

      {/* RIGHT — summary + export controls */}
      <div className="xl:col-span-2 space-y-5">
        <GlassCard padded={false} data-testid="export-summary">
          <div className="px-6 py-4 border-b border-white/[0.05] text-eyebrow">
            Export summary
          </div>
          <div className="p-6 space-y-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Project
            </div>
            <div
              className="font-display text-xl font-light tracking-tight text-zinc-50 leading-snug"
              data-testid="export-project-title"
            >
              {projectTitle}
            </div>
            <div className="pt-4 space-y-1">
              <Row label="Ratio" value={`${ratio.id} · ${ratio.resolution}`} />
              <Row label="Scenes" value={`${sceneCount}`} mono />
              <Row label="Duration" value={`${seconds.toFixed(1)}s`} mono />
              <Row label="Background" value={brand.primary?.toUpperCase()} mono />
              <Row label="Highlight" value={brand.highlight?.toUpperCase()} mono />
              <Row
                label="Format"
                value={willBeMp4 ? "MP4 · H.264" : "WebM (MP4 unsupported here)"}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard padded={false}>
          <div className="px-6 py-4 border-b border-white/[0.05] text-eyebrow">
            Render &amp; download
          </div>
          <div className="p-6">
            {(status === "rendering" || status === "done") && (
              <div className="mb-5" data-testid="export-progress">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-zinc-400 font-mono-soft">
                    {status === "done" ? "Render complete" : "Rendering in real time…"}
                  </span>
                  <span className="text-[12px] text-zinc-200 font-mono-soft tabular-nums">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-150",
                      status === "done" ? "bg-emerald-400/80" : "bg-white",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {status === "rendering" && (
                  <p className="text-[11px] text-zinc-600 mt-2">
                    Capturing {seconds.toFixed(1)}s of animation — this runs at
                    playback speed.
                  </p>
                )}
              </div>
            )}

            {status === "error" && (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
                data-testid="export-error"
              >
                <AlertTriangle className="h-4 w-4 text-red-300 mt-0.5 shrink-0" />
                <p className="text-[12px] text-red-200/90 leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {status === "done" ? (
              <div className="space-y-3">
                <div
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3"
                  data-testid="export-done-banner"
                >
                  <Check className="h-4 w-4 text-emerald-300" strokeWidth={2.5} />
                  <span className="text-[13px] text-emerald-100">
                    {(result?.ext || "mp4").toUpperCase()} downloaded
                  </span>
                </div>
                <AppButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleDownloadAgain}
                  data-testid="export-download-button"
                  iconLeft={<Download className="h-4 w-4" />}
                >
                  Download again
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={handleExport}
                  data-testid="export-rerender-button"
                  iconLeft={<RotateCcw className="h-4 w-4" />}
                >
                  Re-render
                </AppButton>
              </div>
            ) : status === "rendering" ? (
              <AppButton
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleCancel}
                data-testid="export-cancel-button"
                iconLeft={<Loader2 className="h-4 w-4 animate-spin" />}
              >
                Cancel render
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleExport}
                disabled={!mimeSupported}
                data-testid="export-render-button"
                iconLeft={<Download className="h-4 w-4" />}
              >
                Export {willBeMp4 ? "MP4" : "video"}
              </AppButton>
            )}

            {!mimeSupported && (
              <p className="text-[11px] text-red-300/80 mt-3 text-center">
                This browser does not support in-browser video recording.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
    <span className="text-zinc-500 text-[10px] uppercase tracking-[0.18em]">
      {label}
    </span>
    <span
      className={cn(
        "text-zinc-100 text-[13px]",
        mono && "font-mono-soft tabular-nums",
      )}
    >
      {value}
    </span>
  </div>
);

export default ExportPanel;
