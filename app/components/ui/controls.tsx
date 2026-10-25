// Reusable, accessible form controls used across the converter.
// All of them are built on native inputs, so keyboard and screen readers work out of the box.

import { useId, type ComponentProps, type ReactNode } from "react";
import Icon from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  const variants: Record<Variant, string> = {
    primary: "bg-brand text-white shadow-lg shadow-accent/20 hover:brightness-110 hover:shadow-accent/30",
    secondary: "border border-line bg-raised text-fg hover:border-line-strong hover:bg-[#1c2130]",
    ghost: "text-muted hover:bg-white/5 hover:text-fg",
    danger: "text-muted hover:bg-rose-500/10 hover:text-rose-300",
  };
  const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-[15px]",
  };
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${focusRing} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Real progress when `value` is a number; a moving stripe when it can't be measured.
export function ProgressBar({ value, label, className = "" }: { value?: number; label: string; className?: string }) {
  const measurable = typeof value === "number";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={measurable ? 0 : undefined}
      aria-valuemax={measurable ? 100 : undefined}
      aria-valuenow={measurable ? value : undefined}
      className={`relative h-1.5 overflow-hidden rounded-full bg-white/[0.07] ${className}`}
    >
      {measurable ? (
        <div className="bg-brand h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(value, 2)}%` }} />
      ) : (
        <div className="bg-brand animate-indeterminate absolute inset-y-0 w-2/5 rounded-full" />
      )}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    neutral: "border-line bg-raised text-muted",
    accent: "border-accent/40 bg-accent/15 text-accent-soft",
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Inline message box for errors, warnings and notes.
export function Callout({ tone, children, role }: { tone: "info" | "warning" | "danger"; children: ReactNode; role?: "alert" | "status" }) {
  const tones = {
    info: { box: "border-line bg-raised/70 text-muted", icon: "info" as const, iconColor: "text-accent-soft" },
    warning: { box: "border-amber-400/20 bg-amber-400/[0.07] text-amber-100/90", icon: "alert" as const, iconColor: "text-amber-300" },
    danger: { box: "border-rose-400/25 bg-rose-500/[0.08] text-rose-200", icon: "alert" as const, iconColor: "text-rose-300" },
  }[tone];
  return (
    <div role={role} className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${tones.box}`}>
      <Icon name={tones.icon} className={`mt-0.5 h-4 w-4 shrink-0 ${tones.iconColor}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Small "i" button that reveals a tooltip on hover or keyboard focus.
export function InfoTip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label="More information"
        aria-describedby={id}
        className={`rounded-full text-muted/70 transition hover:text-fg ${focusRing}`}
      >
        <Icon name="info" className="h-4 w-4" />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-line bg-[#1d2230] px-3 py-2 text-xs leading-relaxed font-normal text-fg opacity-0 shadow-xl shadow-black/40 transition group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

// On/off switch built on a checkbox (role="switch"). Space toggles it.
export function Switch({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition ${disabled ? "opacity-50" : "cursor-pointer hover:bg-white/[0.03]"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-[#2a3142] transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
      />
    </label>
  );
}

export interface Choice {
  value: string;
  label: string;
  sub?: string;
  disabled?: boolean;
}

// A group of radio "chips" or "cards". Arrow keys move between options.
export function ChoiceGroup({
  legend,
  name,
  value,
  options,
  onChange,
  columns = "grid-cols-3",
  tip,
}: {
  legend: string;
  name: string;
  value: string;
  options: Choice[];
  onChange: (value: string) => void;
  columns?: string;
  tip?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg">
        {legend}
        {tip && <InfoTip text={tip} />}
      </legend>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((o) => (
          <label key={o.value} className={o.disabled ? "cursor-not-allowed" : "cursor-pointer"}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="flex h-full flex-col justify-center rounded-xl border border-line bg-raised px-3 py-2.5 transition peer-checked:border-accent/70 peer-checked:bg-accent/[0.14] peer-checked:shadow-[0_0_0_1px_rgb(124_58_237_/_0.35)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface peer-disabled:opacity-40 hover:border-line-strong">
              <span className="text-sm font-semibold text-fg">{o.label}</span>
              {o.sub && <span className="mt-0.5 text-xs text-muted">{o.sub}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
