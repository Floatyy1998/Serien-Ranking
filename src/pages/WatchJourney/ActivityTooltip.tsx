import { TooltipEntry } from './types';

export const ActivityTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 15, 35, 0.95)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <p style={{ color: 'white', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{label}</p>
        {payload.map((entry: TooltipEntry, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: entry.color,
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
