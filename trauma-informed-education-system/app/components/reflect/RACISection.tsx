"use client";

type RACI = {
  responsible?: string;
  accountable?: string;
  consulted?: string;
  informed?: string;
};

export function RACISection({ raci, markdown }: { raci?: RACI; markdown?: string }) {
  if (markdown) {
    return (
      <div className="reflect-raci markdown-p">
        <pre className="whitespace-pre-wrap font-sans text-sm">{markdown}</pre>
      </div>
    );
  }
  if (!raci) return null;
  const rows = [
    { label: "Responsible (who acts)", value: raci.responsible },
    { label: "Accountable (who owns it)", value: raci.accountable },
    { label: "Consulted (who has expertise)", value: raci.consulted },
    { label: "Informed (who needs to know)", value: raci.informed },
  ].filter((r) => r.value);
  if (rows.length === 0) return null;
  return (
    <div className="reflect-raci space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.label}</div>
          <p className="mt-1 text-sm">{r.value}</p>
        </div>
      ))}
    </div>
  );
}
