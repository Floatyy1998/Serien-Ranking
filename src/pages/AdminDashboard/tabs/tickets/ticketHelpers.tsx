import React from 'react';
import type { TicketTheme } from './ticketStyles';

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: '5px',
        background: `${color}15`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function Section({
  title,
  children,
  theme,
  color,
}: {
  title: string;
  children: React.ReactNode;
  theme: TicketTheme;
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: color || theme.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
