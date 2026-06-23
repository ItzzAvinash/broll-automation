import React, { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { EXPORT_PRESETS, RATIOS } from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";
import { AppButton } from "@/components/broll/AppButton";
import { GlassCard } from "@/components/broll/GlassCard";
import { cn } from "@/lib/utils";

export const ExportPanel = () => {
  const { state, update } = useProject();
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const ratio = RATIOS.find((r) => r.id === state.ratio) || RATIOS[1];
  const selectedPreset =
    EXPORT_PRESETS.find((p) => p.id === state.exportPreset) || EXPORT_PRESETS[1];
  const totalDuration = state.scenes.reduce((a, s) => a + s.duration, 0);

  const startRender = () => {
    if (rendering) return;
    setDone(false);
    setRendering(true);
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 2 + Math.random() * 4;
        if (next >= 100) {
          clearInterval(id);
          setRendering(false);
          setDone(true);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT — preset selection */}
      <GlassCard className="lg:col-span-3" padded={false}>
        <div className="p-8 pb-4">
          <div className="text-eyebrow">Render preset</div>
          <h3 className="font-display text-xl font-light tracking-tight mt-2">
            Choose your output quality
          </h3>
        </div>
        <div className="px-6 pb-6 space-y-2">
          {EXPORT_PRESETS.map((preset) => {
            const selected = state.exportPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => update({ exportPreset: preset.id })}
                data-testid={`export-preset-${preset.id}`}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-5 py-4 transition-all",
                  selected
                    ? "border-white/25 bg-white/[0.06]"
                    : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/15",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center transition",
                      selected ? "bg-white border-white" : "border-white/20",
                    )}
                  >
                    {selected && (
                      <Check
                        className="h-3 w-3 text-black"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-display text-[15px] text-zinc-100 tracking-tight">
                      {preset.label}
                    </div>
                    <div className="text-[12px] text-zinc-500 mt-0.5">
                      {preset.sub}
                    </div>
                  </div>
                </div>
                <div className="font-mono-soft text-[12px] text-zinc-500 tabular-nums">
                  {preset.size}
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* RIGHT — render */}
      <GlassCard className="lg:col-span-2 flex flex-col" padded={false}>
        <div className="p-8 pb-6">
          <div className="text-eyebrow">Summary</div>
          <h3 className="font-display text-xl font-light tracking-tight mt-2">
            Ready to render
          </h3>
        </div>
        <div className="px-8 pb-2 space-y-3 text-sm">
          <Row label="Ratio" value={`${ratio.id} · ${ratio.resolution}`} />
          <Row label="Scenes" value={`${state.scenes.length}`} />
          <Row
            label="Duration"
            value={`${totalDuration.toFixed(1)}s`}
            mono
          />
          <Row label="Preset" value={selectedPreset.label} />
          <Row label="Format" value="MP4 · H.264" />
        </div>

        <div className="px-8 pb-8 mt-auto pt-6">
          {(rendering || done) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-zinc-400 font-mono-soft tabular-nums">
                  {done ? "Complete" : "Rendering"}
                </span>
                <span className="text-[12px] text-zinc-300 font-mono-soft tabular-nums">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-200",
                    done ? "bg-emerald-400/80" : "bg-white",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!done ? (
            <AppButton
              onClick={startRender}
              disabled={rendering}
              size="lg"
              className="w-full"
              data-testid="export-render-button"
              iconLeft={
                rendering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )
              }
            >
              {rendering ? "Rendering preview…" : "Render & Export MP4"}
            </AppButton>
          ) : (
            <AppButton
              variant="primary"
              size="lg"
              className="w-full"
              data-testid="export-download-button"
              iconLeft={<Download className="h-4 w-4" />}
            >
              Download MP4
            </AppButton>
          )}

          <p className="text-[11px] text-zinc-600 mt-3 text-center">
            Rendering is mocked in Phase 1 · backend wires up next
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
    <span className="text-zinc-500 text-[12px] uppercase tracking-[0.18em]">
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
