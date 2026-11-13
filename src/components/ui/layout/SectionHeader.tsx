import React from 'react';
import { ChevronRight } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

interface SectionHeaderProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  iconColor,
  title,
  onSeeAll,
  seeAllLabel,
  action,
  style,
}) => {
  const { currentTheme } = useTheme();
  const resolvedSeeAllLabel = seeAllLabel ?? t('Alle');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        marginBottom: '16px',
        ...style,
      }}
    >
      <h2
        style={{
          fontSize: '22px',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          margin: 0,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            display: 'flex',
            flexShrink: 0,
            color: iconColor || currentTheme.primary,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      </h2>
      {action && <div style={{ flexShrink: 0, display: 'flex' }}>{action}</div>}
      {onSeeAll && (
        <Tooltip title={t('Alle anzeigen')} arrow>
          <button
            onClick={onSeeAll}
            style={{
              background: 'var(--glass-light)',
              border: 'none',
              borderRadius: 999,
              color: currentTheme.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px 0 14px',
              minHeight: 34,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {resolvedSeeAllLabel} <ChevronRight style={{ fontSize: '16px' }} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
