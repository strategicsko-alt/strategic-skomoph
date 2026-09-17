"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type ToastFn = {
  (message: string, type?: ToastType, duration?: number): void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

interface ToastContextType {
  toast: ToastFn;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg: string, d?: number) => addToast(msg, 'success', d), [addToast]);
  const error = useCallback((msg: string, d?: number) => addToast(msg, 'error', d), [addToast]);
  const warning = useCallback((msg: string, d?: number) => addToast(msg, 'warning', d), [addToast]);
  const info = useCallback((msg: string, d?: number) => addToast(msg, 'info', d), [addToast]);

  const toastFn = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    addToast(message, type, duration);
  }, [addToast]) as unknown as ToastFn;

  toastFn.success = success;
  toastFn.error = error;
  toastFn.warning = warning;
  toastFn.info = info;

  const value: ToastContextType = {
    toast: toastFn,
    success,
    error,
    warning,
    info,
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: 'var(--success-text)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--danger-text)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--warning-text)', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--info-text)', flexShrink: 0 }} />;
    }
  };

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'var(--success-bg)',
          borderColor: 'var(--success-border)',
          color: 'var(--success-text)',
        };
      case 'error':
        return {
          backgroundColor: 'var(--danger-bg)',
          borderColor: 'var(--danger-border)',
          color: 'var(--danger-text)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--warning-bg)',
          borderColor: 'var(--warning-border)',
          color: 'var(--warning-text)',
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          color: 'var(--info-text)',
        };
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Floating Container */}
      <aside
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '420px',
          width: 'calc(100vw - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((item) => {
          const style = getStyle(item.type);
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '0.9rem',
                fontWeight: 500,
                lineHeight: 1.4,
                animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                ...style,
              }}
            >
              {getIcon(item.type)}
              <div style={{ flex: 1 }}>{item.message}</div>
              <button
                onClick={() => removeToast(item.id)}
                aria-label="ปิดการแจ้งเตือน"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'currentColor',
                  opacity: 0.7,
                  transition: 'opacity 0.15s',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
