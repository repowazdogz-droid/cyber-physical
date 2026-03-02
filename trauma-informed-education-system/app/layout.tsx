import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trauma-Informed Education System (V1)",
  description: "Inspection-safe trauma-informed operating system for schools: adult practice, predictable environments, and organisational responses.",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
      {label}
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="flex items-center gap-2">
                <span className="pill">V1</span>
                <span className="font-semibold">Trauma-Informed Education System</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <a className="btn-ghost" href="/about">About</a>
                <a className="btn-ghost" href="/deploy">Deploy</a>
                <a className="btn-primary" href="/start">Start</a>
              </div>
            </div>
          </header>

          <div className="container grid lg:grid-cols-[280px_1fr] gap-0">
            <aside className="sidebar">
              <div className="sidebar-inner">
                <div className="kicker mb-2">Start</div>
                <nav className="space-y-1">
                  <NavLink href="/reflect" label="Reflect" />
                  <NavLink href="/training" label="Training" />
                  <NavLink href="/start" label="Start wizard" />
                  <NavLink href="/packs" label="Packs" />
                  <NavLink href="/implementation" label="Implementation" />
                  <NavLink href="/docs" label="Docs library" />
                  <NavLink href="/search?q=" label="Search" />
                </nav>

                <div className="kicker mt-6 mb-2">Roles</div>
                <nav className="space-y-1">
                  <NavLink href="/roles/leadership" label="Leadership" />
                  <NavLink href="/roles/staff" label="Staff" />
                  <NavLink href="/roles/parents" label="Parents" />
                  <NavLink href="/roles/trusts" label="Trusts / LA" />
                </nav>

                <div className="kicker mt-6 mb-2">Safety</div>
                <nav className="space-y-1">
                  <NavLink href="/docs/governance/safeguarding" label="Safeguarding boundary" />
                  <NavLink href="/docs/evidence/claims-discipline" label="Claims discipline" />
                </nav>
              </div>
            </aside>

            <main className="page">
              {children}
              <footer className="mt-10 text-xs text-muted-foreground">
                V1 • Evidence-informed • Safeguarding responsibilities remain with the school
              </footer>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
