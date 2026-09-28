import { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatYearRange, parseYearRange } from '../../../lib/filters/releaseYearFilter';
import { t } from '../../../services/i18n';

interface YearRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const commitYear = (raw: string): number | null | undefined => {
  if (raw === '') return null;
  return /^\d{4}$/.test(raw) ? parseInt(raw, 10) : undefined;
};

export const YearRangeFilter: React.FC<YearRangeFilterProps> = ({ value, onChange }) => {
  const { currentTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const presets: { label: string; from: number | null; to: number | null }[] = [
    { label: t('Dieses Jahr'), from: currentYear, to: currentYear },
    ...[2020, 2010, 2000, 1990].map((decade) => ({
      label: t('{jahrzehnt}er', { jahrzehnt: decade }),
      from: decade,
      to: decade + 9,
    })),
    { label: t('Vor {jahr}', { jahr: 1990 }), from: null, to: 1989 },
  ];
  const range = parseYearRange(value);
  const [fromText, setFromText] = useState(range.from?.toString() ?? '');
  const [toText, setToText] = useState(range.to?.toString() ?? '');

  useEffect(() => {
    const next = parseYearRange(value);
    setFromText(next.from?.toString() ?? '');
    setToText(next.to?.toString() ?? '');
  }, [value]);

  const handleInput = (which: 'from' | 'to', raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (which === 'from') setFromText(digits);
    else setToText(digits);
    const year = commitYear(digits);
    if (year === undefined) return;
    onChange(
      which === 'from' ? formatYearRange(year, range.to) : formatYearRange(range.from, year)
    );
  };

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px',
    background: isActive
      ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`
      : 'var(--glass-medium)',
    border: `1px solid ${isActive ? 'transparent' : `${currentTheme.border.default}`}`,
    borderRadius: 'var(--radius-xl)',
    color: currentTheme.text.secondary,
    fontSize: 'var(--text-sm)',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    backdropFilter: isActive ? 'none' : 'var(--blur-sm)',
    WebkitBackdropFilter: isActive ? 'none' : 'var(--blur-sm)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 'var(--control-md)',
    padding: '0 14px',
    background: currentTheme.background.surface,
    border: `2px solid ${currentTheme.border.default}`,
    borderRadius: 'var(--radius-lg)',
    color: currentTheme.text.primary,
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        {presets.map((preset) => {
          const isActive = range.from === preset.from && range.to === preset.to;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(isActive ? '' : formatYearRange(preset.from, preset.to))}
              style={chipStyle(isActive)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          inputMode="numeric"
          value={fromText}
          onChange={(e) => handleInput('from', e.target.value)}
          placeholder={t('Jahr von')}
          aria-label={t('Jahr von')}
          style={inputStyle}
        />
        <span style={{ color: currentTheme.text.muted }}>–</span>
        <input
          type="text"
          inputMode="numeric"
          value={toText}
          onChange={(e) => handleInput('to', e.target.value)}
          placeholder={t('Jahr bis')}
          aria-label={t('Jahr bis')}
          style={inputStyle}
        />
      </div>
    </div>
  );
};
