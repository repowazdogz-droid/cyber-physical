import { ReactNode } from 'react';
import styles from './Callout.module.css';

interface CalloutProps {
  children: ReactNode;
  variant?: 'info' | 'warning' | 'success';
  className?: string;
}

export function Callout({ 
  children, 
  variant = 'info',
  className = '' 
}: CalloutProps) {
  return (
    <div className={`${styles.callout} ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}







































