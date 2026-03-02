"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/demos", label: "Demos" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/collaborate", label: "Collaborate" },
];

const BUILD_NAV = [
  { href: "/demo", label: "Demo Console" },
  { href: "/kernel-studio", label: "Decision Studio" },
];

export default function SiteNav() {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };
  
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" style={{ fontWeight: 600, letterSpacing: '-0.025em', textDecoration: 'none', color: '#171717' }}>
          Omega
          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: '#737373' }}>Decision Framework · Decision Models · Constraint Sets</span>
        </Link>

        <nav className="site-flex site-items-center site-gap-3" style={{ flexWrap: 'wrap' }}>
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={active ? "site-nav-link-active" : "site-nav-link"}
              >
                {n.label}
              </Link>
            );
          })}
          <span style={{ color: '#d4d4d4', margin: '0 0.25rem' }}>|</span>
          {BUILD_NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={active ? "site-nav-link-active" : "site-nav-link"}
                style={{ fontSize: '0.8125rem' }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

