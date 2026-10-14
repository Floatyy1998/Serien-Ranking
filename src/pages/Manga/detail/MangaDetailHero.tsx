import { Add, CheckCircle, LibraryAdd, OpenInNew, Remove, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { BackButton } from '../../../components/ui';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { mangaSourceLink } from '../../../lib/manga/mangaSource';
import type { MangaUnit } from '../../../lib/manga/progress';
import { tapScale } from '../../../lib/motion';
import { dateLocale, t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Manga } from '../../../types/Manga';
import { FORMAT_COLORS, isOngoingPublication, STATUS_COLORS, STATUS_LABELS } from '../mangaUtils';
import type { MangaHeroData } from './mangaDetailData';

export interface MangaHeroProgress {
  manga: Manga;
  /** Zählweise des Stands: Kapitel oder Bände. */
  unit: MangaUnit;
  value: number;
  total: number | null;
  progress: number;
  userRating: number;
  nextChapterDate?: string | null;
  onValueChange: (next: number) => void;
  onUnitChange: (unit: MangaUnit) => void;
  onRate: () => void;
}

interface MangaDetailHeroProps {
  data: MangaHeroData;
  currentTheme: ThemeContextType['currentTheme'];
  isMobile: boolean;
  owned?: MangaHeroProgress;
  adding?: boolean;
  onAdd?: () => void;
}

const RING = 76;
const STROKE = 6;

const ProgressRing = ({ percent }: { percent: number }) => {
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="mdh-ring">
      <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden>
        <defs>
          <linearGradient id="mdh-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--theme-primary)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--theme-accent)' }} />
          </linearGradient>
        </defs>
        <circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={STROKE}
        />
        <circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          fill="none"
          stroke="url(#mdh-ring-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(percent, 100) / 100)}
          style={{ transition: 'stroke-dashoffset 0.6s var(--ease-out)' }}
        />
      </svg>
      <span className="mdh-ring-value">{Math.round(percent)}%</span>
    </div>
  );
};

const unitText = (unit: MangaUnit) =>
  unit === 'volume'
    ? {
        back: t('Einen Band zurück'),
        forward: t('Einen Band weiter'),
        current: t('Aktueller Band'),
        next: (n: number) => t('Band {n} gelesen', { n }),
      }
    : {
        back: t('Ein Kapitel zurück'),
        forward: t('Ein Kapitel weiter'),
        current: t('Aktuelles Kapitel'),
        next: (n: number) => t('Kapitel {n} gelesen', { n }),
      };

const UnitSwitch = ({ unit, onUnitChange }: Pick<MangaHeroProgress, 'unit' | 'onUnitChange'>) => (
  <div className="mdh-unit" role="group" aria-label={t('Zählweise')}>
    {(
      [
        ['chapter', t('Kapitel')],
        ['volume', t('Bände')],
      ] as const
    ).map(([value, label]) => (
      <button
        key={value}
        type="button"
        className={`mdh-unit-btn ${unit === value ? 'mdh-unit-btn--active' : ''}`}
        aria-pressed={unit === value}
        onClick={() => unit !== value && onUnitChange(value)}
      >
        {label}
      </button>
    ))}
  </div>
);

