import { Insights } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import type { BookYearStats } from '../../../lib/books/bookStats';
import { t } from '../../../services/i18n';
import { MONTH_INITIALS } from '../helpers';

export const MonthBars: React.FC<{ values: number[]; color: string; currentMonth?: number }> = ({
  values,
  color,
  currentMonth,
}) => {
  const { currentTheme } = useTheme();
  const max = Math.max(1, ...values);
  const labels = MONTH_INITIALS();
  return (
    <div className="bk-bars">
      {values.map((v, i) => (
        <div key={i} className="bk-bar" title={`${v}`}>
          <div
            className="bk-bar-fill"
            style={{
              height: `${Math.max(3, (v / max) * 100)}%`,
              background:
                v > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : 'rgba(255,255,255,0.08)',
              opacity: currentMonth !== undefined && i > currentMonth ? 0.35 : 1,
            }}
          />
          <span
            className="bk-bar-label"
            style={{
              color: i === currentMonth ? currentTheme.text.secondary : currentTheme.text.muted,
            }}
          >
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
};

export const StatTile: React.FC<{ value: React.ReactNode; label: string; color?: string }> = ({
  value,
  label,
  color,
}) => {
  const { currentTheme } = useTheme();
  return (
    <div className="bk-stat">
      <span className="bk-stat-value" style={{ color: color ?? currentTheme.text.secondary }}>
        {value}
      </span>
      <span className="bk-stat-label" style={{ color: currentTheme.text.muted }}>
        {label}
      </span>
    </div>
  );
};

export const BookStatsSection: React.FC<{ stats: BookYearStats; currentMonth: number }> = ({
  stats,
  currentMonth,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  if (stats.pagesRead === 0 && stats.booksFinished === 0) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<Insights />}
        iconColor={currentTheme.accent}
        title={t('Dein Lesejahr')}
        onSeeAll={() => navigate('/reading/stats')}
        seeAllLabel={t('Mehr')}
      />
      <div className="bk-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="bk-stat-grid">
          <StatTile
            value={stats.pagesRead.toLocaleString()}
            label={t('Seiten {year}', { year: stats.year })}
          />
          <StatTile value={stats.booksFinished} label={t('Bücher beendet')} />
          <StatTile value={stats.pagesPerDay.toLocaleString()} label={t('Seiten pro Tag')} />
          <StatTile
            value={stats.streak}
            label={stats.streak === 1 ? t('Tag Lese-Serie') : t('Tage Lese-Serie')}
            color={stats.streak > 2 ? currentTheme.status.warning : undefined}
          />
        </div>
        <div className="bk-card">
          <div
            className="bk-muted"
            style={{ color: currentTheme.text.muted, marginBottom: 10, fontWeight: 700 }}
          >
            {t('Seiten pro Monat')}
          </div>
          <MonthBars
            values={stats.pagesByMonth}
            color={currentTheme.primary}
            currentMonth={currentMonth}
          />
        </div>
      </div>
    </section>
  );
};
