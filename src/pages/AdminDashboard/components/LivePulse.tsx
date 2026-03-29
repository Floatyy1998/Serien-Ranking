import React from 'react';

interface LivePulseProps {
  count: number;
  color: string;
  textColor: string;
}

export const LivePulse = React.memo<LivePulseProps>(({ count, color, textColor }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 20,
      background: `${color}15`,
      border: `1px solid ${color}30`,
    }}
  >
    <div style={{ position: 'relative', width: 10, height: 10 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          animation: 'admin-pulse 2s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          background: color,
        }}
      />
    </div>
    <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
      {count} {count === 1 ? 'User' : 'Users'} aktiv
    </span>
  </div>
));

LivePulse.displayName = 'LivePulse';
