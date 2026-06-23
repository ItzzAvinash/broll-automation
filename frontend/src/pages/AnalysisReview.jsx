import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  RefreshCw,
  Save,
  CheckCircle2,
  Layers,
} from "lucide-react";
import StepLayout from "@/components/broll/StepLayout";
import GlassCard from "@/components/broll/GlassCard";
import { AppButton } from "@/components/broll/AppButton";
import SceneEditCard from "@/components/broll/SceneEditCard";
import PlanPreviewPanel from "@/components/broll/PlanPreviewPanel";
import { useProject } from "@/context/ProjectContext";
import { regenerateScene as regenerateSceneApi, regenerateFullPlan } from "@/lib/api";

const EmptyState = () => (
  <GlassCard className="text-center" data-testid="analysis-empty-state">
    <div className="mx-auto h-12 w-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-5">
      <Sparkles className="h-5 w-5 text-zinc-400" />
    </div>
    <h3 className="font-display text-2xl font-light tracking-tight">
      No plan yet
    </h3>
    <p className="mt-2 text-[13px] text-zinc-500 max-w-md mx-auto">
      Head back to the Script step and click{" "}
      <span className="text-zinc-300">Generate B-roll Plan</span> to have our AI
      break your script into scenes.
    </p>
    <div className="mt-6 flex justify-center">
      <Link to="/script">
        <AppButton
          variant="primary"
          size="md"
          iconRight={<ArrowRight className="h-4 w-4" />}
          data-testid="analysis-back-to-script-button"
        >
          Go to Script
        </AppButton>
      </Link>
    </div>
  </GlassCard>
);

