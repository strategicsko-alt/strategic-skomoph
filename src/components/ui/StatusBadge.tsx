import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Info } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  label?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export function StatusBadge({
  variant = 'neutral',
  label,
  icon,
  size = 'md',
  className = '',
  style,
}: StatusBadgeProps) {
  const getDefaultIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (variant) {
      case 'success':
        return <CheckCircle2 size={iconSize} />;
      case 'warning':
        return <AlertTriangle size={iconSize} />;
      case 'danger':
        return <XCircle size={iconSize} />;
      case 'info':
        return <Info size={iconSize} />;
      case 'neutral':
      default:
        return <Clock size={iconSize} />;
    }
  };

  const getDefaultLabel = () => {
    switch (variant) {
      case 'success':
        return 'ผ่านเกณฑ์';
      case 'warning':
        return 'เฝ้าระวัง';
      case 'danger':
        return 'ตกเกณฑ์';
      case 'info':
        return 'ข้อมูล';
      case 'neutral':
      default:
        return 'รอประเมิน';
    }
  };

  const displayText = label !== undefined ? label : getDefaultLabel();
  const displayIcon = icon !== undefined ? icon : getDefaultIcon();

  const sizeStyle: React.CSSProperties = size === 'sm' ? {
    fontSize: '0.7rem',
    padding: '0.15rem 0.5rem',
  } : {
    fontSize: '0.75rem',
    padding: '0.25rem 0.65rem',
  };

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        ...sizeStyle,
        ...style,
      }}
    >
      {displayIcon}
      <span>{displayText}</span>
    </span>
  );
}
