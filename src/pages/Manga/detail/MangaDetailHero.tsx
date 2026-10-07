import { Add, CheckCircle, LibraryAdd, OpenInNew, Remove, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { BackButton } from '../../../components/ui';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { tapScale } from '../../../lib/motion';
import { dateLocale, t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Manga } from '../../../types/Manga';
import { FORMAT_COLORS, isOngoingPublication, STATUS_COLORS, STATUS_LABELS } from '../mangaUtils';
import type { MangaHeroData } from './mangaDetailData';

export interface MangaHeroProgress {
  manga: Manga;
  editChapter: number;
  effectiveChapters: number | null;
  progress: number;
  userRating: number;
  nextChapterDate?: string | null;
  onChapterChange: (next: number) => void;
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

const ChapterStepper = ({
  editChapter,
  effectiveChapters,
  onChapterChange,
}: Pick<MangaHeroProgress, 'editChapter' | 'effectiveChapters' | 'onChapterChange'>) => (
  <div className="mdh-stepper">
    <button
      type="button"
      onClick={() => onChapterChange(editChapter - 1)}
      className="mdh-step-btn"
      aria-label={t('Ein Kapitel zurück')}
      disabled={editChapter <= 0}
    >
      <Remove style={{ fontSize: 20 }} />
    </button>
    <div className="mdh-step-value">
      <span className="mdh-step-caption">{t('Kapitel')}</span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={t('Aktuelles Kapitel')}
        defaultValue={editChapter}
        key={editChapter}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 0) {
            const clamped = effectiveChapters ? Math.min(v, effectiveChapters) : v;
            if (clamped !== editChapter) onChapterChange(clamped);
            e.target.value = String(clamped);
          } else {
            e.target.value = String(editChapter);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="mdh-step-input manga-hero-chapter-input"
        style={{ width: `${Math.max(String(editChapter).length, 1) * 0.68 + 0.4}em` }}
      />
      {effectiveChapters ? <span className="mdh-step-total">/ {effectiveChapters}</span> : null}
    </div>
    <button
      type="button"
      onClick={() => onChapterChange(editChapter + 1)}
      className="mdh-step-btn"
      aria-label={t('Ein Kapitel weiter')}
      disabled={!!effectiveChapters && editChapter >= effectiveChapters}
    >
      <Add style={{ fontSize: 20 }} />
    </button>
  </div>
);

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

  const caughtUp = !!owned?.effectiveChapters && owned.editChapter >= owned.effectiveChapters;
  const unread = owned?.effectiveChapters
    ? Math.max(0, owned.effectiveChapters - owned.editChapter)
    : null;
  const nextLabel =
    owned?.nextChapterDate && new Date(owned.nextChapterDate) > new Date()
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
      onClick={() => owned.onChapterChange(owned.editChapter + 1)}
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
        : t('Kapitel {n} gelesen', { n: owned.editChapter + 1 })}
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
              <ChapterStepper
                editChapter={owned.editChapter}
                effectiveChapters={owned.effectiveChapters}
                onChapterChange={owned.onChapterChange}
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
              href={`https://anilist.co/manga/${data.anilistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mdh-ghost-btn"
            >
              AniList
              <OpenInNew style={{ fontSize: 15, opacity: 0.6 }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
