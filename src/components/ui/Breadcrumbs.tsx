import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function Breadcrumbs({ items, className = '', style }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.35rem',
        fontSize: '0.85rem',
        color: 'var(--secondary-foreground)',
        marginBottom: '1rem',
        ...style,
      }}
    >
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--secondary-foreground)',
          transition: 'color var(--transition-fast)',
        }}
        className="hover:text-primary"
      >
        <Home size={14} />
        <span>หน้าหลัก</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--secondary-foreground)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{
                  fontWeight: isLast ? 600 : 400,
                  color: isLast ? 'var(--foreground)' : 'var(--secondary-foreground)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
