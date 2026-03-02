"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "What Omega Is" },
  { href: "/how-its-used", label: "How It's Used" },
  { href: "/protocols", label: "Protocols" },
  { href: "/stewardship", label: "Stewardship" },
  { href: "/contact", label: "Contact" },
];

export default function ProtocolNav() {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };
  
  return (
    <header style={{
      borderBottom: '1px solid #e5e5e5',
      padding: '1.5rem 0',
      marginBottom: '3rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <Link href="/" style={{ 
          fontWeight: 600, 
          fontSize: '1.25rem',
          textDecoration: 'none', 
          color: '#171717' 
        }}>
          Omega Protocol
        </Link>

        <nav style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  textDecoration: 'none',
                  color: active ? '#171717' : '#737373',
                  fontWeight: active ? 500 : 400,
                  fontSize: '0.9375rem',
                  borderBottom: active ? '2px solid #171717' : '2px solid transparent',
                  paddingBottom: '0.25rem',
                }}
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




























