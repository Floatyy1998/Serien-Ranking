import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContextDef';
import type { WatchlistGap } from '../../../hooks/useSubscriptionsData';
import { getProviderBrand } from '../providerBrands';

interface WatchlistGapsSectionProps {
  watchlistGaps: WatchlistGap[];
  /** Anzahl aktiver Abos — steuert den Text des Empty-States. */
  activeCount: number;
}

/** "Lücken in deiner Watchlist"-Sektion: Serien, die nur bei nicht abonnierten Anbietern laufen. */
export const WatchlistGapsSection = ({ watchlistGaps, activeCount }: WatchlistGapsSectionProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const surface = currentTheme.background.surface;
  const border = currentTheme.border.default;
  const muted = currentTheme.text.muted;

  return (
    <div className="sub-section">
      <div className="sub-section-head">
        <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
          Lücken in deiner Watchlist
        </h2>
        {watchlistGaps.length > 0 && (
          <span className="sub-section-count" style={{ color: muted }}>
            {watchlistGaps.length} Serien
          </span>
        )}
      </div>
      <p className="sub-section-hint" style={{ color: muted }}>
        Diese Watchlist-Serien laufen nur bei Anbietern, die du gerade nicht abonniert hast.
      </p>

      {watchlistGaps.length === 0 ? (
        <div className="sub-empty" style={{ borderColor: border, color: muted }}>
          {activeCount === 0
            ? 'Sobald du Abos markierst, zeigen wir hier Lücken.'
            : 'Keine Lücken – alle Watchlist-Serien laufen auf deinen aktiven Abos.'}
        </div>
      ) : (
        <div className="sub-gap-list">
          {watchlistGaps.slice(0, 30).map(({ series, providers }) => (
            <motion.div
              key={series.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="sub-gap-card"
              style={{
                background: surface,
                borderColor: border,
                color: currentTheme.text.primary,
              }}
              onClick={() => navigate(`/series/${series.id}`)}
            >
              {series.poster?.poster && (
                <img
                  src={series.poster.poster}
                  alt={series.title || series.original_name || 'Serie'}
                  className="sub-gap-poster"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="sub-gap-body">
                <p className="sub-gap-title">
                  {series.title || series.original_name || 'Unbekannt'}
                </p>
                <div className="sub-gap-providers">
                  {providers.map((p) => {
                    const b = getProviderBrand(p);
                    return (
                      <span
                        key={p}
                        className="sub-gap-chip"
                        style={{
                          borderColor: `${b.color}40`,
                          color: currentTheme.text.primary,
                        }}
                      >
                        <span className="sub-gap-chip-dot" style={{ background: b.color }} />
                        {p}
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
          {watchlistGaps.length > 30 && (
            <p style={{ fontSize: 12, textAlign: 'center', color: muted, marginTop: 4 }}>
              + {watchlistGaps.length - 30} weitere
            </p>
          )}
        </div>
      )}
    </div>
  );
};
