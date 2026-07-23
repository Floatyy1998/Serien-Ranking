import { Theaters, CheckCircle } from '@mui/icons-material';
import { memo, useMemo } from 'react';
import { HorizontalScrollContainer } from '../../components/ui';
import { useMovieList } from '../../contexts/MovieListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMovieCollection } from '../../hooks/useMovieCollection';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import { isMovieWatched } from '../../lib/rating/rating';
import { t } from '../../services/i18n';

interface CollectionSectionProps {
  movieId: number;
  isMobile: boolean;
}

/**
 * Filmreihen-Karte auf der Film-Detailseite: Fortschritt („3/6 gesehen") über
 * alle erschienenen Teile + Poster-Reihe mit Gesehen-Haken; fehlende Teile
 * führen per Tap auf ihre Detailseite (dort hinzufügen/abhaken).
 */
export const CollectionSection = memo(({ movieId, isMobile }: CollectionSectionProps) => {
  const { currentTheme } = useTheme();
  const navigate = useTransitionNavigate();
  const collection = useMovieCollection(movieId);
  const { movieList } = useMovieList();

  const byId = useMemo(() => {
    const map = new Map<number, { watched: boolean }>();
    // isMovieWatched: „gesehen" = watched-Flag ODER Bewertung (genre-keyed) — nie nur das Flag.
    for (const m of movieList) map.set(Number(m.id), { watched: isMovieWatched(m) });
    return map;
  }, [movieList]);

  if (!collection || collection.parts.length < 2) return null;

  const today = new Date().toISOString().slice(0, 10);
  const released = collection.parts.filter((p) => p.release_date && p.release_date <= today);
  const watchedCount = released.filter((p) => byId.get(p.id)?.watched).length;
  const complete = released.length > 0 && watchedCount === released.length;
  const cardWidth = isMobile ? 110 : 140;

  return (
    <section style={{ margin: '0 0 24px' }}>
      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <h3
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: isMobile ? 15 : 17,
            fontWeight: 700,
            color: currentTheme.text.primary,
          }}
        >
          <Theaters style={{ fontSize: isMobile ? 18 : 20, color: currentTheme.accent }} />
          {collection.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div
            style={{
              flex: 1,
              maxWidth: 220,
              height: 5,
              borderRadius: 3,
              background: 'var(--glass-light)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${released.length > 0 ? (watchedCount / released.length) * 100 : 0}%`,
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: complete ? currentTheme.primary : currentTheme.text.muted,
              whiteSpace: 'nowrap',
            }}
          >
            {complete
              ? t('Reihe komplett!')
              : t('{x} von {y} gesehen', { x: watchedCount, y: released.length })}
          </span>
        </div>
      </div>

      <HorizontalScrollContainer gap={12} style={{ padding: '0 20px' }}>
        {collection.parts.map((part) => {
          const state = byId.get(part.id);
          const watched = state?.watched === true;
          const owned = !!state;
          const unreleased = !part.release_date || part.release_date > today;
          const isCurrent = part.id === movieId;
          const year = part.release_date ? part.release_date.slice(0, 4) : '—';
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => {
                if (!isCurrent) navigate(`/movie/${part.id}`);
              }}
              title={part.title}
              style={{
                display: 'block',
                width: cardWidth,
                minWidth: cardWidth,
                minHeight: 0,
                flexShrink: 0,
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: isCurrent ? 'default' : 'pointer',
                textAlign: 'left',
                opacity: unreleased ? 0.45 : owned || watched ? 1 : 0.75,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '2 / 3',
                    borderRadius: 10,
                    backgroundColor: currentTheme.background.surface,
                    backgroundImage: part.poster_path
                      ? `url(https://image.tmdb.org/t/p/w185${part.poster_path})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: isCurrent
                      ? `2px solid ${currentTheme.primary}`
                      : `1px solid ${currentTheme.border.default}`,
                  }}
                />
                {watched && (
                  <CheckCircle
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      fontSize: 20,
                      color: currentTheme.primary,
                      background: 'rgba(0,0,0,0.65)',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {part.title}
              </div>
              <div style={{ marginTop: 1, fontSize: 10, color: currentTheme.text.muted }}>
                {unreleased ? t('ab {jahr}', { jahr: year }) : year}
              </div>
            </button>
          );
        })}
      </HorizontalScrollContainer>
    </section>
  );
});

CollectionSection.displayName = 'CollectionSection';
