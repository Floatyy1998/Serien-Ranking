import { Person, PersonSearch } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, PageState } from '../../components/ui';
import { QuickRatingSheet } from '../../components/ui/overlay/QuickRatingSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCommunityRatingsMap } from '../../hooks/rating/useCommunityRatings';
import { useQuickMediaActions } from '../../hooks/rating/useQuickMediaActions';
import { showToast } from '../../lib/interaction/toast';
import {
  ageInYears,
  departmentLabel,
  pickHeroBackdrop,
  sortFilmography,
  type FilmographyEntry,
  type FilmographySort,
} from '../../lib/person/filmography';
import { formatRatingShort } from '../../lib/rating/rating';
import { dateLocale, t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { getImageUrl } from '../../utils/imageUrl';
import { PersonCreditCard } from './cards/PersonCreditCard';
import { usePersonProfile } from './hooks/usePersonProfile';
import './PersonPage.css';

type TypeFilter = 'all' | 'series' | 'movie';

const PAGE_SIZE = 48;
const BIO_CLAMP = 320;

const withStrong = (text: string, value: string, color?: string) => {
  const at = text.indexOf(value);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <strong style={color ? { color } : undefined}>{value}</strong>
      {text.slice(at + value.length)}
    </>
  );
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const PersonView = memo(({ personId }: { personId: number | null }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { loading: seriesLoading } = useSeriesList();
  const { loading: moviesLoading } = useMovieList();
  const community = useCommunityRatingsMap();
  const { profile, filmography, loading, error, retry } = usePersonProfile(personId);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<FilmographySort>('known');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [bioOpen, setBioOpen] = useState(false);
  const [ownedKeys, setOwnedKeys] = useState<{ id: number; keys: Set<string> } | null>(null);

  const notify = useCallback((message: string) => showToast(message, 2500), []);
  const { statusOf, add, markWatched, rate, quickRating, closeQuickRating, saveQuickRating } =
    useQuickMediaActions({ source: 'person', notify });

  useEffect(() => {
    setTypeFilter('all');
    setSort('known');
    setLimit(PAGE_SIZE);
    setBioOpen(false);
  }, [personId]);

  useEffect(() => {
    if (!personId || !profile || seriesLoading || moviesLoading) return;
    if (ownedKeys?.id === personId) return;
    setOwnedKeys({
      id: personId,
      keys: new Set(filmography.filter((e) => statusOf(e).owned).map((e) => e.key)),
    });
  }, [personId, profile, filmography, seriesLoading, moviesLoading, ownedKeys, statusOf]);

  const counts = useMemo(
    () => ({
      all: filmography.length,
      series: filmography.filter((e) => e.type === 'series').length,
      movie: filmography.filter((e) => e.type === 'movie').length,
    }),
    [filmography]
  );

  const filtered = useMemo(
    () => (typeFilter === 'all' ? filmography : filmography.filter((e) => e.type === typeFilter)),
    [filmography, typeFilter]
  );

  const ownedSet = ownedKeys?.id === personId ? ownedKeys.keys : null;
  const ownedEntries = useMemo(
    () =>
      ownedSet
        ? sortFilmography(
            filtered.filter((e) => ownedSet.has(e.key)),
            'known'
          )
        : [],
    [filtered, ownedSet]
  );
  const visible = useMemo(
    () =>
      sortFilmography(
        ownedEntries.length > 0 ? filtered.filter((e) => !ownedSet?.has(e.key)) : filtered,
        sort
      ),
    [filtered, ownedEntries.length, ownedSet, sort]
  );
  const ownedTotal = ownedSet?.size ?? 0;

  const ownAverage = useMemo(() => {
    if (!ownedSet) return 0;
    const ratings = filmography
      .filter((e) => ownedSet.has(e.key))
      .map((e) => statusOf(e).ownRating)
      .filter((r) => r > 0);
    return ratings.length >= 2 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  }, [filmography, ownedSet, statusOf]);

  const heroBackdrop = useMemo(() => pickHeroBackdrop(filmography), [filmography]);

  const openEntry = useCallback(
    (entry: FilmographyEntry) =>
      navigate(`/${entry.type === 'series' ? 'series' : 'movie'}/${entry.id}`),
    [navigate]
  );
  const onAdd = useCallback(
    (entry: FilmographyEntry, e: React.MouseEvent) =>
      add({ id: entry.id, type: entry.type, title: entry.title, poster_path: entry.posterPath }, e),
    [add]
  );
  const onWatched = useCallback(
    (entry: FilmographyEntry, inList: boolean, e: React.MouseEvent) =>
      markWatched(
        { id: entry.id, type: entry.type, title: entry.title, poster_path: entry.posterPath },
        inList,
        e
      ),
    [markWatched]
  );
  const onRate = useCallback(
    (entry: FilmographyEntry, rating: number, e: React.MouseEvent) =>
      rate({ id: entry.id, type: entry.type, title: entry.title }, rating, e),
    [rate]
  );

  if (loading || error || !profile || !personId) {
    return (
      <div className="pp">
        <div className="pp-topbar">
          <BackButton />
        </div>
        {error || !personId ? (
          <PageState
            mode="error"
            error={{
              icon: <PersonSearch style={{ fontSize: 40 }} />,
              title: t('Person konnte nicht geladen werden'),
              description: t('Prüfe deine Verbindung und versuche es erneut.'),
              onRetry: retry,
            }}
            style={{ paddingTop: 120 }}
          />
        ) : (
          <PageState mode="loading" style={{ minHeight: '70vh' }} />
        )}
      </div>
    );
  }

  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const age = ageInYears(profile.birthday, profile.deathday);
  const metaParts = [
    profile.deathday && profile.birthday
      ? `${profile.birthday.slice(0, 4)} – ${profile.deathday.slice(0, 4)}`
      : '',
    age !== null ? t('{n} Jahre', { n: age }) : '',
    profile.placeOfBirth || '',
  ].filter(Boolean);
  const bio = profile.biography;
  const bioLong = bio.length > BIO_CLAMP;
  const canEdit = !!user;
  const averageLabel = formatRatingShort(Math.round(ownAverage * 10) / 10);

  const renderGrid = (entries: FilmographyEntry[]) => (
    <div className="pp-grid">
      {entries.map((entry) => (
        <PersonCreditCard
          key={entry.key}
          entry={entry}
          status={statusOf(entry)}
          community={community}
          canEdit={canEdit}
          onOpen={openEntry}
          onAdd={onAdd}
          onWatched={onWatched}
          onRate={onRate}
        />
      ))}
    </div>
  );

  const filters: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: t('Alle'), count: counts.all },
    { key: 'series', label: t('Serien'), count: counts.series },
    { key: 'movie', label: t('Filme'), count: counts.movie },
  ];

  return (
    <div className="pp">
      <section className="pp-hero">
        <div
          className="pp-hero__backdrop"
          style={{
            backgroundImage: heroBackdrop
              ? `url(${getImageUrl(heroBackdrop, 'w1280')})`
              : `linear-gradient(135deg, ${currentTheme.primary}55, ${currentTheme.accent}33)`,
          }}
        />
        <div
          className="pp-hero__fade"
          style={{
            background: `linear-gradient(to top, ${currentTheme.background.default} 0%, ${currentTheme.background.default}cc 38%, transparent 100%)`,
          }}
        />
        <div
          className="pp-hero__side"
          style={{
            background: `linear-gradient(90deg, ${currentTheme.background.default}e6 0%, ${currentTheme.background.default}66 40%, transparent 70%)`,
          }}
        />
        <div className="pp-topbar">
          <BackButton
            style={{ backdropFilter: 'var(--blur-sm)', WebkitBackdropFilter: 'var(--blur-sm)' }}
          />
        </div>

        <motion.div
          className="pp-hero__content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="pp-hero__portrait-ring"
            style={{
              background: `linear-gradient(140deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              boxShadow: `0 24px 60px -18px ${currentTheme.primary}66`,
            }}
          >
            {profile.profilePath ? (
              <img
                className="pp-hero__portrait"
                src={getImageUrl(profile.profilePath, 'w500')}
                alt={profile.name}
              />
            ) : (
              <div
                className="pp-hero__portrait pp-hero__portrait--empty"
                style={{ background: currentTheme.background.surface }}
              >
                <Person style={{ fontSize: 64, color: currentTheme.text.muted }} />
              </div>
            )}
          </div>

          <div className="pp-hero__info">
            {profile.department && (
              <span className="pp-hero__eyebrow" style={{ color: currentTheme.primary }}>
                {departmentLabel(profile.department)}
              </span>
            )}
            <h1 className="pp-hero__name" style={{ color: currentTheme.text.primary }}>
              {profile.name}
            </h1>
            {metaParts.length > 0 && (
              <p className="pp-hero__meta" style={{ color: currentTheme.text.secondary }}>
                {metaParts.join(' · ')}
              </p>
            )}
            {(profile.birthday || profile.deathday) && (
              <p className="pp-hero__dates" style={{ color: currentTheme.text.muted }}>
                {profile.birthday &&
                  t('Geboren am {datum}', { datum: formatDate(profile.birthday) })}
                {profile.birthday && profile.deathday && ' · '}
                {profile.deathday &&
                  t('Gestorben am {datum}', { datum: formatDate(profile.deathday) })}
              </p>
            )}
            <div className="pp-hero__stats">
              <span
                className="pp-stat"
                style={{
                  color: currentTheme.text.secondary,
                  borderColor: 'var(--glass-border-light)',
                }}
              >
                {withStrong(
                  counts.all === 1 ? t('1 Titel') : t('{n} Titel', { n: counts.all }),
                  String(counts.all),
                  currentTheme.text.primary
                )}
              </span>
              {ownedTotal > 0 && (
                <span
                  className="pp-stat pp-stat--accent"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    color: onPrimary,
                  }}
                >
                  {withStrong(t('{n} in deiner Liste', { n: ownedTotal }), String(ownedTotal))}
                </span>
              )}
              {ownAverage > 0 && (
                <span
                  className="pp-stat"
                  style={{
                    color: currentTheme.text.secondary,
                    borderColor: 'var(--glass-border-light)',
                  }}
                >
                  {withStrong(
                    t('Deine Ø {wert}', { wert: averageLabel }),
                    averageLabel,
                    currentTheme.text.primary
                  )}
                </span>
              )}
            </div>
            {bio && (
              <div className="pp-bio">
                <p
                  className={`pp-bio__text${bioLong && !bioOpen ? ' pp-bio__text--clamped' : ''}`}
                  style={{ color: currentTheme.text.secondary }}
                >
                  {bio}
                </p>
                {bioLong && (
                  <button
                    type="button"
                    className="pp-bio__toggle"
                    onClick={() => setBioOpen((v) => !v)}
                    style={{ color: currentTheme.primary }}
                  >
                    {bioOpen ? t('Weniger anzeigen') : t('Mehr lesen')}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <div className="pp-body">
        <div className="pp-controls">
          <div className="pp-filters" role="group" aria-label={t('Filmografie filtern')}>
            {filters
              .filter((f) => f.key === 'all' || f.count > 0)
              .map((f) => {
                const active = typeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="pp-filter"
                    aria-pressed={active}
                    onClick={() => {
                      setTypeFilter(f.key);
                      setLimit(PAGE_SIZE);
                    }}
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                        : 'var(--glass-medium)',
                      border: active ? 'none' : '1px solid var(--glass-border-light)',
                      color: active ? onPrimary : currentTheme.text.muted,
                    }}
                  >
                    {f.label}
                    <span className="pp-filter__count">{f.count}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {ownedEntries.length > 0 && (
          <section className="pp-section">
            <h2 className="pp-section__title" style={{ color: currentTheme.text.primary }}>
              {t('Aus deiner Liste')}
              <span className="pp-section__count" style={{ color: currentTheme.text.muted }}>
                {ownedEntries.length}
              </span>
            </h2>
            {renderGrid(ownedEntries)}
          </section>
        )}

        {(visible.length > 0 || ownedEntries.length === 0) && (
          <section className="pp-section">
            <div className="pp-section__head">
              <h2 className="pp-section__title" style={{ color: currentTheme.text.primary }}>
                {ownedEntries.length > 0 ? t('Weitere Titel') : t('Filmografie')}
                <span className="pp-section__count" style={{ color: currentTheme.text.muted }}>
                  {visible.length}
                </span>
              </h2>
              {visible.length > 1 && (
                <div
                  className="pp-seg"
                  role="group"
                  aria-label={t('Sortierung')}
                  style={{ borderColor: 'var(--glass-border-light)' }}
                >
                  {(['known', 'newest'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="pp-seg__btn"
                      aria-pressed={sort === key}
                      onClick={() => {
                        setSort(key);
                        setLimit(PAGE_SIZE);
                      }}
                      style={
                        sort === key
                          ? {
                              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                              color: onPrimary,
                            }
                          : { color: currentTheme.text.muted }
                      }
                    >
                      {key === 'known' ? t('Bekannteste') : t('Neueste')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {visible.length === 0 ? (
              <p className="pp-empty" style={{ color: currentTheme.text.muted }}>
                {t('Keine Titel gefunden')}
              </p>
            ) : (
              renderGrid(visible.slice(0, limit))
            )}
            {visible.length > limit && (
              <button
                type="button"
                className="pp-more"
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                style={{
                  color: currentTheme.text.primary,
                  borderColor: 'var(--glass-border-light)',
                }}
              >
                {t('{n} weitere anzeigen', { n: Math.min(PAGE_SIZE, visible.length - limit) })}
              </button>
            )}
          </section>
        )}
      </div>

      <QuickRatingSheet
        isOpen={quickRating.open}
        onClose={closeQuickRating}
        seriesTitle={quickRating.title}
        eyebrow={quickRating.afterWatched ? t('Als gesehen markiert') : t('In deiner Liste')}
        initialRating={quickRating.initialRating}
        genres={quickRating.genres}
        mediaType={quickRating.mediaType}
        itemId={quickRating.itemId}
        initialGenreRatings={quickRating.genreRatings}
        onRate={saveQuickRating}
      />
    </div>
  );
});

PersonView.displayName = 'PersonView';

export const PersonPage = () => {
  const { id } = useParams<{ id: string }>();
  const personId = Number(id);
  return <PersonView personId={Number.isFinite(personId) && personId > 0 ? personId : null} />;
};
