"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "Home" },
  { href: "/workouts", label: "Workouts" },
  { href: "/classes", label: "Classes" },
  { href: "/profile", label: "Profile" },
];

export function MemberNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a2a2a] bg-[#1a1a1a] safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`touch-target flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium ${
              pathname === href || pathname.startsWith(href + "/")
                ? "text-[#c8a951]"
                : "text-[#a0a0a0]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
