import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, iconColor }) => {
  const { currentTheme } = useTheme();

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div
        style={{
          fontSize: '48px',
          color: iconColor || currentTheme.primary,
          marginBottom: '16px',
          opacity: 0.5,
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${iconColor || currentTheme.primary}15 0%, transparent 70%)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
        {icon}
      </div>
      <h2
        style={{
          fontSize: '18px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: currentTheme.text.primary,
          marginBottom: '8px',
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ color: currentTheme.text.secondary, fontSize: '15px', margin: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
};
