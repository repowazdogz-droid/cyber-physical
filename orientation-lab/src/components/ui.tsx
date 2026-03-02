import type React from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid rgba(0,0,0,0.12)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: "14px",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "#111",
      color: "#fff",
      border: "1px solid #111",
    },
    ghost: {
      background: "#fff",
      color: "#111",
    },
    danger: {
      background: "#fff",
      color: "#b00020",
      border: "1px solid rgba(176,0,32,0.35)",
    },
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...styles[variant] }}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
      }}
    >
      {(title || subtitle || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>}
            {subtitle && (
              <div style={{ marginTop: 4, color: "rgba(0,0,0,0.65)", fontSize: 13 }}>
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>
      )}
      <div style={{ marginTop: title || subtitle || right ? 12 : 0 }}>{children}</div>
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />;
}

export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "note" | "attention" }) {
  const map: Record<string, React.CSSProperties> = {
    neutral: { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.80)" },
    note: { background: "rgba(0,120,255,0.10)", color: "rgba(0,80,180,0.92)" },
    attention: { background: "rgba(255,160,0,0.14)", color: "rgba(120,70,0,0.95)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 650,
        ...map[tone],
      }}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 750, marginBottom: 6 }}>{label}</div>
      {hint && (
        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.62)", marginBottom: 8 }}>
          {hint}
        </div>
      )}
      {children}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  ...props
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "placeholder">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <input
      {...props}
      value={value}
      placeholder={placeholder}
      onChange={onChange ? handleChange : undefined}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "10px 12px",
        fontSize: 13,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  ...props
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "placeholder" | "rows">) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <textarea
      {...props}
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={onChange ? handleChange : undefined}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "10px 12px",
        fontSize: 13,
        outline: "none",
        resize: "vertical",
        ...props.style,
      }}
    />
  );
}

export function Select({
  value,
  onChange,
  children,
  ...props
}: {
  value: string;
  onChange?: (v: string) => void;
  children: React.ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <select
      {...props}
      value={value}
      onChange={onChange ? handleChange : undefined}
      style={{
        width: "100%",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "10px 12px",
        fontSize: 13,
        outline: "none",
        background: "#fff",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: "rgba(0,0,0,0.62)", fontStyle: "italic", padding: "6px 0" }}>
      {children}
    </div>
  );
}

export function Small({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.65)", marginTop: 8, lineHeight: 1.4 }}>
      {children}
    </div>
  );
}

export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      style={{
        position: "absolute",
        left: -9999,
        top: 8,
        background: "#111",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 10,
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.left = "8px";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.left = "-9999px";
      }}
    >
      Skip to content
    </a>
  );
}
