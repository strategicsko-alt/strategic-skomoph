"use client";
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}

export function CollapsibleSection({ title, children, defaultOpen = true, color }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', userSelect: 'none'
        }}
        onClick={() => setOpen(!open)}
      >
        <h2 style={{ fontSize: '1.125rem', color: color || 'var(--primary)', margin: 0 }}>{title}</h2>
        <button
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            padding: '0.3rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--secondary-foreground)', fontSize: '0.8rem', fontWeight: 500,
            transition: 'background 0.15s'
          }}
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {open ? 'ซ่อน' : 'แสดง'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.35s ease, margin-top 0.35s ease',
        marginTop: open ? '1rem' : '0'
      }}>
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
