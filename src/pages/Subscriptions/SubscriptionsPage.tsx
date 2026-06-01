import {
  Add,
  CheckCircleOutline,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  NotificationsActive,
  NotificationsNone,
  Subscriptions as SubscriptionsIcon,
  Warning,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { tmdbLogoUrl, useProviderLogos } from '../../hooks/useProviderLogos';
import { useSubscriptionsData } from '../../hooks/useSubscriptionsData';
import type { ProviderInsight } from '../../types/Subscription';
import { getProviderBrand, type ProviderBrand } from './providerBrands';
import './SubscriptionsPage.css';

const formatEuro = (value: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const formatLastWatched = (insight: ProviderInsight, thresholdDays: number): string => {
  if (insight.daysSinceLastWatch === null) return `seit ${thresholdDays}+ Tagen nichts geschaut`;
  if (insight.daysSinceLastWatch === 0) return 'heute geschaut';
  if (insight.daysSinceLastWatch === 1) return 'gestern geschaut';
  return `vor ${insight.daysSinceLastWatch} Tagen geschaut`;
};

const ProviderLogo: React.FC<{
  brand: ProviderBrand;
  logoPath?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}> = ({ brand, logoPath, name, size = 'md', dimmed = false }) => {
  const logoUrl = tmdbLogoUrl(logoPath, size === 'sm' ? 'w45' : 'w92');
  return (
    <div
      className={`sub-logo${size === 'lg' ? ' sub-logo--lg' : ''}${
        size === 'sm' ? ' sub-logo--sm' : ''
      }`}
      style={{
        background: logoUrl
          ? '#0f1422'
          : dimmed
            ? `linear-gradient(135deg, ${brand.color}55, ${brand.accent ?? brand.color}55)`
            : `linear-gradient(135deg, ${brand.color}, ${brand.accent ?? brand.color})`,
        opacity: dimmed ? 0.6 : 1,
      }}
      aria-hidden
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} loading="lazy" decoding="async" />
      ) : (
        <span>{brand.abbr}</span>
      )}
    </div>
  );
};

