import React from "react";
import StepLayout from "@/components/broll/StepLayout";
import ExportPanel from "@/components/broll/ExportPanel";

export default function Export() {
  return (
    <StepLayout
      stepId={6}
      eyebrow="Step 06 · Export"
      title="Render your B-roll."
      description="Review the final summary and choose a render preset. Phase 1 simulates the render pipeline — the next phase will wire Remotion.dev to produce the actual MP4."
      primaryAction={{
        label: "Done — Start a new project",
        allowFinal: true,
      }}
    >
      <ExportPanel />
    </StepLayout>
  );
}
