import {
  CheckCircleOutline,
  ExpandLess,
  ExpandMore,
  NotificationsActive,
  NotificationsNone,
  Warning,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import type { UseSubscriptionsDataResult } from '../../../hooks/useSubscriptionsData';
import type { ProviderInsight } from '../../../types/Subscription';
import { getProviderBrand } from '../providerBrands';
import { ProviderLogo } from './ProviderLogo';

const formatLastWatched = (insight: ProviderInsight, thresholdDays: number): string => {
  if (insight.daysSinceLastWatch === null) return `seit ${thresholdDays}+ Tagen nichts geschaut`;
  if (insight.daysSinceLastWatch === 0) return 'heute geschaut';
  if (insight.daysSinceLastWatch === 1) return 'gestern geschaut';
  return `vor ${insight.daysSinceLastWatch} Tagen geschaut`;
};

const formatDateShort = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

interface ActiveSubscriptionCardProps {
  insight: ProviderInsight;
  logoPath?: string;
  unusedThresholdDays: number;
  /** Alle aktiven Insights — für die "verschieben"-Ziele im Diagnose-Menü. */
  activeInsights: ProviderInsight[];
  expanded: boolean;
  onToggleExpand: () => void;
  /** seriesId, für die das Verschieben-Menü gerade offen ist (Seiten-State). */
  moveMenuFor: number | null;
  onMoveMenuChange: (seriesId: number | null) => void;
  seriesOverrides: UseSubscriptionsDataResult['seriesOverrides'];
  updateProvider: UseSubscriptionsDataResult['updateProvider'];
  setSeriesOverride: UseSubscriptionsDataResult['setSeriesOverride'];
}

/** Karte eines aktiven Abos: Preis, Ungenutzt-Warnung, Toggle und aufklappbare Diagnose-Liste. */
export const ActiveSubscriptionCard = ({
  insight,
  logoPath,
  unusedThresholdDays,
  activeInsights,
  expanded,
  onToggleExpand,
  moveMenuFor,
  onMoveMenuChange,
  seriesOverrides,
  updateProvider,
  setSeriesOverride,
}: ActiveSubscriptionCardProps) => {
  const { currentTheme } = useTheme();

  const warning = currentTheme.status.warning;
  const surface = currentTheme.background.surface;
  const muted = currentTheme.text.muted;

  const brand = getProviderBrand(insight.name);
  const showUnusedWarning = insight.cancelIfUnused && insight.isUnused;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sub-active-card${showUnusedWarning ? ' sub-active-card--unused' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${brand.color}1f, ${surface})`,
        borderColor: showUnusedWarning ? warning : `${brand.color}40`,
        color: currentTheme.text.primary,
      }}
    >
      <div className="sub-active-glow" style={{ background: brand.color }} />

      <div className="sub-active-row">
        <ProviderLogo brand={brand} logoPath={logoPath} name={insight.name} size="lg" />
        <div className="sub-name-block">
          <p className="sub-name">{insight.name}</p>
          <p
            className={`sub-meta${showUnusedWarning ? ' sub-meta--warn' : ''}`}
            style={{
              color: showUnusedWarning ? warning : currentTheme.text.secondary,
            }}
          >
            {showUnusedWarning ? (
              <Warning className="sub-meta-icon" />
            ) : (
              <CheckCircleOutline className="sub-meta-icon" />
            )}
            <span>
              {insight.lastWatchTitle ? `${insight.lastWatchTitle} · ` : ''}
              {formatLastWatched(insight, unusedThresholdDays)}
              {insight.recentCount > 0 &&
                ` · ${insight.recentCount} Aufruf${insight.recentCount === 1 ? '' : 'e'}`}
            </span>
          </p>
        </div>

        <div
          className="sub-price-pill"
          style={{
            borderColor: `${brand.color}40`,
            color: currentTheme.text.primary,
          }}
        >
          <span style={{ fontSize: 12, color: muted, marginRight: 2 }}>€</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            defaultValue={insight.monthlyPrice > 0 ? insight.monthlyPrice.toFixed(2) : ''}
            onBlur={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'));
              updateProvider(insight.name, {
                monthlyPrice: Number.isNaN(v) ? 0 : v,
              });
            }}
            className="sub-price-input"
            aria-label={`Monatspreis für ${insight.name}`}
          />
        </div>

        <Tooltip title="Kündigen wenn ungenutzt" arrow>
          <span
            className={`sub-cancel-icon-btn${insight.cancelIfUnused ? ' sub-cancel-icon-btn--on' : ''}`}
            style={{
              color: insight.cancelIfUnused ? warning : muted,
              borderColor: insight.cancelIfUnused ? `${warning}55` : undefined,
            }}
            role="button"
            tabIndex={0}
            aria-pressed={insight.cancelIfUnused}
            aria-label="Kündigen wenn ungenutzt umschalten"
            onClick={() =>
              updateProvider(insight.name, {
                cancelIfUnused: !insight.cancelIfUnused,
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                updateProvider(insight.name, {
                  cancelIfUnused: !insight.cancelIfUnused,
                });
              }
            }}
          >
            {insight.cancelIfUnused ? (
              <NotificationsActive style={{ fontSize: 18 }} />
            ) : (
              <NotificationsNone style={{ fontSize: 18 }} />
            )}
          </span>
        </Tooltip>

        <label className="sub-toggle" aria-label={`${insight.name} deaktivieren`}>
          <input
            type="checkbox"
            className="sub-toggle-input"
            checked
            onChange={() => updateProvider(insight.name, { active: false })}
          />
          <span className="sub-toggle-track" style={{ background: brand.color }} />
          <span className="sub-toggle-thumb sub-toggle-thumb--on" />
        </label>

        <button
          type="button"
          className={`sub-expand-btn${expanded ? ' sub-expand-btn--open' : ''}`}
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label="Letzte Aufrufe anzeigen"
        >
          {expanded ? (
            <ExpandLess style={{ fontSize: 20 }} />
          ) : (
            <ExpandMore style={{ fontSize: 20 }} />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="sub-diag"
            style={{
              borderTopColor: `${brand.color}30`,
              color: currentTheme.text.primary,
            }}
          >
            <p className="sub-diag-title" style={{ color: muted }}>
              Zuletzt zugeordnet
            </p>
            {insight.recentWatches.length === 0 ? (
              <p className="sub-diag-empty">
                Keine erfassten Aufrufe – beim Abhaken war vermutlich kein Provider hinterlegt.
              </p>
            ) : (
              <div className="sub-diag-list">
                {insight.recentWatches.map((w, idx) => {
                  const sid = w.seriesId;
                  const hasOverride = sid != null && seriesOverrides[String(sid)] === insight.name;
                  const isMenuOpen = sid != null && moveMenuFor === sid;
                  return (
                    <div key={`${w.timestamp}-${idx}`}>
                      <div className="sub-diag-item">
                        <span className="sub-diag-item-title">{w.title || '(ohne Titel)'}</span>
                        <span className="sub-diag-item-date">{formatDateShort(w.timestamp)}</span>
                        {sid != null && activeInsights.length > 1 && (
                          <button
                            type="button"
                            className="sub-diag-move-btn"
                            onClick={() => onMoveMenuChange(isMenuOpen ? null : sid)}
                            aria-label="Diese Serie einem anderen Anbieter zuordnen"
                          >
                            {hasOverride ? '✓ fest' : 'verschieben'}
                          </button>
                        )}
                      </div>
                      {isMenuOpen && sid != null && (
                        <div className="sub-diag-move-menu">
                          {activeInsights
                            .filter((p) => p.name !== insight.name)
                            .map((target) => {
                              const tBrand = getProviderBrand(target.name);
                              return (
                                <button
                                  key={target.name}
                                  type="button"
                                  className="sub-diag-move-chip"
                                  style={{ borderColor: `${tBrand.color}66` }}
                                  onClick={() => {
                                    setSeriesOverride(sid, target.name);
                                    onMoveMenuChange(null);
                                  }}
                                >
                                  → {target.name}
                                </button>
                              );
                            })}
                          {hasOverride && (
                            <button
                              type="button"
                              className="sub-diag-move-chip sub-diag-move-chip--clear"
                              onClick={() => {
                                setSeriesOverride(sid, null);
                                onMoveMenuChange(null);
                              }}
                            >
                              Auto-Zuordnung
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
