"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const p = usePathname();
  const active = p === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}
    >
      {children}
    </Link>
  );
}

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="mx-auto max-w-5xl px-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold">Trauma-Informed Schools Toolkit</Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/training">Training</NavLink>
          <NavLink href="/packs">Packs</NavLink>
          <NavLink href="/docs">Docs</NavLink>
          <NavLink href="/search">Search</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>
      </div>
    </div>
  );
}
