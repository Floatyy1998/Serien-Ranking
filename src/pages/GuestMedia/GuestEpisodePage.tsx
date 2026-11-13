import { CheckCircle, Forum, NotificationsActive, Star, Tv } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  GuestShell,
  GuestSticky,
  GuestStory,
  type GuestRailItem,
} from './GuestParts';
import { useHeroCtaVisible } from './useHeroCtaVisible';

interface TmdbEpisode {
  id: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number;
  episode_number: number;
  guest_stars?: { id: number; name: string; character?: string; profile_path?: string | null }[];
}

interface TmdbSeries {
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  first_air_date?: string;
  number_of_seasons?: number;
}

interface Loaded {
  key: string;
  series: TmdbSeries;
  episodes: TmdbEpisode[];
}

interface GuestEpisodePageProps {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

function formatAirDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Geteilter Folgen-Link für Besucher ohne Konto: die Folge zeigen, Diskussion und Abhaken gibt es nach der Anmeldung. */
export const GuestEpisodePage: React.FC<GuestEpisodePageProps> = ({
  tmdbId,
  seasonNumber,
  episodeNumber,
}) => {
  const navigate = useNavigate();
  const key = `${tmdbId}/${seasonNumber}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const current = loaded?.key === key ? loaded : null;
  const episode = current?.episodes.find((e) => e.episode_number === episodeNumber) ?? null;
  const [ctaRef, heroCtaVisible] = useHeroCtaVisible(!!episode);

  useEffect(() => {
    let alive = true;
    Promise.all([
      tmdbFetch<TmdbSeries>(`tv/${tmdbId}`),
      tmdbFetch<{ episodes?: TmdbEpisode[] }>(`tv/${tmdbId}/season/${seasonNumber}`),
    ])
      .then(([series, season]) => {
        if (alive) setLoaded({ key, series, episodes: season.episodes ?? [] });
      })
      .catch(() => {
        if (alive) setFailedKey(key);
      });
    return () => {
      alive = false;
    };
  }, [tmdbId, seasonNumber, key]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key, episodeNumber]);

  if (!current || !episode) {
    return <GuestShell status={failedKey === key || current ? 'failed' : 'loading'} />;
  }

  const { series, episodes } = current;
  const seriesTitle = series.name || '';
  const title = episode.name || t('Folge {n}', { n: episodeNumber });
  const posterUrl = getImageUrl(series.poster_path || undefined, 'w500', '');
  const stillUrl = getImageUrl(
    episode.still_path || series.backdrop_path || undefined,
    'w1280',
    ''
  );

  const facts = [
    episode.air_date ? formatAirDate(episode.air_date) : '',
    episode.runtime ? t('{n} Min.', { n: episode.runtime }) : '',
  ].filter(Boolean);

  const startTracking = () => {
    addGuestPick({
      id: tmdbId,
      type: 'series',
      title: seriesTitle,
      name: series.name,
      poster_path: series.poster_path ?? null,
      vote_average: series.vote_average ?? 0,
      first_air_date: series.first_air_date,
      number_of_seasons: series.number_of_seasons,
    });
    navigate('/join');
  };

  const episodeItems: GuestRailItem[] = episodes.map((e) => ({
    key: e.id,
    image: e.still_path ? getImageUrl(e.still_path, 'w500') : null,
    title: e.name || t('Folge {n}', { n: e.episode_number }),
    sub: t('Folge {n}', { n: e.episode_number }),
    badge: String(e.episode_number),
    to: `/episode/${tmdbId}/s/${seasonNumber}/e/${e.episode_number}`,
    current: e.episode_number === episodeNumber,
  }));

  const guestItems: GuestRailItem[] = (episode.guest_stars || []).slice(0, 14).map((g) => ({
    key: g.id,
    image: g.profile_path ? getImageUrl(g.profile_path, 'w185') : null,
    title: g.name,
    sub: g.character,
  }));

  return (
    <GuestShell status="ready">
      <GuestHero
        backdrop={stillUrl || posterUrl}
        blurBackdrop={!stillUrl}
        poster={posterUrl}
        eyebrow={seriesTitle}
        eyebrowDetail={[t('Staffel {s} · Folge {e}', { s: seasonNumber, e: episodeNumber })]}
        title={title}
        rating={episode.vote_average ? episode.vote_average.toFixed(1) : undefined}
        facts={facts}
        secondary={
          <Link to={`/series/${tmdbId}`} className="gm-btn gm-btn--ghost">
            <Tv />
            {t('Zur Serie')}
          </Link>
        }
        ctaRef={ctaRef}
        onCta={startTracking}
      />

      <main className="gm-main">
        <GuestStory
          overviewTitle={t('Handlung')}
          overview={episode.overview}
          below={
            guestItems.length ? (
              <GuestRail title={t('Gaststars')} items={guestItems} variant="person" bare />
            ) : null
          }
        />

        {episodeItems.length > 1 && (
          <GuestRail
            title={t('Staffel {n}', { n: seasonNumber })}
            items={episodeItems}
            variant="still"
          />
        )}

        <GuestPitch
          heading={t('Mehr als eine Liste: so schaust du {title}.', { title: seriesTitle })}
          cover={posterUrl}
          title={seriesTitle}
          mockSub={t('Staffel {s} · Folge {e}', { s: seasonNumber, e: episodeNumber })}
          progress={episodes.length ? Math.round((episodeNumber / episodes.length) * 100) : 28}
          chips={[
            { icon: <Tv />, label: t('Weiterschauen') },
            { icon: <Star />, label: t('Deine Bewertung') },
          ]}
          features={[
            {
              icon: <CheckCircle />,
              title: t('Folge für Folge abhaken'),
              text: t('Du weißt immer, wo du bei {title} stehst — auf jedem Gerät.', {
                title: seriesTitle,
              }),
            },
            {
              icon: <Forum />,
              title: t('Über diese Folge reden'),
              text: t('Bewerte jede Folge und diskutier sie mit anderen — ohne Spoiler.'),
            },
            {
              icon: <NotificationsActive />,
              title: t('Neue Folgen sofort wissen'),
              text: t(
                'Kalender und Erinnerung, sobald es weitergeht — mit deinem Streamingdienst.'
              ),
            },
          ]}
        />

        <GuestFinal cover={posterUrl} title={seriesTitle} onCta={startTracking} />
        <GuestLegal source={t('Daten und Bilder: TMDB')} />
      </main>

      <GuestSticky
        visible={!heroCtaVisible}
        cover={posterUrl}
        title={seriesTitle}
        onCta={startTracking}
      />
    </GuestShell>
  );
};
