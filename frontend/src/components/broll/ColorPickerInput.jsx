import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

const normalizeHex = (raw) => {
  if (!raw) return null;
  let v = raw.trim();
  if (!v.startsWith("#")) v = "#" + v;
  return HEX_RE.test(v) ? v.toUpperCase() : null;
};

/**
 * ColorPickerInput — premium swatch + native color picker + HEX text input
 */
export const ColorPickerInput = ({
  label,
  value,
  onChange,
  description,
  testId,
}) => {
  const inputRef = useRef(null);
  const [hex, setHex] = useState(value);

  useEffect(() => {
    setHex(value);
  }, [value]);

  const handleHexChange = (e) => {
    const raw = e.target.value;
    setHex(raw.startsWith("#") ? raw : raw ? "#" + raw : "");
    const norm = normalizeHex(raw);
    if (norm) onChange(norm);
  };

  const handleHexBlur = () => {
    const norm = normalizeHex(hex);
    setHex(norm || value);
  };

  const openPicker = () => inputRef.current?.click();
  const safeId = testId || `color-picker-${(label || "").toLowerCase()}`;

  return (
    <div className="flex flex-col gap-3" data-testid={`${safeId}-group`}>
      <div className="flex items-baseline justify-between">
        <div>
          <div
            className="font-display text-[13px] font-medium text-zinc-200"
            style={{ letterSpacing: "-0.01em" }}
          >
            {label}
          </div>
          {description && (
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-stretch">
        {/* Swatch */}
        <button
          type="button"
          onClick={openPicker}
          data-testid={safeId}
          className={cn(
            "group relative h-12 w-16 rounded-xl border border-white/10 overflow-hidden shrink-0",
            "hover:border-white/30 transition-all duration-300",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
          )}
          aria-label={`Open color picker for ${label}`}
        >
          <div
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ backgroundColor: value }}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            aria-hidden="true"
            data-testid={`${safeId}-native`}
          />
        </button>

        {/* HEX input */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            spellCheck={false}
            value={hex || ""}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            placeholder="#000000"
            maxLength={7}
            data-testid={`${safeId}-hex`}
            className={cn(
              "w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-3",
              "text-zinc-100 uppercase font-mono-soft text-[13px] tabular-nums tracking-wider",
              "focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition",
              "placeholder:text-zinc-600",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPickerInput;
