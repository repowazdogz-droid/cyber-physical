import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OMEGA — Human-led cognitive infrastructure',
  description: 'Clarity, reasoning, and simplification for complex technical domains — without autonomy, persuasion, or decision substitution.',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
