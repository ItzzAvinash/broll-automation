import React from "react";
import StepLayout from "@/components/broll/StepLayout";
import ExportPanel from "@/components/broll/ExportPanel";

export default function Export() {
  return (
    <StepLayout
      stepId={6}
      eyebrow="Step 06 · Export"
      title="Export your B-roll."
      description="Review the final cut, then render and download an MP4 — rendered right in your browser with your exact ratio, brand styling, scene order and keyword highlights."
      primaryAction={{
        label: "Done — Start a new project",
        allowFinal: true,
      }}
    >
      <ExportPanel />
    </StepLayout>
  );
}
