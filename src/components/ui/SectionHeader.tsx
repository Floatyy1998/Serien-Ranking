import React from 'react';
import { ChevronRight } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContextDef';

interface SectionHeaderProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  style?: React.CSSProperties;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  iconColor,
  title,
  onSeeAll,
  seeAllLabel = 'Alle',
  style,
}) => {
  const { currentTheme } = useTheme();

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
          fontSize: '20px',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            display: 'flex',
            color: iconColor || currentTheme.primary,
            filter: `drop-shadow(0 0 6px ${iconColor || currentTheme.primary}60)`,
          }}
        >
          {icon}
        </span>
        {title}
      </h2>
      {onSeeAll && (
        <Tooltip title="Alle anzeigen" arrow>
          <button
            onClick={onSeeAll}
            style={{
              background: 'none',
              border: 'none',
              color: currentTheme.text.secondary,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            {seeAllLabel} <ChevronRight style={{ fontSize: '16px' }} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