const Stepper = ({
  unit,
  value,
  total,
  onValueChange,
  onUnitChange,
}: Pick<MangaHeroProgress, 'unit' | 'value' | 'total' | 'onValueChange' | 'onUnitChange'>) => {
  const text = unitText(unit);
  return (
    <div className="mdh-stepper">
      <button
        type="button"
        onClick={() => onValueChange(value - 1)}
        className="mdh-step-btn"
        aria-label={text.back}
        disabled={value <= 0}
      >
        <Remove style={{ fontSize: 20 }} />
      </button>
      <div className="mdh-step-value">
        <UnitSwitch unit={unit} onUnitChange={onUnitChange} />
        <div className="mdh-step-num">
          <input
            type="text"
            inputMode="numeric"
            aria-label={text.current}
            defaultValue={value}
            key={`${unit}-${value}`}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 0) {
                const clamped = total ? Math.min(v, total) : v;
                if (clamped !== value) onValueChange(clamped);
                e.target.value = String(clamped);
              } else {
                e.target.value = String(value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="mdh-step-input manga-hero-chapter-input"
            style={{ width: `${Math.max(String(value).length, 1) * 0.68 + 0.4}em` }}
          />
          {total ? <span className="mdh-step-total">/ {total}</span> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onValueChange(value + 1)}
        className="mdh-step-btn"
        aria-label={text.forward}
        disabled={!!total && value >= total}
      >
        <Add style={{ fontSize: 20 }} />
      </button>
    </div>
  );
};

export const MangaDetailHero = ({
  data,
  currentTheme,
  isMobile,
  owned,
  adding,
  onAdd,
}: MangaDetailHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const ctaText = getOptimalTextColor(currentTheme.primary);
  const formatColor = FORMAT_COLORS[data.formatKey];
  const metaParts = [
    data.chapters ? t('{n} Kapitel', { n: data.chapters }) : '',
    data.volumes ? t('{n} Bände', { n: data.volumes }) : '',
    data.year ? String(data.year) : '',
    data.authors.join(' & '),
  ].filter(Boolean);

  const caughtUp = !!owned?.total && owned.value >= owned.total;
  const unread = owned?.total ? Math.max(0, owned.total - owned.value) : null;
  const nextLabel =
    owned?.unit === 'chapter' &&
    owned.nextChapterDate &&
    new Date(owned.nextChapterDate) > new Date()
      ? new Date(owned.nextChapterDate).toLocaleDateString(dateLocale(), {
          day: 'numeric',
          month: 'short',
        })
      : null;

  const primaryCta = owned ? (
    <motion.button
      type="button"
      whileTap={tapScale}
      className="mdh-cta"
      disabled={caughtUp}
      onClick={() => owned.onValueChange(owned.value + 1)}
      style={{
        background: caughtUp
          ? 'var(--glass-medium)'
          : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
        color: caughtUp ? currentTheme.text.secondary : ctaText,
      }}
    >
      {caughtUp ? <CheckCircle style={{ fontSize: 20 }} /> : <Add style={{ fontSize: 20 }} />}
      {caughtUp
        ? isOngoingPublication(owned.manga.status)
          ? t('Auf dem neuesten Stand')
          : t('Alles gelesen')
        : unitText(owned.unit).next(owned.value + 1)}
    </motion.button>
  ) : (
    <motion.button
      type="button"
      whileTap={tapScale}
      className="mdh-cta"
      disabled={adding}
      onClick={onAdd}
      style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
        color: ctaText,
      }}
    >
      <LibraryAdd style={{ fontSize: 20 }} />
      {adding ? t('Wird hinzugefügt …') : t('Zur Sammlung hinzufügen')}
    </motion.button>
  );

  return (
    <section className={`mdh ${isMobile ? 'mdh--mobile' : ''}`}>
      <div
        className={`mdh-bg ${data.banner && !isMobile ? '' : 'mdh-bg--blur'}`}
        style={{
          backgroundImage: `url(${(!isMobile && data.banner) || data.poster})`,
        }}
      />
      <div className="mdh-scrim" />

      <div className="mdh-back">
        <BackButton
          style={{
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
          }}
        />
      </div>

      <div className="mdh-inner">
        <img
          className="mdh-poster"
          src={data.poster}
          alt={data.title}
          style={{ viewTransitionName: `poster-manga-${data.anilistId}` }}
        />

        <div className="mdh-info">
          <div className="mdh-kicker">
            <span className="mdh-chip" style={{ color: formatColor }}>
              {data.formatLabel}
            </span>
            {data.statusLabel && <span className="mdh-chip">{data.statusLabel}</span>}
            {owned && (
              <span className="mdh-chip" style={{ color: STATUS_COLORS[owned.manga.readStatus] }}>
                <span className="mdh-chip-dot" />
                {STATUS_LABELS[owned.manga.readStatus]}
              </span>
            )}
            {data.score ? (
              <span className="mdh-chip mdh-chip--score">
                <Star style={{ fontSize: 13 }} />
                {(data.score / 10).toFixed(1)}
              </span>
            ) : null}
          </div>

          <h1 className="mdh-title">{data.title}</h1>
          {data.altTitle && <div className="mdh-alt">{data.altTitle}</div>}
          {metaParts.length > 0 && <div className="mdh-meta">{metaParts.join(' · ')}</div>}
          {data.genres.length > 0 && (
            <div className="mdh-genres">
              {data.genres.slice(0, isMobile ? 4 : 6).map((g) => (
                <span key={g} className="mdh-genre">
                  {g}
                </span>
              ))}
            </div>
          )}

          {!isMobile && data.description && (
            <div className="mdh-desc-wrap">
              <p className={`mdh-desc ${expanded ? 'mdh-desc--open' : ''}`}>{data.description}</p>
              {data.description.length > 260 && (
                <button
                  type="button"
                  className="mdh-desc-toggle"
                  onClick={() => setExpanded((v) => !v)}
                  style={{ color: currentTheme.primary }}
                >
                  {expanded ? t('Weniger') : t('Mehr lesen')}
                </button>
              )}
            </div>
          )}

          {owned && (
            <div className="mdh-band liquid-glass">
              <ProgressRing percent={owned.progress} />
              <Stepper
                unit={owned.unit}
                value={owned.value}
                total={owned.total}
                onValueChange={owned.onValueChange}
                onUnitChange={owned.onUnitChange}
              />
              <div className="mdh-pods">
                {unread !== null && (
                  <div className="mdh-pod">
                    <span className="mdh-pod-value">{unread}</span>
                    <span className="mdh-pod-label">{t('Offen')}</span>
                  </div>
                )}
                {nextLabel && (
                  <div className="mdh-pod">
                    <span className="mdh-pod-value">~{nextLabel}</span>
                    <span className="mdh-pod-label">{t('Nächstes Kap.')}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="mdh-pod mdh-pod--btn"
                  onClick={owned.onRate}
                  aria-label={t('Bewerten')}
                >
                  <span className="mdh-pod-value" style={{ color: '#fbbf24' }}>
                    {owned.userRating > 0 ? `${owned.userRating}/10` : '–'}
                  </span>
                  <span className="mdh-pod-label">{t('Deine Wertung')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="mdh-actions">
            {primaryCta}
            <a
              href={mangaSourceLink(data.anilistId).url}
              target="_blank"
              rel="noopener noreferrer"
              className="mdh-ghost-btn"
            >
              {mangaSourceLink(data.anilistId).label}
              <OpenInNew style={{ fontSize: 15, opacity: 0.6 }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
