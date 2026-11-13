import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

interface FieldShellProps { label: ReactNode; hint?: ReactNode; error?: string }

type InputFieldProps = FieldShellProps & InputHTMLAttributes<HTMLInputElement>;

export function InputField({ label, hint, error, className, ...rest }: InputFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-e` : undefined} {...rest} />
      {hint && <span className="tiny muted" style={{ fontWeight: 400 }}>{hint}</span>}
      {error && <span id={`${id}-e`} className="field-error">{error}</span>}
    </div>
  );
}

type TextAreaFieldProps = FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, hint, error, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="textarea" aria-invalid={!!error || undefined} {...rest} />
      {hint && <span className="tiny muted" style={{ fontWeight: 400 }}>{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

/** Single-select group rendered as pressable buttons (roles, categories, payment methods). */
export function ChoiceGroup<T extends string>({ legend, options, value, onChange, variant = "choice", columns = 2 }: {
  legend?: string;
  options: readonly (T | { value: T; label: string })[];
  value: T;
  onChange: (v: T) => void;
  variant?: "choice" | "chip" | "gw";
  columns?: 2 | 0;
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const cls = variant === "chip" ? "chip" : variant === "gw" ? "choice gw" : "choice";
  return (
    <div role="group" aria-label={legend} className="stack" style={{ gap: 6 }}>
      {legend && variant !== "gw" && <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{legend}</span>}
      <div className={variant === "chip" || columns === 0 ? "row" : "grid-2"} style={variant === "chip" ? { flexWrap: "wrap", gap: 6 } : undefined}>
        {items.map((o) => (
          <button key={o.value} type="button" className={cls} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
