/**
 * StreamingReminderCard - HomePage card surfacing unused streaming subscriptions.
 *
 * Goal: user does not have to navigate to the Subscriptions page to react —
 * the card lists up to 3 idle providers inline with a one-tap "Pausieren" action
 * (deactivates the provider). Tapping anywhere else opens the full page.
 */

import AccessTime from '@mui/icons-material/AccessTime';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutline';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubscriptionsData } from '../../hooks/useSubscriptionsData';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import { tmdbLogoUrl, useProviderLogos } from '../../hooks/useProviderLogos';
import { showUndoToast } from '../../lib/toast';
import { getProviderBrand } from '../Subscriptions/providerBrands';

const formatEuro = (value: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const formatDays = (days: number | null): string => {
  if (days === null) return 'lange nicht mehr';
  if (days <= 1) return 'gestern';
  if (days < 30) return `${days} Tagen`;
  if (days < 365) return `${Math.floor(days / 30)} Monaten`;
  return `${Math.floor(days / 365)} Jahren`;
};

export const StreamingReminderCard = memo(function StreamingReminderCard() {
  const { currentTheme } = useTheme();
  const navigate = useTransitionNavigate();
  const providerLogos = useProviderLogos();
  const { unusedInsights, wastedMonthlySpend, updateProvider, loading } = useSubscriptionsData();

  const topUnused = useMemo(
    () =>
      [...unusedInsights]
        .sort((a, b) => (b.daysSinceLastWatch ?? 9999) - (a.daysSinceLastWatch ?? 9999))
        .slice(0, 3),
    [unusedInsights]
  );

  if (loading || unusedInsights.length === 0) return null;

  const accent = currentTheme.status.warning;
  const surface = currentTheme.background.surface;
  const border = currentTheme.border.default;

  const pauseProvider = (name: string): void => {
    // Optimistic update with undo window
    void updateProvider(name, { active: false });
    showUndoToast(`${name} pausiert`, () => {
      void updateProvider(name, { active: true });
    });
  };

  return (
    <section
      style={{
        padding: '0 20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '14px 14px 12px',
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, transparent), ${surface})`,
          border: `1px solid color-mix(in srgb, ${accent} 35%, ${border})`,
          borderRadius: 16,
          color: currentTheme.text.primary,
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={(e) => {
          // Don't navigate when an inline action button was clicked
          if ((e.target as HTMLElement).closest('[data-stop-nav]')) return;
          navigate('/subscriptions');
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #000))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SubscriptionsIcon style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: currentTheme.text.primary,
                lineHeight: 1.15,
              }}
            >
              {wastedMonthlySpend > 0
                ? `${formatEuro(wastedMonthlySpend)}/Monat schläft`
                : `${unusedInsights.length} Abo${unusedInsights.length === 1 ? '' : 's'} ungenutzt`}
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: currentTheme.text.muted,
              }}
            >
              {unusedInsights.length} Abo{unusedInsights.length === 1 ? '' : 's'} ohne Aktivität ·
              Tippen für Details
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 10,
          }}
        >
          {topUnused.map((insight) => {
            const brand = getProviderBrand(insight.name);
            const logoUrl = tmdbLogoUrl(providerLogos[insight.name], 'w45');
            return (
              <div
                key={insight.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid color-mix(in srgb, ${brand.color} 25%, transparent)`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    overflow: 'hidden',
                    background: logoUrl
                      ? '#0f1422'
                      : `linear-gradient(135deg, ${brand.color}, ${brand.accent ?? brand.color})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                  aria-hidden
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    brand.abbr
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {insight.name}
                  </p>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: 11,
                      color: currentTheme.text.muted,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <AccessTime style={{ fontSize: 11 }} />
                    Seit {formatDays(insight.daysSinceLastWatch)} nichts mehr
                    {insight.monthlyPrice > 0 && ` · ${formatEuro(insight.monthlyPrice)}/M`}
                  </p>
                </div>
                <motion.button
                  data-stop-nav
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseProvider(insight.name);
                  }}
                  aria-label={`${insight.name} pausieren`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${accent} 55%, transparent)`,
                    borderRadius: 8,
                    color: accent,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <PauseCircleOutline style={{ fontSize: 14 }} />
                  Pausieren
                </motion.button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
});

StreamingReminderCard.displayName = 'StreamingReminderCard';
