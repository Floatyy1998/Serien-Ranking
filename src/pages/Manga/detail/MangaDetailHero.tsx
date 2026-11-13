import { Add, CheckCircle, LibraryAdd, OpenInNew, Remove } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ShareTitleButton } from '../../../components/share/ShareTitleButton';
import {
  DetailStage,
  ProgressStrip,
  ScoreRow,
  type ScoreItem,
} from '../../../components/detail/kit/DetailKit';
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
  /** Reihe hat Bände (gedruckte Ausgabe) — nur dann gibt es den Bände-Schalter. */
  canCountVolumes: boolean;
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
  canCountVolumes,
  onValueChange,
  onUnitChange,
}: Pick<
  MangaHeroProgress,
  'unit' | 'value' | 'total' | 'canCountVolumes' | 'onValueChange' | 'onUnitChange'
>) => {
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
        {canCountVolumes ? (
          <UnitSwitch unit={unit} onUnitChange={onUnitChange} />
        ) : (
          <span className="mdh-step-caption">{t('Kapitel')}</span>
        )}
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
      className={`dk-cta${caughtUp ? ' dk-cta--quiet' : ''}`}
      disabled={caughtUp}
      onClick={() => owned.onValueChange(owned.value + 1)}
      style={{
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
      className="dk-cta"
      disabled={adding}
      onClick={onAdd}
      style={{
        color: ctaText,
      }}
    >
      <LibraryAdd style={{ fontSize: 20 }} />
      {adding ? t('Wird hinzugefügt …') : t('Zur Sammlung hinzufügen')}
    </motion.button>
  );

  const sourceLink = mangaSourceLink(data.anilistId);
  const scores: ScoreItem[] = [
    ...(owned
      ? [
          {
            key: 'own',
            label: t('Deine Wertung'),
            value: owned.userRating > 0 ? String(owned.userRating) : '–',
            tone: currentTheme.accent,
            own: true,
            onClick: owned.onRate,
            ariaLabel: t('Bewerten'),
          },
        ]
      : []),
    ...(data.score
      ? [
          {
            key: 'anilist',
            label: 'AniList',
            value: (data.score / 10).toFixed(1),
            tone: '#02a9ff',
            href: sourceLink.url,
          },
        ]
      : []),
    ...(owned && unread !== null
      ? [{ key: 'open', label: t('Offen'), value: String(unread), tone: currentTheme.primary }]
      : []),
    ...(nextLabel
      ? [
          {
            key: 'next',
            label: t('Nächstes Kap.'),
            value: `~${nextLabel}`,
            tone: currentTheme.primary,
          },
        ]
      : []),
  ];

  const genreChips = data.genres.length > 0 && (
    <div className="dk-genres">
      {data.genres.slice(0, isMobile ? 4 : 6).map((g) => (
        <span key={g} className="dk-genre">
          {g}
        </span>
      ))}
    </div>
  );

  return (
    <div className="dk">
      <DetailStage
        art={data.banner || undefined}
        wash={data.poster}
        navEnd={<ShareTitleButton path={`/manga/${data.anilistId}`} title={data.title} />}
        poster={
          <img
            src={data.poster}
            alt={data.title}
            style={{ viewTransitionName: `poster-manga-${data.anilistId}` }}
          />
        }
        below={
          <>
            {isMobile && genreChips}

            <ScoreRow items={scores} />

            {owned && !!owned.total && (
              <ProgressStrip segments={[{ key: 'all', done: owned.value, total: owned.total }]}>
                <strong>{Math.round(owned.progress)}%</strong>
                {' · '}
                {owned.unit === 'volume'
                  ? t('{done} von {total} Bänden', { done: owned.value, total: owned.total })
                  : t('{done} von {total} Kapiteln', { done: owned.value, total: owned.total })}
              </ProgressStrip>
            )}

            <div className="dk-cta-row">
              {owned && (
                <Stepper
                  unit={owned.unit}
                  value={owned.value}
                  total={owned.total}
                  canCountVolumes={owned.canCountVolumes}
                  onValueChange={owned.onValueChange}
                  onUnitChange={owned.onUnitChange}
                />
              )}
              {primaryCta}
              {!isMobile && (
                <a
                  href={sourceLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dk-action mdh-source"
                >
                  {sourceLink.label}
                  <OpenInNew style={{ fontSize: 15, opacity: 0.6 }} />
                </a>
              )}
            </div>
          </>
        }
      >
        <div className="dk-kicker">
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
        </div>

        <h1 className="dk-title">{data.title}</h1>
        {data.altTitle && <div className="dk-subtitle">{data.altTitle}</div>}
        {metaParts.length > 0 && (
          <div className="dk-meta">
            {metaParts.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </div>
        )}

        {!isMobile && genreChips}

        {!isMobile && data.description && (
          <div className="mdh-desc-wrap">
            <p className={`dk-overview mdh-desc ${expanded ? 'mdh-desc--open' : ''}`}>
              {data.description}
            </p>
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
      </DetailStage>
    </div>
  );
};
