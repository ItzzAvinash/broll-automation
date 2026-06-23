import React from "react";
import StepLayout from "@/components/broll/StepLayout";
import GlassCard from "@/components/broll/GlassCard";
import ColorPickerInput from "@/components/broll/ColorPickerInput";
import FontSelector from "@/components/broll/FontSelector";
import {
  BRAND_LETTER_SPACING,
  counterpartFontId,
  getFontById,
} from "@/constants/mockData";
import { useProject } from "@/context/ProjectContext";
import { RotateCcw } from "lucide-react";

export default function BrandDeck() {
  const { state, updateBrand, resetBrand } = useProject();
  const brand = state.brand;

  const mainFont = getFontById(brand.mainFont);
  const keywordFontId = counterpartFontId(brand.mainFont);
  const keywordFont = getFontById(keywordFontId);

  const mainStyle = {
    fontFamily: mainFont.stack,
    fontStyle: mainFont.style?.fontStyle || "italic",
    letterSpacing: BRAND_LETTER_SPACING,
  };
  const keywordStyle = {
    fontFamily: keywordFont.stack,
    fontStyle: keywordFont.style?.fontStyle || "italic",
    letterSpacing: BRAND_LETTER_SPACING,
  };

  return (
    <StepLayout
      stepId={2}
      eyebrow="Step 02 · Identity"
      title="Customize your brand deck."
      description="Pick the three colors that drive your video — background, text and highlighted keywords — then choose a main font. The keyword font is automatically set to the other option."
      secondaryAction={{
        label: "Reset to defaults",
        onClick: resetBrand,
        testId: "brand-reset-button",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — controls */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard>
            <div className="mb-6">
              <div className="text-eyebrow">Brand</div>
              <h3
                className="font-display text-lg font-light tracking-tight mt-1"
                style={{ letterSpacing: "-0.02em" }}
              >
                Project name & logo mark
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[12px] uppercase tracking-[0.18em] text-zinc-500">
                  Brand name
                </label>
                <input
                  type="text"
                  value={brand.brandName}
                  onChange={(e) => updateBrand({ brandName: e.target.value })}
                  data-testid="brand-name-input"
                  className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition"
                  placeholder="Northwind Studio"
                />
              </div>
              <div>
                <label className="text-[12px] uppercase tracking-[0.18em] text-zinc-500">
                  Logo mark
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={brand.logoText}
                  onChange={(e) =>
                    updateBrand({ logoText: e.target.value.toUpperCase() })
                  }
                  data-testid="brand-logo-input"
                  className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition uppercase"
                  placeholder="NW"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-6">
              <div className="text-eyebrow">Palette</div>
              <h3
                className="font-display text-lg font-light tracking-tight mt-1"
                style={{ letterSpacing: "-0.02em" }}
              >
                Three colors. That&apos;s it.
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <ColorPickerInput
                label="Primary"
                value={brand.primary}
                onChange={(v) => updateBrand({ primary: v })}
                description="Video background"
                testId="color-primary"
              />
              <ColorPickerInput
                label="Secondary"
                value={brand.secondary}
                onChange={(v) => updateBrand({ secondary: v })}
                description="Main text color"
                testId="color-secondary"
              />
              <ColorPickerInput
                label="Highlight"
                value={brand.highlight}
                onChange={(v) => updateBrand({ highlight: v })}
                description="Keywords · accents"
                testId="color-highlight"
              />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <div className="text-eyebrow">Typography</div>
                <h3
                  className="font-display text-lg font-light tracking-tight mt-1"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Choose your main font
                </h3>
                <p className="text-[12px] text-zinc-500 mt-2 max-w-md leading-relaxed">
                  Keyword font is set automatically as the counterpart. Letter
                  spacing is locked at{" "}
                  <span className="font-mono-soft text-zinc-300">−2px</span>.
                </p>
              </div>
            </div>
            <FontSelector
              value={brand.mainFont}
              onChange={(v) => updateBrand({ mainFont: v })}
              testId="main-font-selector"
            />

            {/* Derived keyword font readout */}
            <div
              className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3"
              data-testid="keyword-font-readout"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Keyword font
                </span>
                <span className="font-mono-soft text-[11px] text-zinc-600">
                  auto
                </span>
              </div>
              <span
                className="text-[15px] text-zinc-100"
                style={keywordStyle}
                data-testid="keyword-font-name"
              >
                {keywordFont.label}
              </span>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT — live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <GlassCard padded={false} className="overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                <div className="text-eyebrow">Live preview</div>
                <span className="font-mono-soft text-[10px] text-zinc-600">
                  letter-spacing −2px
                </span>
              </div>

              <div
                className="relative aspect-[4/5] flex flex-col justify-between p-7"
                style={{ backgroundColor: brand.primary }}
                data-testid="brand-preview"
              >
                {/* subtle brand-color ambient glow */}
                <div
                  className="absolute inset-0 opacity-50 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 18% 8%, ${brand.highlight}26, transparent 55%), radial-gradient(circle at 82% 92%, ${brand.secondary}10, transparent 55%)`,
                  }}
                />

                {/* Top: brand chip */}
                <div className="relative flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[14px] font-semibold"
                    style={{
                      backgroundColor: brand.secondary,
                      color: brand.primary,
                      ...mainStyle,
                    }}
                  >
                    {brand.logoText}
                  </div>
                  <div
                    className="text-[13px]"
                    style={{ color: brand.secondary, ...mainStyle }}
                  >
                    {brand.brandName}
                  </div>
                </div>

                {/* Bottom: caption demonstrating main font + highlight + keyword font */}
                <div className="relative">
                  <div
                    className="text-[10px] uppercase tracking-[0.22em] mb-3"
                    style={{
                      color: brand.highlight,
                      fontFamily: keywordFont.stack,
                      fontStyle: keywordFont.style?.fontStyle || "italic",
                      letterSpacing: BRAND_LETTER_SPACING,
                    }}
                    data-testid="brand-preview-eyebrow"
                  >
                    Scene 01
                  </div>
                  <div
                    className="text-[28px] sm:text-[30px] font-light leading-[1.05]"
                    style={{ color: brand.secondary, ...mainStyle }}
                    data-testid="brand-preview-headline"
                  >
                    <span style={keywordStyle}>
                      <span style={{ color: brand.highlight }}>Attention</span>
                    </span>{" "}
                    is the new{" "}
                    <span style={keywordStyle}>
                      <span style={{ color: brand.highlight }}>currency</span>
                    </span>
                    .
                  </div>
                  <div
                    className="text-[13px] mt-4 leading-relaxed opacity-80 max-w-[90%]"
                    style={{ color: brand.secondary, ...mainStyle }}
                    data-testid="brand-preview-body"
                  >
                    Great brands don&apos;t{" "}
                    <span style={keywordStyle}>
                      <span style={{ color: brand.highlight }}>shout</span>
                    </span>{" "}
                    — they show, with{" "}
                    <span style={keywordStyle}>
                      <span style={{ color: brand.highlight }}>motion</span>
                    </span>
                    ,{" "}
                    <span style={keywordStyle}>
                      <span style={{ color: brand.highlight }}>light</span>
                    </span>{" "}
                    and rhythm.
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between bg-white/[0.015]">
                <div
                  className="flex items-center gap-1.5"
                  data-testid="brand-swatches"
                >
                  {[brand.primary, brand.secondary, brand.highlight].map(
                    (c, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border border-white/15"
                        style={{ backgroundColor: c }}
                      />
                    ),
                  )}
                  <span className="text-[10px] text-zinc-500 ml-2 uppercase tracking-[0.18em]">
                    primary · secondary · highlight
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetBrand}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition"
                  data-testid="brand-quick-reset"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
