import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', padding: '1rem' }}>
      <Skeleton height="36px" borderRadius="var(--radius-md)" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="28px" style={{ flex: c === 0 ? 1 : 2 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 2 }: { lines?: number } = {}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton height="24px" width="60%" />
      {Array.from({ length: Math.max(1, lines - 1) }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i === 0 ? "80%" : i % 2 === 0 ? "65%" : "45%"} />
      ))}
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <Skeleton height="32px" width="80px" borderRadius="var(--radius-full)" />
        <Skeleton height="32px" width="80px" borderRadius="var(--radius-full)" />
      </div>
    </div>
  );
}
