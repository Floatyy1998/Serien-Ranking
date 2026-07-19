/**
 * Kosten-Optimizer: rankt aktive Abos nach Preis-Leistung (€ pro geschauter
 * Stunde) im Unused-Fenster und schlägt teure/ungenutzte Abos zum Pausieren vor.
 * Baut auf den bereits im Hook berechneten Feldern auf (recentWatchMinutes,
 * monthlyWatchHours, costPerHour) — keine eigene Datenbeschaffung.
 */

import { TrendingDown, TrendingUp, Bolt, ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { UseSubscriptionsDataResult } from '../../../hooks/useSubscriptionsData';
import { t } from '../../../services/i18n';
import type { ProviderInsight } from '../../../types/Subscription';
import { getProviderBrand } from '../providerBrands';
import { ProviderLogo } from './ProviderLogo';

const formatEuro = (value: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const formatHours = (h: number): string =>
  h >= 10 ? `${Math.round(h)}` : h.toFixed(1).replace('.', ',');

// Schwellen für die €/Stunde-Bewertung (grobe Heuristik für Streaming in DE).
const GREAT_VALUE_PER_HOUR = 1.5;
const OK_VALUE_PER_HOUR = 4;

type Tier = 'great' | 'solid' | 'expensive' | 'unused' | 'noprice';

interface OptimizerRow {
  insight: ProviderInsight;
  tier: Tier;
  /** Sortierwert: klein = guter Wert, groß = schlechter Wert / handeln. */
  rank: number;
}

function tierFor(i: ProviderInsight): Tier {
  if (i.monthlyPrice <= 0) return 'noprice';
  if (i.costPerHour === null || i.monthlyWatchHours <= 0) return 'unused';
  if (i.costPerHour <= GREAT_VALUE_PER_HOUR) return 'great';
  if (i.costPerHour <= OK_VALUE_PER_HOUR) return 'solid';
  return 'expensive';
}

// Höherer rank = schlechterer Wert (steht in der Liste oben, "handeln zuerst").
function rankFor(i: ProviderInsight, tier: Tier): number {
  if (tier === 'unused') return 1_000_000 + i.monthlyPrice; // ungenutzt zuerst, teuerste oben
  if (tier === 'noprice') return -1; // ganz unten (kein Signal)
  return i.costPerHour ?? 0;
}

interface CostOptimizerSectionProps {
  activeInsights: ProviderInsight[];
  unusedThresholdDays: number;
  providerLogos: Record<string, string>;
  updateProvider: UseSubscriptionsDataResult['updateProvider'];
}

export const CostOptimizerSection = ({
  activeInsights,
  unusedThresholdDays,
  providerLogos,
  updateProvider,
}: CostOptimizerSectionProps) => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(true);

  const success = currentTheme.status.success;
  const warning = currentTheme.status.warning;
  const danger = currentTheme.status.error || warning;
  const muted = currentTheme.text.muted;
  const surface = currentTheme.background.surface;

  // Nur sinnvoll, wenn mindestens ein aktives Abo einen Preis hat.
  const priced = activeInsights.filter((i) => i.monthlyPrice > 0);
  if (priced.length === 0) return null;

  const rows: OptimizerRow[] = activeInsights
    .map((insight) => {
      const tier = tierFor(insight);
      return { insight, tier, rank: rankFor(insight, tier) };
    })
    .sort((a, b) => b.rank - a.rank);

  const actionable = rows.filter((r) => r.tier === 'unused' || r.tier === 'expensive');
  const potentialSavings = actionable.reduce((sum, r) => sum + r.insight.monthlyPrice, 0);

  // Bester Preis-Leistungs-Anbieter (kleinstes €/h) für die Kopfzeile.
  const best = priced
    .filter((i) => i.costPerHour !== null)
    .sort((a, b) => (a.costPerHour as number) - (b.costPerHour as number))[0];

  const tierMeta: Record<Tier, { label: string; color: string }> = {
    great: { label: t('Top-Wert'), color: success },
    solid: { label: t('Solide'), color: currentTheme.primary },
    expensive: { label: t('Teuer/Std.'), color: warning },
    unused: { label: t('Ungenutzt'), color: danger },
    noprice: { label: t('Preis fehlt'), color: muted },
  };

  return (
    <div className="sub-section sub-opt">
      <button
        type="button"
        className="sub-section-head sub-opt-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
          <Bolt style={{ fontSize: 18, color: currentTheme.accent || currentTheme.primary }} />
          {t('Kosten-Optimizer')}
        </h2>
        <span className="sub-opt-toggle-right">
          <span className="sub-section-count" style={{ color: muted }}>
            {t('letzte {n} Tage', { n: unusedThresholdDays })}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-flex', color: muted }}
          >
            <ExpandMore style={{ fontSize: 20 }} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sub-opt-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Kopf-Kacheln: Sparpotenzial + bester Wert */}
            <div className="sub-opt-summary">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sub-opt-tile"
                style={{
                  background:
                    potentialSavings > 0
                      ? `linear-gradient(135deg, ${warning}26, ${surface})`
                      : `linear-gradient(135deg, ${success}1f, ${surface})`,
                  borderColor: potentialSavings > 0 ? `${warning}55` : `${success}40`,
                }}
              >
                <p className="sub-opt-tile-label" style={{ color: muted }}>
                  <TrendingDown style={{ fontSize: 15 }} /> {t('Sparpotenzial')}
                </p>
                <p
                  className="sub-opt-tile-value"
                  style={{ color: potentialSavings > 0 ? warning : success }}
                >
                  {formatEuro(potentialSavings)}
                  <span className="sub-opt-tile-unit"> {t('/ Monat')}</span>
                </p>
                <p className="sub-opt-tile-sub" style={{ color: currentTheme.text.secondary }}>
                  {actionable.length === 0
                    ? t('Deine Abos sind gut ausgelastet 🎉')
                    : actionable.length === 1
                      ? t('1 Abo mit schwachem Wert')
                      : t('{n} Abos mit schwachem Wert', { n: actionable.length })}
                </p>
              </motion.div>

              {best && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="sub-opt-tile"
                  style={{
                    background: `linear-gradient(135deg, ${success}1f, ${surface})`,
                    borderColor: `${success}40`,
                  }}
                >
                  <p className="sub-opt-tile-label" style={{ color: muted }}>
                    <TrendingUp style={{ fontSize: 15 }} /> {t('Bester Wert')}
                  </p>
                  <p className="sub-opt-tile-value" style={{ color: success }}>
                    {formatEuro(best.costPerHour as number)}
                    <span className="sub-opt-tile-unit"> {t('/ Std.')}</span>
                  </p>
                  <p className="sub-opt-tile-sub" style={{ color: currentTheme.text.secondary }}>
                    {best.name}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Ranking-Liste */}
            <div className="sub-opt-list">
              {rows.map(({ insight, tier }) => {
                const meta = tierMeta[tier];
                const canPause = tier === 'unused' || tier === 'expensive';
                return (
                  <div
                    key={insight.name}
                    className="sub-opt-row"
                    style={{ borderColor: `${meta.color}33` }}
                  >
                    <ProviderLogo
                      brand={getProviderBrand(insight.name)}
                      name={insight.name}
                      logoPath={providerLogos[insight.name]}
                      size="md"
                    />

                    <div className="sub-opt-row-main">
                      <div className="sub-opt-row-top">
                        <span
                          className="sub-opt-row-name"
                          style={{ color: currentTheme.text.primary }}
                        >
                          {insight.name}
                        </span>
                        <span
                          className="sub-opt-badge"
                          style={{ background: `${meta.color}22`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="sub-opt-row-meta" style={{ color: muted }}>
                        {tier === 'noprice' ? (
                          t('Trage den Monatspreis ein, um den Wert zu sehen')
                        ) : tier === 'unused' ? (
                          t('Im Zeitraum nicht geschaut · {amount}/Monat', {
                            amount: formatEuro(insight.monthlyPrice),
                          })
                        ) : (
                          <>
                            {t('{h} Std./Monat', { h: formatHours(insight.monthlyWatchHours) })} ·{' '}
                            <strong style={{ color: meta.color }}>
                              {t('{amount}/Std.', {
                                amount: formatEuro(insight.costPerHour as number),
                              })}
                            </strong>
                          </>
                        )}
                      </p>
                    </div>

                    {canPause && (
                      <button
                        type="button"
                        className="sub-opt-pause"
                        style={{ borderColor: `${meta.color}66`, color: meta.color }}
                        onClick={() => updateProvider(insight.name, { active: false })}
                      >
                        {t('Pausieren')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
