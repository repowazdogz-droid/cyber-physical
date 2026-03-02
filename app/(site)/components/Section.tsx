import { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'narrow' | 'wide';
}

export function Section({ 
  children, 
  className = '', 
  variant = 'default' 
}: SectionProps) {
  return (
    <section className={`${styles.section} ${styles[variant]} ${className}`}>
      {children}
    </section>
  );
}







































