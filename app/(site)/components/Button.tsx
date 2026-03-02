import { ReactNode, ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
}

interface ButtonAsButton extends BaseButtonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps {
  href: string;
  children: ReactNode;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ 
  children, 
  variant = 'primary',
  href,
  className = '',
  ...props 
}: ButtonProps) {
  const baseClassName = `${styles.button} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClassName} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

