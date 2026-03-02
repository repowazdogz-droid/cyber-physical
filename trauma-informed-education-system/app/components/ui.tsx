import React from "react";

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card ${props.className ?? ""}`.trim()}>{props.children}</div>;
}

export function CardBody(props: React.PropsWithChildren<{ className?: string }>) {
  return <div style={{ padding: 18 }} className={props.className}>{props.children}</div>;
}

export function PageHead(props: React.PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <div className="pageHead">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1">{props.title}</h1>
          {props.subtitle ? <p className="subtitle">{props.subtitle}</p> : null}
        </div>
        <div className="row">{props.children}</div>
      </div>
    </div>
  );
}

export function Pill(props: React.PropsWithChildren<{ muted?: boolean; className?: string }>) {
  return <span className={`pill ${props.muted ? "pillMuted" : ""} ${props.className || ""}`.trim()}>{props.children}</span>;
}

export function Button(
  props: React.PropsWithChildren<{ href?: string; onClick?: () => void; variant?: "primary" | "secondary" | "ghost"; type?: "button" | "submit"; disabled?: boolean; className?: string; style?: React.CSSProperties }>,
) {
  const variantClass = props.variant === "primary" ? "btnPrimary" : props.variant === "secondary" ? "btnSecondary" : props.variant === "ghost" ? "btnGhost" : "";
  const cls = `btn ${variantClass} ${props.className || ""}`.trim();
  if (props.href) return <a className={cls} href={props.href} style={props.style}>{props.children}</a>;
  return <button className={cls} onClick={props.onClick} type={props.type || "button"} disabled={props.disabled} style={props.style}>{props.children}</button>;
}

export function Callout(props: React.PropsWithChildren<{ kind?: "NOTE" | "STOP" | "BOUNDARY"; title?: string }>) {
  const k = props.kind ?? "NOTE";
  const cls = k === "STOP" ? "callout calloutStop" : k === "BOUNDARY" ? "callout calloutBound" : "callout calloutNote";
  return (
    <div className={cls}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="pill">{props.title ?? k}</div>
      </div>
      <div style={{ marginTop: 8 }} className="small">{props.children}</div>
    </div>
  );
}

