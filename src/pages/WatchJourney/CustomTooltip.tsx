import { useTheme } from '../../contexts/ThemeContextDef';
import type { TooltipEntry } from './types';
import { formatGermanNumber } from './tooltipUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  unit?: 'hours' | 'percent';
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  unit = 'hours',
}) => {
  const { currentTheme } = useTheme();

  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <p
          style={{
            color: currentTheme.text.primary,
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          {label}
        </p>
        {payload
          .filter((entry: TooltipEntry) => entry.value > 0)
          .map((entry: TooltipEntry, index: number) => {
            const formatted =
              unit === 'percent'
                ? `${Math.round(entry.value)}%`
                : `${formatGermanNumber(entry.value)} Stunden`;
            return (
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
                <span style={{ color: currentTheme.text.muted, fontSize: 13 }}>
                  {entry.name}: {formatted}
                </span>
              </div>
            );
          })}
      </div>
    );
  }
  return null;
};
