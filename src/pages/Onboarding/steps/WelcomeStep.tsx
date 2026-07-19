import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CoverWall } from '../components/CoverWall';
import { GenreTile } from '../components/GenreTile';
import { LetterReveal } from '../components/LetterReveal';
import { TableOfContents } from '../components/TableOfContents';
import { CURATED_GENRES, type CuratedGenre } from '../genres';
import { getTmdbApiKey, tmdbFetch } from '../../../services/tmdbClient';
import { t } from '../../../services/i18n';

const MAX_GENRES = 4;

/** Schlanke TMDB-Listen-Response (nur `poster_path` wird gelesen). */
type TmdbPosterResponse = { results?: Array<{ poster_path?: string | null }> };

interface Props {
  username: string;
  /** Social-Sign-ups ohne gewählten Namen: Eingabefeld statt statischer Begrüßung. */
  nameEditable?: boolean;
  nameValue?: string;
  onNameChange?: (value: string) => void;
  selectedSlugs: string[];
  onToggleGenre: (slug: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

async function fetchGenrePosters(g: CuratedGenre): Promise<string[]> {
  if (!getTmdbApiKey()) return [];
  try {
    const [tv, mov] = await Promise.all([
      tmdbFetch<TmdbPosterResponse>('discover/tv', {
        with_genres: g.tvId,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      tmdbFetch<TmdbPosterResponse>('discover/movie', {
        with_genres: g.movieId,
        sort_by: 'popularity.desc',
        page: 1,
      }),
    ]);
    const merged: string[] = [];
    const tvL = tv?.results || [];
    const mvL = mov?.results || [];
    for (let i = 0; i < 6 && merged.length < 4; i++) {
      const t = tvL[i]?.poster_path;
      const m = mvL[i]?.poster_path;
      if (t && !merged.includes(t)) merged.push(t);
      if (m && !merged.includes(m)) merged.push(m);
    }
    return merged.slice(0, 4);
  } catch {
    return [];
  }
}

export const WelcomeStep: React.FC<Props> = ({
  username,
  nameEditable,
  nameValue,
  onNameChange,
  selectedSlugs,
  onToggleGenre,
  onNext,
  onSkip,
}) => {
  const [postersBySlug, setPostersBySlug] = useState<Record<string, string[]>>({});
  const nameTooShort = !!nameEditable && (nameValue ?? '').trim().length < 3;

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CURATED_GENRES.map(async (g) => [g.slug, await fetchGenrePosters(g)] as const)
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, string[]> = {};
      for (const [slug, list] of pairs) next[slug] = list;
      setPostersBySlug(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCount = selectedSlugs.length;
  const selectedGenres = CURATED_GENRES.filter((g) => selectedSlugs.includes(g.slug));

  return (
    <motion.div
      className="ob-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <CoverWall tvGenreIds={selectedGenres.map((g) => g.tvId)} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(20px, 5vw, 56px) clamp(20px, 5vw, 56px) 0',
          gap: 'clamp(24px, 4vw, 40px)',
        }}
      >
        {/* Editorial mast head */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.55)' }}>
            {t('01 — Kuration')}
          </span>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
            tv-rank · onboarding
          </span>
        </div>

        {/* Spread: vertical on mobile, magazine 2-col on wide screens */}
        <div className="ob-spread">
          {/* Left column: hero + program */}
          <div className="ob-spread__left">
            <div>
              {nameEditable ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="ob-mono"
                  style={{
                    color: 'var(--ob-text-mute)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <label htmlFor="ob-name">{t('Wie dürfen wir dich nennen?')}</label>
                  <input
                    id="ob-name"
                    className="ob-name-input"
                    value={nameValue ?? ''}
                    onChange={(e) => onNameChange?.(e.target.value)}
                    maxLength={24}
                    placeholder={t('Dein Name')}
                    autoComplete="nickname"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="ob-mono"
                  style={{ color: 'var(--ob-text-mute)', marginBottom: 10 }}
                >
                  {t('Willkommen, {name}.', { name: username })}
                </motion.div>
              )}
              <h1
                className="ob-display"
                style={{
                  fontSize: 'clamp(48px, 9vw, 140px)',
                  margin: 0,
                  color: 'var(--ob-paper)',
                  maxWidth: '14ch',
                }}
              >
                <LetterReveal text={t('Was läuft')} delay={0.18} stagger={0.04} />
                <br />
                <span
                  style={{
                    fontVariationSettings: "'opsz' 144, 'SOFT' 0",
                    fontStyle: 'normal',
                    fontWeight: 900,
                  }}
                >
                  <LetterReveal text={t('bei dir?')} delay={0.55} stagger={0.04} />
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="ob-mono"
                style={{
                  color: 'var(--ob-text-mute)',
                  marginTop: 14,
                  fontSize: 12,
                }}
              >
                {t('wähle bis zu {max} richtungen', { max: MAX_GENRES })} · {selectedCount}/
                {MAX_GENRES}
              </motion.p>
            </div>

            <div className="ob-welcome-side">
              <div className="ob-side-label">
                <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                  {t('Programm')}
                </span>
                <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', opacity: 0.5 }}>
                  {t('4 Akte')}
                </span>
              </div>
              <TableOfContents currentStep="welcome" variant="horizontal" delay={1.1} />
            </div>
          </div>

          {/* Right column: tiles */}
          <div className="ob-spread__right">
            <div className="ob-welcome-grid">
              {CURATED_GENRES.map((g, i) => {
                const selected = selectedSlugs.includes(g.slug);
                const isDisabled = !selected && selectedCount >= MAX_GENRES;
                return (
                  <motion.div
                    key={g.slug}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 1.2 + i * 0.05,
                      duration: 0.5,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    style={{
                      opacity: isDisabled ? 0.3 : 1,
                      pointerEvents: isDisabled ? 'none' : 'auto',
                    }}
                  >
                    <GenreTile
                      label={t(g.label)}
                      index={i}
                      posters={postersBySlug[g.slug] || []}
                      selected={selected}
                      onToggle={() => onToggleGenre(g.slug)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        style={{
          position: 'relative',
          zIndex: 3,
          padding:
            'clamp(14px, 2vw, 22px) clamp(20px, 5vw, 56px) calc(20px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <button onClick={onNext} disabled={selectedCount === 0 || nameTooShort} className="ob-cta">
          <span className="ob-cta__inner">
            <span>{t('weiter')}</span>
            <span style={{ opacity: 0.55, fontSize: 11 }}>·</span>
            <span style={{ opacity: 0.55, fontSize: 11 }}>
              {nameTooShort
                ? t('name: min. 3 zeichen')
                : selectedCount > 0
                  ? t('mit {n}', { n: selectedCount })
                  : t('wähle min. 1')}
            </span>
          </span>
          <span className="ob-cta__arrow">→</span>
        </button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={onSkip} className="ob-link">
            {t('jetzt nicht')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
