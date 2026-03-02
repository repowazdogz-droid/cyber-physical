export function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-[72ch]">
          <h1 className="h1">{title}</h1>
          {subtitle ? <p className="sub mt-2">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex gap-2 flex-wrap">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card card-pad">{children}</div>;
}
