const formatDateShort = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const SubscriptionsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const providerLogos = useProviderLogos();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [moveMenuFor, setMoveMenuFor] = useState<number | null>(null);
  const {
    loading,
    insights,
    activeInsights,
    unusedInsights,
    totalMonthlySpend,
    wastedMonthlySpend,
    watchlistGaps,
    unusedThresholdDays,
    setUnusedThreshold,
    updateProvider,
    setSeriesOverride,
    seriesOverrides,
  } = useSubscriptionsData();

  const accent = currentTheme.accent || currentTheme.primary;
  const warning = currentTheme.status.warning;
  const success = currentTheme.status.success;
  const surface = currentTheme.background.surface;
  const border = currentTheme.border.default;
  const muted = currentTheme.text.muted;

  const inactiveInsights = insights.filter((i) => !i.active);

  return (
    <PageLayout>
      <div
        className="sub-page-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${accent}1f, transparent)
          `,
        }}
      />

      <PageHeader
        title="Streaming-Abos"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
        icon={<SubscriptionsIcon style={{ fontSize: 26, color: accent }} />}
      />

      <div className="sub-content">
        {/* Insights */}
        <div className="sub-insights">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="sub-insight-card"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}28, ${surface})`,
              borderColor: `${currentTheme.primary}40`,
              color: currentTheme.text.primary,
            }}
          >
            <p className="sub-insight-label" style={{ color: muted }}>
              Aktive Abos
            </p>
            <p className="sub-insight-value">{activeInsights.length}</p>
            <p className="sub-insight-sub" style={{ color: currentTheme.text.secondary }}>
              {formatEuro(totalMonthlySpend)} pro Monat
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="sub-insight-card"
            style={{
              background:
                wastedMonthlySpend > 0
                  ? `linear-gradient(135deg, ${warning}30, ${surface})`
                  : `linear-gradient(135deg, ${success}20, ${surface})`,
              borderColor: wastedMonthlySpend > 0 ? `${warning}55` : `${success}40`,
              color: currentTheme.text.primary,
            }}
          >
            <p className="sub-insight-label" style={{ color: muted }}>
              Ungenutzt / Monat
            </p>
            <p
              className="sub-insight-value"
              style={{ color: wastedMonthlySpend > 0 ? warning : success }}
            >
              {formatEuro(wastedMonthlySpend)}
            </p>
            <p className="sub-insight-sub" style={{ color: currentTheme.text.secondary }}>
              {unusedInsights.length === 0
                ? 'Alles wird genutzt 🎉'
                : `${unusedInsights.length} Abo${unusedInsights.length === 1 ? '' : 's'} schläft`}
            </p>
          </motion.div>

          {unusedInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sub-insight-card sub-insight-card--full"
              style={{
                background: `linear-gradient(135deg, ${warning}22, ${surface})`,
                borderColor: `${warning}55`,
                color: currentTheme.text.primary,
              }}
            >
              <p
                className="sub-insight-label"
                style={{ color: warning, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ErrorOutline style={{ fontSize: 16 }} />
                Vorschlag
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: currentTheme.text.primary,
                  margin: '8px 0 0 0',
                  lineHeight: 1.5,
                }}
              >
                Du zahlst aktuell{' '}
                <strong style={{ color: warning }}>{formatEuro(wastedMonthlySpend)}</strong> pro
                Monat für Anbieter, die du seit über <strong>{unusedThresholdDays} Tagen</strong>{' '}
                nicht genutzt hast: {unusedInsights.map((i) => i.name).join(', ')}.
              </p>
            </motion.div>
          )}
        </div>

        {/* Threshold */}
        <div
          className="sub-threshold-row"
          style={{
            background: surface,
            borderColor: border,
            color: currentTheme.text.primary,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Schwellenwert</p>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: muted }}>
              Abo gilt als ungenutzt nach
            </p>
          </div>
          <input
            type="number"
            min={7}
            max={365}
            value={unusedThresholdDays}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) setUnusedThreshold(v);
            }}
            className="sub-threshold-input"
            style={{ color: currentTheme.text.primary, borderColor: border }}
          />
          <span style={{ fontSize: 13, color: muted }}>Tagen</span>
        </div>

        {/* Active subscriptions */}
        <div className="sub-section">
          <div className="sub-section-head">
            <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
              Deine Abos
            </h2>
            <span className="sub-section-count" style={{ color: muted }}>
              {activeInsights.length} aktiv
            </span>
          </div>

          {loading && (
            <p className="sub-loading" style={{ color: muted }}>
              Wird geladen …
            </p>
          )}

          {!loading && activeInsights.length === 0 && (
            <div className="sub-empty" style={{ borderColor: border, color: muted }}>
              Noch keine Abos markiert. Wähle unten aus, welche Dienste du gerade hast.
            </div>
          )}

          {!loading && activeInsights.length > 0 && (
            <div className="sub-active-list">
              {activeInsights.map((insight) => {
                const brand = getProviderBrand(insight.name);
                const showUnusedWarning = insight.cancelIfUnused && insight.isUnused;
                return (
                  <motion.div
                    key={insight.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`sub-active-card${
                      showUnusedWarning ? ' sub-active-card--unused' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${brand.color}1f, ${surface})`,
                      borderColor: showUnusedWarning ? warning : `${brand.color}40`,
                      color: currentTheme.text.primary,
                    }}
                  >
                    <div className="sub-active-glow" style={{ background: brand.color }} />

                    <div className="sub-active-row">
                      <ProviderLogo
                        brand={brand}
                        logoPath={providerLogos[insight.name]}
                        name={insight.name}
                        size="lg"
                      />
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
                              ` · ${insight.recentCount} Aufruf${
                                insight.recentCount === 1 ? '' : 'e'
                              }`}
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
                          defaultValue={
                            insight.monthlyPrice > 0 ? insight.monthlyPrice.toFixed(2) : ''
                          }
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
                          className={`sub-cancel-icon-btn${
                            insight.cancelIfUnused ? ' sub-cancel-icon-btn--on' : ''
                          }`}
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
                        className={`sub-expand-btn${
                          expandedProvider === insight.name ? ' sub-expand-btn--open' : ''
                        }`}
                        onClick={() =>
                          setExpandedProvider(
                            expandedProvider === insight.name ? null : insight.name
                          )
                        }
                        aria-expanded={expandedProvider === insight.name}
                        aria-label="Letzte Aufrufe anzeigen"
                      >
                        {expandedProvider === insight.name ? (
                          <ExpandLess style={{ fontSize: 20 }} />
                        ) : (
                          <ExpandMore style={{ fontSize: 20 }} />
                        )}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expandedProvider === insight.name && (
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
                              Keine erfassten Aufrufe – beim Abhaken war vermutlich kein Provider
                              hinterlegt.
                            </p>
                          ) : (
                            <div className="sub-diag-list">
                              {insight.recentWatches.map((w, idx) => {
                                const sid = w.seriesId;
                                const hasOverride =
                                  sid != null && seriesOverrides[String(sid)] === insight.name;
                                const isMenuOpen = sid != null && moveMenuFor === sid;
                                return (
                                  <div key={`${w.timestamp}-${idx}`}>
                                    <div className="sub-diag-item">
                                      <span className="sub-diag-item-title">
                                        {w.title || '(ohne Titel)'}
                                      </span>
                                      <span className="sub-diag-item-date">
                                        {formatDateShort(w.timestamp)}
                                      </span>
                                      {sid != null && activeInsights.length > 1 && (
                                        <button
                                          type="button"
                                          className="sub-diag-move-btn"
                                          onClick={() => setMoveMenuFor(isMenuOpen ? null : sid)}
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
                                                  setMoveMenuFor(null);
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
                                              setMoveMenuFor(null);
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
              })}
            </div>
          )}
        </div>

        {/* Inactive subscriptions */}
        {!loading && inactiveInsights.length > 0 && (
          <div className="sub-section">
            <div className="sub-section-head">
              <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
                Andere Anbieter
              </h2>
              <span className="sub-section-count" style={{ color: muted }}>
                Tippen zum Aktivieren
              </span>
            </div>

            <div className="sub-inactive-grid">
              {inactiveInsights.map((insight) => {
                const brand = getProviderBrand(insight.name);
                return (
                  <motion.button
                    key={insight.name}
                    type="button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => updateProvider(insight.name, { active: true })}
                    className="sub-inactive-card"
                    style={{
                      borderColor: border,
                      color: currentTheme.text.primary,
                    }}
                  >
                    <ProviderLogo
                      brand={brand}
                      logoPath={providerLogos[insight.name]}
                      name={insight.name}
                      size="sm"
                      dimmed
                    />
                    <span className="sub-inactive-name">{insight.name}</span>
                    <Add style={{ fontSize: 18, color: muted, flexShrink: 0 }} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Watchlist gaps */}
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
              {activeInsights.length === 0
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
      </div>
    </PageLayout>
  );
};
