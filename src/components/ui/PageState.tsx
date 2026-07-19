import React from 'react';
import { t } from '../../services/i18n';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

interface PageStateProps {
  mode: 'loading' | 'empty' | 'error';
  /** loading / error title. EmptyState already takes its own title via `empty.title`. */
  title?: string;
  /** Optional text for loading; description for error. */
  message?: string;
  /** Required for mode="empty": icon, title, description, optional action. */
  empty?: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    iconColor?: string;
    action?: { label: string; onClick: () => void };
  };
  /** Required for mode="error": icon + optional retry. */
  error?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    onRetry?: () => void;
  };
  /** Optional wrapper style override (e.g. minHeight for above-the-fold use). */
  style?: React.CSSProperties;
}

/**
 * Single source of truth for page-level loading / empty / error states.
 * Wraps the existing LoadingSpinner and EmptyState so every page presents
 * the same polished look — no more ad-hoc bare spinners or one-off empty
 * divs scattered across the codebase.
 */
export const PageState: React.FC<PageStateProps> = ({ mode, message, empty, error, style }) => {
  if (mode === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'min(50vh, 480px)',
          ...style,
        }}
      >
        <LoadingSpinner text={message} />
      </div>
    );
  }

  if (mode === 'error') {
    if (!error) return null;
    return (
      <div style={style}>
        <EmptyState
          icon={error.icon ?? '!'}
          title={error.title}
          description={error.description}
          action={
            error.onRetry ? { label: t('Erneut versuchen'), onClick: error.onRetry } : undefined
          }
        />
      </div>
    );
  }

  if (!empty) return null;
  return (
    <div style={style}>
      <EmptyState {...empty} />
    </div>
  );
};
