"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/programmes", label: "Programmes" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-[#2a2a2a] bg-primary px-4 py-3">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/admin/dashboard" className="font-bold text-[#c8a951]">
          Strength Box
        </Link>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`touch-target shrink-0 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-[#c8a951]/20 text-[#c8a951]"
                  : "text-[#a0a0a0] hover:text-[#f1f1f1]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
