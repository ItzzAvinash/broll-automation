import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, ClipboardPaste, Loader2 } from "lucide-react";
import StepLayout from "@/components/broll/StepLayout";
import GlassCard from "@/components/broll/GlassCard";
import { AppButton } from "@/components/broll/AppButton";
import { useProject } from "@/context/ProjectContext";
import { SAMPLE_SCRIPT } from "@/constants/mockData";
import { analyzeScript } from "@/lib/api";

export default function ScriptInput() {
  const navigate = useNavigate();
  const {
    state,
    update,
    setPlan,
    setAnalyzing,
    setAnalyzeError,
    markStepDone,
  } = useProject();

  const words = state.script.trim().split(/\s+/).filter(Boolean).length;
  const chars = state.script.length;
  const estDuration = Math.max(8, Math.round((words / 150) * 60));

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) update({ script: text });
    } catch (e) {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!state.script.trim()) {
      toast.error("Paste a script first.");
      return;
    }
    setAnalyzing(true);
    try {
      const record = await analyzeScript({
        script: state.script,
        brand: state.brand,
        ratio: state.ratio,
      });
      setPlan(record);
      markStepDone(3);
      toast.success(`Plan generated · ${record?.plan?.scenes?.length || 0} scenes`);
      navigate("/analysis");
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Analysis failed";
      setAnalyzeError(msg);
      toast.error(`B-roll generation failed: ${msg}`);
    }
  };

  return (
    <StepLayout
      stepId={3}
      eyebrow="Step 03 · Script"
      title="Paste the script your B-roll will breathe with."
      description="Drop your narration, voice-over, or storyboard text. Click Generate B-roll Plan and our AI breaks it into scenes, detects keywords, and suggests B-roll assets."
      secondaryAction={{
        label: "Use sample script",
        onClick: () => update({ script: SAMPLE_SCRIPT }),
        testId: "script-sample-button",
      }}
      primaryAction={{
        label: state.analyzing
          ? "Generating B-roll Plan…"
          : "Generate B-roll Plan",
        onClick: handleGenerate,
        // bypass the default Next navigation
        allowFinal: true,
      }}
      hidePager
    >
      <GlassCard padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-eyebrow">Script editor</div>
            <span className="text-[10px] font-mono-soft text-zinc-600">·</span>
            <span className="text-[10px] font-mono-soft text-zinc-500">
              draft · auto-saved
            </span>
          </div>
          <button
            type="button"
            onClick={handlePaste}
            data-testid="script-paste-button"
            className="text-[12px] text-zinc-400 hover:text-zinc-100 transition flex items-center gap-1.5"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Paste from clipboard
          </button>
        </div>

        <textarea
          value={state.script}
          onChange={(e) => update({ script: e.target.value })}
          placeholder="Begin typing or paste your script here. Aim for clear, sentence-level beats — our AI will split them into scenes."
          data-testid="script-textarea"
          disabled={state.analyzing}
          className="w-full min-h-[420px] bg-transparent text-zinc-100 px-8 py-7 text-[16px] leading-[1.75] resize-none focus:outline-none placeholder:text-zinc-600 disabled:opacity-60"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        />

        <div className="border-t border-white/[0.05] px-6 py-3 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-5 text-[11px] text-zinc-500 font-mono-soft">
            <span data-testid="script-word-count">
              <span className="text-zinc-300">{words}</span> words
            </span>
            <span>·</span>
            <span data-testid="script-char-count">
              <span className="text-zinc-300">{chars}</span> chars
            </span>
            <span>·</span>
            <span data-testid="script-duration-estimate">
              est. <span className="text-zinc-300">{estDuration}s</span>
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Markdown not required
          </div>
        </div>
      </GlassCard>

      {state.analyzeError && (
        <div
          data-testid="script-error"
          className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-3.5 text-[13px] text-red-200"
        >
          <span className="font-medium">Couldn&apos;t generate the plan:</span>{" "}
          {state.analyzeError}
        </div>
      )}

      {/* Custom pager — replaces the default StepLayout pager since we
          intercept the Next action with a long-running LLM call */}
      <div className="mt-12 flex items-center justify-between gap-4">
        <AppButton
          variant="ghost"
          size="md"
          onClick={() => navigate("/brand")}
          data-testid="step-prev-button"
        >
          ← Brand Deck
        </AppButton>

        <div className="flex items-center gap-3">
          <AppButton
            variant="secondary"
            size="md"
            onClick={() => update({ script: SAMPLE_SCRIPT })}
            data-testid="script-sample-button-inline"
          >
            Use sample script
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={state.analyzing || !state.script.trim()}
            data-testid="generate-broll-plan-button"
            iconLeft={
              state.analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )
            }
          >
            {state.analyzing ? "Generating B-roll Plan…" : "Generate B-roll Plan"}
          </AppButton>
        </div>
      </div>
    </StepLayout>
  );
}
