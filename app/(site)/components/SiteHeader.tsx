import Link from 'next/link';
import { siteConfig } from '../site.config';
import { Container } from './Container';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            Omega
          </Link>
          <nav className={styles.nav}>
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}







































