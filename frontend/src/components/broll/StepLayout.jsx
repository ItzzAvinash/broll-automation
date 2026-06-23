import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { STEPS } from "@/constants/steps";
import { useProject } from "@/context/ProjectContext";
import { AppButton } from "@/components/broll/AppButton";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { state } = useProject();
  return (
    <aside
      data-testid="step-sidebar"
      className="hidden lg:flex w-72 shrink-0 h-screen fixed left-0 top-0 flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-2xl z-20"
    >
      <div className="px-7 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl glass-panel-soft flex items-center justify-center">
            <span className="font-display text-base font-semibold tracking-tight">
              R
            </span>
          </div>
          <div>
            <div className="font-display text-[15px] font-medium tracking-tight">
              Roll Studio
            </div>
            <div className="text-eyebrow mt-0.5">Internal · v0.1</div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="dotted-divider opacity-60" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const done = state.completedSteps?.[step.id];
          return (
            <NavLink
              key={step.id}
              to={step.path}
              data-testid={`nav-step-${step.slug}`}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-white/[0.06] border border-white/[0.08]"
                    : "hover:bg-white/[0.03] border border-transparent",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                      isActive
                        ? "bg-white text-black border-white"
                        : done
                          ? "bg-white/10 text-white border-white/15"
                          : "bg-transparent text-zinc-500 border-white/10",
                    )}
                  >
                    {done && !isActive ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-[13px] font-medium font-display tracking-tight",
                        isActive ? "text-white" : "text-zinc-300",
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {step.subtitle}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono-soft text-zinc-600">
                    0{step.id}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 pb-6 pt-3">
        <div className="dotted-divider opacity-60 mb-5" />
        <div className="text-eyebrow mb-2">Project</div>
        <div className="font-display text-sm text-zinc-200 truncate">
          {state.brand?.brandName || "Untitled Project"}
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          Ratio · {state.ratio}
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ stepIndex }) => {
  const total = STEPS.length;
  const progress = ((stepIndex + 1) / total) * 100;
  const current = STEPS[stepIndex];
  return (
    <div
      data-testid="step-topbar"
      className="sticky top-0 z-10 -mx-10 lg:-mx-16 px-10 lg:px-16 py-5 bg-black/40 backdrop-blur-2xl border-b border-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-6">
        <div>
          <div className="text-eyebrow">
            Step {String(current.id).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <div className="font-display text-2xl font-light tracking-tight mt-1 text-white">
            {current.title}
            <span className="text-zinc-500"> · {current.subtitle}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 min-w-[200px]">
          <div className="h-[3px] flex-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono-soft text-zinc-500 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const StepLayout = ({
  children,
  stepId,
  title,
  eyebrow,
  description,
  primaryAction,
  secondaryAction,
  hidePager = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { markStepDone } = useProject();

  const stepIndex = STEPS.findIndex((s) => s.path === location.pathname);
  const safeIndex = stepIndex === -1 ? 0 : stepIndex;
  const prev = STEPS[safeIndex - 1];
  const next = STEPS[safeIndex + 1];

  const handleNext = () => {
    markStepDone(stepId);
    if (primaryAction?.onClick) primaryAction.onClick();
    if (next) navigate(next.path);
  };
  const handlePrev = () => {
    if (prev) navigate(prev.path);
  };

  return (
    <div className="app-bg min-h-screen text-white">
      <Sidebar />
      <main className="lg:ml-72 relative z-[1] min-h-screen">
        <div className="px-6 sm:px-10 lg:px-16 pb-32 pt-2">
          <TopBar stepIndex={safeIndex} />

          <div className="mt-12 max-w-6xl rise">
            {eyebrow && (
              <div className="text-eyebrow mb-4" data-testid="page-eyebrow">
                {eyebrow}
              </div>
            )}
            {title && (
              <h1
                className="font-display text-4xl sm:text-5xl font-light tracking-tight text-white"
                data-testid="page-title"
              >
                {title}
              </h1>
            )}
            {description && (
              <p
                className="mt-4 text-base text-zinc-400 leading-relaxed max-w-2xl"
                data-testid="page-description"
              >
                {description}
              </p>
            )}

            <div className="mt-12">{children}</div>

            {!hidePager && (
              <div
                data-testid="step-pager"
                className="mt-16 flex items-center justify-between gap-4"
              >
                <AppButton
                  variant="ghost"
                  size="md"
                  onClick={handlePrev}
                  disabled={!prev}
                  data-testid="step-prev-button"
                  iconLeft={<ChevronLeft className="h-4 w-4" />}
                >
                  {prev ? prev.title : "Back"}
                </AppButton>

                <div className="flex items-center gap-3">
                  {secondaryAction && (
                    <AppButton
                      variant="secondary"
                      size="md"
                      onClick={secondaryAction.onClick}
                      data-testid={secondaryAction.testId || "step-secondary-button"}
                    >
                      {secondaryAction.label}
                    </AppButton>
                  )}
                  <AppButton
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    disabled={!next && !primaryAction?.allowFinal}
                    data-testid="step-next-button"
                    iconRight={<ChevronRight className="h-4 w-4" />}
                  >
                    {primaryAction?.label ||
                      (next ? `Continue to ${next.title}` : "Finish")}
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StepLayout;
