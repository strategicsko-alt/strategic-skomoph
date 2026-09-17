"use client";

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when opened
      setTimeout(() => confirmBtnRef.current?.focus(), 50);

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={22} />
          </div>
        );
      case 'warning':
        return (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HelpCircle size={22} />
          </div>
        );
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-primary';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xl)',
          animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          aria-label="ปิดกล่องข้อความ"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            color: 'var(--secondary-foreground)',
            opacity: 0.7,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {getIcon()}
          <div style={{ flex: 1 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: '0.35rem',
              }}
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              style={{
                fontSize: '0.95rem',
                color: 'var(--foreground)',
                lineHeight: 1.5,
                marginBottom: description ? '0.5rem' : '0',
              }}
            >
              {message}
            </p>
            {description && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--secondary-foreground)',
                  backgroundColor: 'var(--secondary)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
          }}
        >
          <button
            type="button"
            className="btn-secondary touch-target-sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`${getConfirmBtnClass()} touch-target-sm`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
