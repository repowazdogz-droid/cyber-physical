import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  as?: "h1" | "h2";
  children: ReactNode;
}

export default function Section({
  title,
  eyebrow,
  subtitle,
  as = "h2",
  children
}: SectionProps) {
  const HeadingTag = as;
  const headingClassName =
    as === "h1"
      ? "text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-zinc-900"
      : "text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900";

  return (
    <section className="space-y-8 py-16 sm:py-20">
      <header className="space-y-3">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {eyebrow}
          </p>
        )}
        <HeadingTag className={headingClassName}>{title}</HeadingTag>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {subtitle}
          </p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

