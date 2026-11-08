import {
  CheckCircle,
  Groups,
  Insights,
  LocalMovies,
  NotificationsActive,
  Star,
  Tv,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProviderBadges } from '../../components/detail/ProviderBadges';
import { useCommunityRating } from '../../hooks/rating/useCommunityRatings';
import { addGuestPick } from '../../services/account/guestOnboarding';
import { tmdbFetch } from '../../services/api/tmdbClient';
import { dateLocale, t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import {
  GuestFinal,
  GuestHero,
  GuestLegal,
  GuestPitch,
  GuestRail,
  GuestRatings,
  GuestShell,
  GuestSticky,
  GuestStory,
  GuestTrailer,
  GuestTrailerButton,
  type GuestFeature,
  type GuestNotice,
  type GuestRailItem,
} from './GuestParts';
import { useHeroCtaVisible } from './useHeroCtaVisible';
import {
  isUpcoming,
  pickCast,
  pickMakers,
  pickSeasons,
  pickSimilar,
  pickTrailerKey,
  sortCollection,
  totalWatchMinutes,
  upcomingEpisode,
  type TmdbCollection,
  type TmdbDetail,
  type TmdbSimilarEntry,
} from './guestMediaModel';

interface GuestMediaPageProps {
  mediaType: 'tv' | 'movie';
  tmdbId: number;
}

const APPEND = {
  tv: 'aggregate_credits,recommendations,similar,watch/providers,videos,external_ids',
  movie: 'credits,recommendations,similar,watch/providers,videos,external_ids',
};

const STATUS_LABEL: Record<string, string> = {
  'Returning Series': 'Läuft noch',
  Ended: 'Abgeschlossen',
  Canceled: 'Abgesetzt',
  'In Production': 'In Produktion',
  'Post Production': 'In Produktion',
  Planned: 'Angekündigt',
};

function formatAirDate(iso: string, withYear = false): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(dateLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

function formatRuntime(minutes: number, isTv: boolean): string {
  if (isTv) {
    if (minutes < 120) return t('{n} Min.', { n: minutes });
    return t('{n} Std. Laufzeit', { n: Math.round(minutes / 60) });
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return t('{n} Min.', { n: m });
  return m ? t('{h} Std. {m} Min.', { h, m }) : t('{h} Std.', { h });
}

function useImdbRating(imdbId: string | null | undefined) {
  const [rating, setRating] = useState<{ id: string; value: number; votes: string } | null>(null);
  useEffect(() => {
    const key = import.meta.env.VITE_API_OMDb;
    if (!imdbId || !key) return;
    let alive = true;
    fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${key}`)
      .then((res) => res.json())
      .then((data: { imdbRating?: string; imdbVotes?: string }) => {
        if (!alive || !data.imdbRating || data.imdbRating === 'N/A') return;
        setRating({ id: imdbId, value: parseFloat(data.imdbRating), votes: data.imdbVotes || '' });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [imdbId]);
  return rating && rating.id === imdbId ? rating : null;
}

const yearOf = (e: TmdbSimilarEntry) => (e.first_air_date || e.release_date || '').slice(0, 4);

export const GuestMediaPage: React.FC<GuestMediaPageProps> = ({ mediaType, tmdbId }) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TmdbDetail | null>(null);
  const [collection, setCollection] = useState<TmdbCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ctaRef, heroCtaVisible] = useHeroCtaVisible(!!detail);
  const trailerRef = useRef<HTMLDivElement>(null);
  const imdbId = detail?.external_ids?.imdb_id;
  const imdb = useImdbRating(imdbId);
  const community = useCommunityRating(mediaType === 'tv' ? 'series' : 'movies', tmdbId);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setCollection(null);
    setFailed(false);
    setPlaying(false);
    window.scrollTo(0, 0);
    tmdbFetch<TmdbDetail>(`${mediaType}/${tmdbId}`, {
      append_to_response: APPEND[mediaType],
      include_video_language: 'de,en,null',
    })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        const collectionId = data.belongs_to_collection?.id;
        if (collectionId) {
          tmdbFetch<TmdbCollection>(`collection/${collectionId}`)
            .then((c) => !cancelled && setCollection(c))
            .catch(() => undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbId]);

  if (!detail) return <GuestShell status={failed ? 'failed' : 'loading'} />;

  const isTv = mediaType === 'tv';
  const title = detail.name || detail.title || '';
  const year = (detail.first_air_date || detail.release_date || '').slice(0, 4);
  const backdropUrl = getImageUrl(detail.backdrop_path || undefined, 'w1280', '');
  const posterUrl = getImageUrl(detail.poster_path || undefined, 'w500', '');
  const trailerKey = pickTrailerKey(detail.videos?.results);
  const cast = pickCast(detail);
  const similar = pickSimilar(detail);
  const seasons = isTv ? pickSeasons(detail) : [];
  const nextEpisode = isTv ? upcomingEpisode(detail) : null;
  const releaseUpcoming = !isTv && isUpcoming(detail.release_date);
  const minutes = totalWatchMinutes(detail);
  const status = detail.status ? STATUS_LABEL[detail.status] : undefined;
  const makers = pickMakers(detail);
  const collectionParts = sortCollection(collection);

  const facts = [
    year,
    isTv && detail.number_of_seasons
      ? `${detail.number_of_seasons} ${t(detail.number_of_seasons === 1 ? 'Staffel' : 'Staffeln')}`
      : '',
    isTv && detail.number_of_episodes ? t('{n} Folgen', { n: detail.number_of_episodes }) : '',
    minutes ? formatRuntime(minutes, isTv) : '',
    status && (isTv || releaseUpcoming) ? t(status) : '',
  ].filter(Boolean);

  const notice: GuestNotice | null = nextEpisode?.air_date
    ? {
        title: t('Neue Folge am {date}', { date: formatAirDate(nextEpisode.air_date) }),
        text: t('Staffel {s}, Folge {e} — TV-RANK erinnert dich rechtzeitig.', {
          s: nextEpisode.season_number,
          e: nextEpisode.episode_number,
        }),
      }
    : releaseUpcoming && detail.release_date
      ? {
          title: t('Erscheint am {date}', { date: formatAirDate(detail.release_date, true) }),
          text: t('Setz ihn auf deine Watchlist — TV-RANK sagt dir, wann und wo er läuft.'),
        }
      : null;

  const startTracking = () => {
    addGuestPick({
      id: tmdbId,
      type: isTv ? 'series' : 'movie',
      title,
      name: detail.name,
      poster_path: detail.poster_path ?? null,
      vote_average: detail.vote_average ?? 0,
      first_air_date: detail.first_air_date,
      release_date: detail.release_date,
      number_of_seasons: detail.number_of_seasons,
    });
    navigate('/join');
  };

  const playTrailer = () => {
    setPlaying(true);
    trailerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const linkFor = (id: number) => `/${isTv ? 'series' : 'movie'}/${id}`;

  const castItems: GuestRailItem[] = cast.map((c) => ({
    key: c.id,
    image: c.profilePath ? getImageUrl(c.profilePath, 'w185') : null,
    title: c.name,
    sub: c.character,
  }));

  const collectionItems: GuestRailItem[] = collectionParts.map((p, i) => ({
    key: p.id,
    image: getImageUrl(p.poster_path || undefined, 'w342'),
    title: p.title || p.name || '',
    sub: [yearOf(p), t('Teil {n}', { n: i + 1 })].filter(Boolean).join(' · '),
    to: linkFor(p.id),
    current: p.id === tmdbId,
  }));

  const similarItems: GuestRailItem[] = similar.map((s) => ({
    key: s.id,
    image: getImageUrl(s.poster_path || undefined, 'w342'),
    title: s.name || s.title || '',
    sub: [yearOf(s), s.vote_average ? `★ ${s.vote_average.toFixed(1)}` : '']
      .filter(Boolean)
      .join(' · '),
    to: linkFor(s.id),
  }));

  const seasonItems: GuestRailItem[] = seasons.map((s) => ({
    key: s.id,
    image: getImageUrl(s.poster_path || detail.poster_path || undefined, 'w342'),
    title: s.name,
    sub: [s.air_date?.slice(0, 4), t('{n} Folgen', { n: s.episode_count })]
      .filter(Boolean)
      .join(' · '),
  }));

  const features: GuestFeature[] = [
    isTv
      ? {
          icon: <CheckCircle />,
          title: t('Folge für Folge abhaken'),
          text: t('Du weißt immer, wo du bei {title} stehst — auf jedem Gerät.', { title }),
        }
      : {
          icon: <CheckCircle />,
          title: t('Gesehen, bewertet, gemerkt'),
          text: t('Hak {title} ab, bewerte ihn und behalte jeden Rewatch im Blick.', { title }),
        },
    {
      icon: <NotificationsActive />,
      title: isTv ? t('Neue Folgen sofort wissen') : t('Nie wieder vergessen'),
      text: isTv
        ? t('Kalender und Erinnerung, sobald es weitergeht — mit deinem Streamingdienst.')
        : t('Auf die Watchlist, und wir sagen dir, wo der Film gerade läuft.'),
    },
    {
      icon: <Groups />,
      title: t('Mit Freunden schauen'),
      text: t('Sieh, wer {title} auch schaut, empfiehl Titel und diskutier ohne Spoiler.', {
        title,
      }),
    },
    {
      icon: <Insights />,
      title: t('Statistiken & Wrapped'),
      text: t('Dein Jahr in Zahlen, Badges und ein Begleiter, der mit jeder Folge levelt.'),
    },
  ];

  const providers = detail['watch/providers'];

  return (
    <GuestShell status="ready">
      <GuestHero
        backdrop={backdropUrl || posterUrl}
        blurBackdrop={!backdropUrl}
        poster={posterUrl}
        eyebrow={isTv ? t('Serie') : t('Film')}
        eyebrowDetail={(detail.genres || []).map((g) => g.name).slice(0, 3)}
        title={title}
        byline={
          makers.length
            ? isTv
              ? t('Von {names}', { names: makers.join(', ') })
              : t('Regie: {names}', { names: makers.join(', ') })
            : undefined
        }
        tagline={detail.tagline}
        ratings={
          <GuestRatings
            tmdb={
              detail.vote_average
                ? {
                    value: detail.vote_average,
                    votes: String(detail.vote_count ?? ''),
                    href: `https://www.themoviedb.org/${mediaType}/${tmdbId}`,
                  }
                : null
            }
            imdb={
              imdb
                ? {
                    value: imdb.value,
                    votes: imdb.votes,
                    href: `https://www.imdb.com/title/${imdbId}`,
                  }
                : null
            }
            tvrank={community ? { value: community.a, votes: String(community.c) } : null}
          />
        }
        facts={facts}
        extra={
          providers ? (
            <div className="gm-providers">
              <span className="gm-providers__label">{t('Läuft bei')}</span>
              <ProviderBadges
                providers={providers}
                size="medium"
                maxDisplay={6}
                searchTitle={title}
                tmdbId={tmdbId}
                mediaType={mediaType}
              />
            </div>
          ) : null
        }
        secondary={trailerKey ? <GuestTrailerButton onClick={playTrailer} /> : null}
        ctaRef={ctaRef}
        onCta={startTracking}
      />

      <main className="gm-main">
        <GuestStory
          overview={detail.overview}
          notice={notice}
          media={
            trailerKey ? (
              <div ref={trailerRef}>
                <h2 className="gm-h2">{t('Trailer')}</h2>
                <GuestTrailer
                  videoKey={trailerKey}
                  cover={backdropUrl}
                  title={title}
                  playing={playing}
                  onPlay={() => setPlaying(true)}
                />
              </div>
            ) : null
          }
          below={
            castItems.length ? (
              <GuestRail title={t('Besetzung')} items={castItems} variant="person" bare />
            ) : null
          }
        />

        {collection && collectionItems.length > 1 && (
          <GuestRail
            title={t('Die Reihe: {name}', { name: collection.name })}
            items={collectionItems}
          />
        )}

        {seasonItems.length > 1 && <GuestRail title={t('Staffeln')} items={seasonItems} />}

        <GuestPitch
          heading={t('Mehr als eine Liste: so schaust du {title}.', { title })}
          cover={posterUrl}
          title={title}
          mockSub={isTv ? t('Staffel {s} · Folge {e}', { s: 1, e: 3 }) : t('Auf deiner Watchlist')}
          progress={isTv ? 28 : 100}
          chips={[
            {
              icon: isTv ? <Tv /> : <LocalMovies />,
              label: isTv ? t('Weiterschauen') : t('Heute Abend'),
            },
            { icon: <Star />, label: t('Deine Bewertung') },
          ]}
          features={features}
        />

        <GuestRail title={t('Wenn dir {title} gefällt', { title })} items={similarItems} />

        <GuestFinal cover={posterUrl} title={title} onCta={startTracking} />
        <GuestLegal source={t('Daten und Bilder: TMDB')} />
      </main>

      <GuestSticky
        visible={!heroCtaVisible}
        cover={posterUrl}
        title={title}
        onCta={startTracking}
      />
    </GuestShell>
  );
};
