"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BuilderToggle, { type BuilderMode } from "./BuilderToggle";

const NAV_ITEMS = [
  { label: "Platform", href: "/platform" },
  { label: "Experiences", href: "/experiences" },
  { label: "Research", href: "/research" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Sense", href: "/sense" }
];

export default function NavBar() {
  const pathname = usePathname();
  const [mode, setMode] = useState<BuilderMode>("reader");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("omega-builder-mode");
      if (stored === "reader" || stored === "builder") {
        setMode(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (
      !mobileMenuOpen ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const headerClasses = [
    "fixed inset-x-0 top-0 z-40 transition-colors duration-200",
    scrolled
      ? "border-b border-zinc-200/60 bg-white/95 backdrop-blur"
      : "bg-transparent"
  ].join(" ");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className={headerClasses}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[0.24em] text-zinc-900 transition group-hover:text-zinc-950">
              OMEGA
            </span>
            <span className="hidden text-[11px] text-zinc-500 sm:inline">
              Embodied Intelligence Platform
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative pb-0.5 transition ${
                    isActive(item.href)
                      ? "text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-0 -bottom-1 h-px bg-zinc-900/60" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-zinc-500 md:inline">
                {mode === "reader" ? "Reader" : "Builder"}
              </span>
              <BuilderToggle mode={mode} onModeChange={setMode} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200/40 px-4 pb-2 pt-1 text-xs text-zinc-600 md:hidden">
          <span className="text-[11px] text-zinc-500">
            {mode === "reader" ? "Reader mode" : "Builder mode"}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            Menu
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden"
          onClick={closeMobileMenu}
        >
          <div
            className="absolute inset-0 bg-black/10"
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full rounded-t-2xl border-t border-zinc-200/60 bg-white px-4 py-4 shadow-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Menu
              </span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-xs text-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-sm text-zinc-700">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="rounded-lg px-2.5 py-1.5 text-left transition hover:bg-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

