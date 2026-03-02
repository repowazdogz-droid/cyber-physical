import React from "react";

export default function FeatureCard({
  title,
  body,
  bullets,
}: {
  title: string;
  body: string;
  bullets?: string[];
}) {
  return (
    <div className="site-card">
      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</div>
      <p className="site-text-sm" style={{ marginTop: '0.5rem', lineHeight: 1.75 }}>{body}</p>
      {bullets?.length ? (
        <ul className="site-list">
          {bullets.map((b) => (
            <li key={b} className="site-list-item site-text-sm">{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

