'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/'
  const isHistory = pathname === '/analyses'
  const isDetail = pathname?.startsWith('/analyses/')

  return (
    <nav className="sticky top-0 z-50 h-14 bg-surface border-b border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-[7px] bg-gray-900 flex items-center justify-center">
            <span className="font-mono text-[13px] font-bold text-white">R</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            REFLEXIVE
          </span>
          <span className="font-mono text-[10px] bg-black/4 rounded px-2 py-0.5 text-muted">
            v0.1
          </span>
        </Link>

        {isHome && (
          <Link
            href="/analyses"
            className="text-[13px] font-medium text-muted hover:text-foreground transition-colors"
          >
            History
          </Link>
        )}

        {isHistory && (
          <Link
            href="/"
            className="bg-gray-900 text-white rounded-[10px] px-5 py-2 text-[13px] font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            New Analysis
          </Link>
        )}

        {isDetail && (
          <Link
            href="/"
            className="text-[13px] font-medium text-muted hover:text-foreground transition-colors"
          >
            New Analysis
          </Link>
        )}
      </div>
    </nav>
  )
}
