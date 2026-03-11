import type { ReactNode } from "react";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      <NavBar />
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-24 lg:px-8">
        <main className="flex-1 space-y-12 sm:space-y-16">{children}</main>
        <footer className="mt-16 border-t border-zinc-200/60 pt-6 text-xs text-zinc-500">
          OMEGA — protocols, runtimes, proofs.
        </footer>
      </div>
    </div>
  );
}

