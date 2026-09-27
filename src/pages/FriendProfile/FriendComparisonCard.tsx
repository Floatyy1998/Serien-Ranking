import { ChevronRight, Movie, Timer, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTotalWatchtime } from '../Leaderboard/leaderboardUtils';
import { t } from '../../services/i18n';
import type { ComparisonTotals } from './useFriendComparison';

interface Props {
  friendName: string;
  own: ComparisonTotals;
  friend: ComparisonTotals | null;
  loading: boolean;
}

interface Row {
  key: string;
  label: string;
  icon: React.ReactNode;
  own: number;
  friend: number;
  format: (value: number) => string;
  ownHint?: string;
  friendHint?: string;
}

/** Anteil der eigenen Seite am Tauziehen-Balken, nie ganz 0 oder 100. */
const ownShare = (own: number, friend: number): number => {
  const sum = own + friend;
  if (sum <= 0) return 50;
  return Math.min(96, Math.max(4, Math.round((own / sum) * 100)));
};

export const FriendComparisonCard = memo(function FriendComparisonCard({
  friendName,
  own,
  friend,
  loading,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const rows: Row[] = useMemo(() => {
    if (!friend) return [];
    return [
      {
        key: 'watchtime',
        label: 'Watchtime',
        icon: <Timer sx={{ fontSize: 14 }} />,
        own: own.watchtimeMinutes,
        friend: friend.watchtimeMinutes,
        format: formatTotalWatchtime,
      },
      {
        key: 'series',
        label: t('Serien'),
        icon: <Tv sx={{ fontSize: 14 }} />,
        own: own.seriesStarted,
        friend: friend.seriesStarted,
        format: (value) => String(value),
        ownHint: t('davon {n} komplett', { n: own.seriesCompleted }),
        friendHint: t('davon {n} komplett', { n: friend.seriesCompleted }),
      },
      {
        key: 'movies',
        label: t('Filme'),
        icon: <Movie sx={{ fontSize: 14 }} />,
        own: own.movies,
        friend: friend.movies,
        format: (value) => String(value),
      },
    ];
  }, [own, friend]);

  if (loading || !friend) {
    return (
      <div className="fp-compare fp-compare--empty">
        <span style={{ color: currentTheme.text.muted }}>
          {loading
            ? t('Vergleich wird geladen …')
            : t('Von {name} gibt es noch keine Gesamtzahlen.', { name: friendName })}
        </span>
      </div>
    );
  }

  return (
    <section className="fp-compare" aria-label={t('Ihr im Vergleich')}>
      <header className="fp-compare-head">
        <h2 style={{ color: currentTheme.text.primary }}>{t('Ihr im Vergleich')}</h2>
        <button
          type="button"
          className="fp-compare-link"
          aria-label={t('Zur Gesamt-Rangliste')}
          style={{ color: currentTheme.text.muted }}
          onClick={() => navigate('/leaderboard')}
        >
          <ChevronRight style={{ fontSize: 18 }} />
        </button>
      </header>

      <div className="fp-compare-names" style={{ color: currentTheme.text.muted }}>
        <span style={{ color: currentTheme.accent }}>{t('Du')}</span>
        <span>{friendName}</span>
      </div>

      {rows.map((row, index) => {
        const ownLeads = row.own > row.friend;
        const friendLeads = row.friend > row.own;
        return (
          <div className="fp-compare-row" key={row.key}>
            <span
              className="fp-compare-value fp-compare-value--own"
              title={row.ownHint}
              style={{
                color: ownLeads ? currentTheme.accent : currentTheme.text.secondary,
                fontWeight: ownLeads ? 800 : 600,
              }}
            >
              {row.format(row.own)}
            </span>
            <div className="fp-compare-mid">
              <span className="fp-compare-label" style={{ color: currentTheme.text.muted }}>
                {row.icon}
                {row.label}
              </span>
              <div
                className="fp-compare-track"
                style={{
                  background: `color-mix(in srgb, ${currentTheme.text.secondary} 38%, transparent)`,
                }}
              >
                <motion.div
                  className="fp-compare-fill"
                  initial={{ width: '50%' }}
                  animate={{ width: `${ownShare(row.own, row.friend)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
                  style={{
                    background: currentTheme.accent,
                    boxShadow: `2px 0 0 ${currentTheme.background.default}`,
                  }}
                />
              </div>
            </div>
            <span
              className="fp-compare-value fp-compare-value--friend"
              title={row.friendHint}
              style={{
                color: friendLeads ? currentTheme.text.primary : currentTheme.text.secondary,
                fontWeight: friendLeads ? 800 : 600,
              }}
            >
              {row.format(row.friend)}
            </span>
          </div>
        );
      })}
    </section>
  );
});
