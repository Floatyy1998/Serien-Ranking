import { Movie, Timer, Tv } from '@mui/icons-material';
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
  ownDetail?: string;
  friendDetail?: string;
}

/** Anteil am jeweils groesseren Wert — beide Balken teilen sich eine Skala,
 *  sonst sieht ein Vorsprung von 5 % aus wie ein Erdrutsch. */
const share = (value: number, max: number): number =>
  max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;

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
        icon: <Timer sx={{ fontSize: 15 }} />,
        own: own.watchtimeMinutes,
        friend: friend.watchtimeMinutes,
        format: formatTotalWatchtime,
      },
      {
        key: 'series',
        label: t('Serien'),
        icon: <Tv sx={{ fontSize: 15 }} />,
        own: own.seriesStarted,
        friend: friend.seriesStarted,
        format: (value) => String(value),
        ownDetail: t('davon {n} komplett', { n: own.seriesCompleted }),
        friendDetail: t('davon {n} komplett', { n: friend.seriesCompleted }),
      },
      {
        key: 'movies',
        label: t('Filme'),
        icon: <Movie sx={{ fontSize: 15 }} />,
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
        <div className="fp-compare-names" style={{ color: currentTheme.text.muted }}>
          <span>{t('Du')}</span>
          <span>{friendName}</span>
        </div>
      </header>

      {rows.map((row, index) => {
        const max = Math.max(row.own, row.friend);
        const ownLeads = row.own > row.friend;
        const friendLeads = row.friend > row.own;

        return (
          <div className="fp-compare-row" key={row.key}>
            <div className="fp-compare-label" style={{ color: currentTheme.text.secondary }}>
              {row.icon}
              <span>{row.label}</span>
            </div>

            <div className="fp-compare-duel">
              <Side
                align="left"
                value={row.format(row.own)}
                detail={row.ownDetail}
                percent={share(row.own, max)}
                leads={ownLeads}
                delay={index * 0.08}
              />
              <Side
                align="right"
                value={row.format(row.friend)}
                detail={row.friendDetail}
                percent={share(row.friend, max)}
                leads={friendLeads}
                delay={index * 0.08}
              />
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="fp-compare-cta"
        style={{ color: currentTheme.accent }}
        onClick={() => navigate('/leaderboard')}
      >
        {t('Zur Gesamt-Rangliste')}
      </button>
    </section>
  );
});

const Side = ({
  align,
  value,
  detail,
  percent,
  leads,
  delay,
}: {
  align: 'left' | 'right';
  value: string;
  detail?: string;
  percent: number;
  leads: boolean;
  delay: number;
}) => {
  const { currentTheme } = useTheme();

  return (
    <div className={`fp-compare-side fp-compare-side--${align}`}>
      <span
        className="fp-compare-value"
        style={{
          color: leads ? currentTheme.accent : currentTheme.text.secondary,
          fontWeight: leads ? 800 : 600,
        }}
      >
        {value}
      </span>
      <div className="fp-compare-track">
        <motion.div
          className="fp-compare-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
          style={{
            background: leads ? currentTheme.accent : 'var(--glass-strong)',
            boxShadow: leads ? `0 0 12px ${currentTheme.accent}66` : 'none',
          }}
        />
      </div>
      {detail && (
        <span className="fp-compare-detail" style={{ color: currentTheme.text.muted }}>
          {detail}
        </span>
      )}
    </div>
  );
};
