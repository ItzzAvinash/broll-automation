import React from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "@/components/broll/StepLayout";
import RatioCard from "@/components/broll/RatioCard";
import { RATIOS } from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";
import { STEPS } from "@/constants/steps";

export default function RatioSelection() {
  const { state, update, markStepDone } = useProject();
  const navigate = useNavigate();

  // Auto-advance to Brand Deck shortly after a ratio is picked
  const handleSelect = (id) => {
    update({ ratio: id });
    markStepDone(1);
    const nextStep = STEPS.find((s) => s.id === 2);
    if (nextStep) {
      setTimeout(() => navigate(nextStep.path), 380);
    }
  };

  return (
    <StepLayout
      stepId={1}
      eyebrow="Step 01 · Format"
      title="Choose where this B-roll will live."
      description="Pick the platform-correct canvas. We'll lay out every scene, caption, and frame for this aspect ratio."
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl"
        data-testid="ratio-grid"
      >
        {RATIOS.map((r) => (
          <RatioCard
            key={r.id}
            ratio={r}
            selected={state.ratio === r.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <p className="mt-8 text-[12px] text-zinc-500 max-w-md">
        You&apos;ll move to Brand Deck Customization automatically after selection.
      </p>
    </StepLayout>
  );
}