const SaveIndicator = ({ saving, lastSavedAt }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  if (saving) {
    return (
      <span
        className="flex items-center gap-1.5 text-[11px] text-zinc-400"
        data-testid="autosave-indicator-saving"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (!lastSavedAt) return null;
  const secondsAgo = Math.max(0, Math.floor((Date.now() - new Date(lastSavedAt).getTime()) / 1000));
  const label =
    secondsAgo < 5
      ? "Saved"
      : secondsAgo < 60
        ? `Saved ${secondsAgo}s ago`
        : `Saved ${Math.floor(secondsAgo / 60)}m ago`;
  return (
    <span
      className="flex items-center gap-1.5 text-[11px] text-zinc-500"
      data-testid="autosave-indicator-saved"
    >
      <CheckCircle2 className="h-3 w-3 text-emerald-400/80" />
      {label}
    </span>
  );
};

export default function AnalysisReview() {
  const navigate = useNavigate();
  const {
    state,
    updatePlan,
    updateScene,
    reorderScene,
    replaceScene,
    setPlan,
  } = useProject();
  const plan = state.plan;
  const scenes = useMemo(() => plan?.scenes || [], [plan]);

  const [activeOrder, setActiveOrder] = useState(scenes[0]?.order ?? 1);
  const [regeneratingOrder, setRegeneratingOrder] = useState(null);
  const [regeneratingFull, setRegeneratingFull] = useState(false);

  useEffect(() => {
    if (scenes.length && !scenes.find((s) => s.order === activeOrder)) {
      setActiveOrder(scenes[0].order);
    }
  }, [scenes, activeOrder]);

  if (!plan) {
    return (
      <StepLayout
        stepId={4}
        eyebrow="Step 04 · AI Analysis"
        title="AI plan goes here."
        description="Once you generate a B-roll plan from your script, scenes will appear here as editable cards."
      >
        <EmptyState />
      </StepLayout>
    );
  }

  const activeScene = scenes.find((s) => s.order === activeOrder) || scenes[0];

  const handleRegenerateScene = async (order) => {
    if (!state.projectId) {
      toast.error("Project ID missing — regenerate the full plan first.");
      return;
    }
    setRegeneratingOrder(order);
    try {
      // Send the current scene script text so regen uses the user's edits
      const target = scenes.find((s) => s.order === order);
      const record = await regenerateSceneApi(
        state.projectId,
        order,
        target?.scriptText,
      );
      const newScene = record?.plan?.scenes?.find((s) => s.order === order);
      if (newScene) {
        replaceScene(order, newScene);
        toast.success(`Scene ${order} regenerated`);
      } else {
        throw new Error("regenerated scene not returned");
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Regenerate failed";
      toast.error(`Couldn't regenerate scene ${order}: ${msg}`);
    } finally {
      setRegeneratingOrder(null);
    }
  };

  const handleRegenerateFull = async () => {
    if (!state.projectId) {
      toast.error("Project ID missing.");
      return;
    }
    setRegeneratingFull(true);
    try {
      const record = await regenerateFullPlan(state.projectId);
      setPlan(record);
      toast.success(`Full plan regenerated · ${record?.plan?.scenes?.length || 0} scenes`);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Regenerate failed";
      toast.error(`Couldn't regenerate plan: ${msg}`);
    } finally {
      setRegeneratingFull(false);
    }
  };

  const totalKeywords = scenes.reduce(
    (acc, s) => acc + (s.highlightedKeywords?.length || 0),
    0,
  );
  const totalBroll = scenes.reduce(
    (acc, s) => acc + (s.brollSuggestions?.length || 0),
    0,
  );

  return (
    <StepLayout
      stepId={4}
      eyebrow="Step 04 · AI Analysis · Editor"
      title={
        <input
          type="text"
          value={plan.projectTitle || ""}
          onChange={(e) => updatePlan({ projectTitle: e.target.value })}
          data-testid="plan-title-input"
          className="bg-transparent border-none outline-none w-full font-display text-4xl sm:text-5xl font-light tracking-tight text-white placeholder:text-zinc-700 focus:bg-white/[0.03] focus:rounded-lg px-2 -mx-2 transition"
          placeholder="Untitled project"
        />
      }
      description={`${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${totalKeywords} keywords · ${totalBroll} B-roll ideas. Click any field to edit — changes auto-save.`}
      secondaryAction={{
        label: regeneratingFull ? "Regenerating…" : "Regenerate Full Plan",
        onClick: handleRegenerateFull,
        testId: "regenerate-full-plan-button",
      }}
    >
      {/* Top toolbar */}
      <div
        className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-2.5"
        data-testid="analysis-toolbar"
      >
        <div className="flex items-center gap-3">
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Project plan
          </span>
          <span className="text-[10px] font-mono-soft text-zinc-600">
            id · {state.projectId || "—"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator
            saving={state.savingPlan}
            lastSavedAt={state.lastSavedAt}
          />
          <button
            type="button"
            disabled={regeneratingFull}
            onClick={handleRegenerateFull}
            data-testid="regenerate-full-plan-toolbar"
            className="text-[12px] text-zinc-300 hover:text-white flex items-center gap-1.5 disabled:opacity-60 transition"
          >
            {regeneratingFull ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate full plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT — Scene editor list */}
        <div className="xl:col-span-3 space-y-3" data-testid="scenes-list">
          {scenes.map((s, idx) => (
            <SceneEditCard
              key={s.order}
              scene={s}
              isFirst={idx === 0}
              isLast={idx === scenes.length - 1}
              isActive={s.order === activeOrder}
              isRegenerating={regeneratingOrder === s.order}
              onSelect={() => setActiveOrder(s.order)}
              onChange={(patch) => updateScene(s.order, patch)}
              onReorder={(dir) => reorderScene(s.order, dir)}
              onRegenerate={() => handleRegenerateScene(s.order)}
            />
          ))}
        </div>

        {/* RIGHT — Preview panel + at-a-glance summary */}
        <div className="xl:col-span-2 space-y-5">
          <div className="xl:sticky xl:top-24 space-y-5">
            <PlanPreviewPanel scene={activeScene} />

            <GlassCard padded={false} data-testid="scene-summary-panel">
              <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <div className="text-eyebrow">Summary</div>
                <span className="font-mono-soft text-[11px] text-zinc-500">
                  S{String(activeScene?.order).padStart(2, "0")}
                </span>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <SummaryRow
                  label="Motion"
                  value={activeScene?.motionStyle || "—"}
                />
                <SummaryRow
                  label="Duration"
                  value={`${Number(activeScene?.duration || 0).toFixed(1)}s`}
                  mono
                />
                <SummaryRow
                  label="Keywords"
                  value={`${activeScene?.highlightedKeywords?.length || 0}`}
                  mono
                />
                <SummaryRow
                  label="B-roll ideas"
                  value={`${activeScene?.brollSuggestions?.length || 0}`}
                  mono
                />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}

const SummaryRow = ({ label, value, mono }) => (
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
