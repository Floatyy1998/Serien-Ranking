import NightsStay from '@mui/icons-material/NightsStay';
import Refresh from '@mui/icons-material/Refresh';
import ThumbDown from '@mui/icons-material/ThumbDown';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import { filterItemsByActiveProviders } from '../../pages/Discover/watchProviderFilter';
import {
  buildTonightCandidates,
  discoverToCandidate,
  MOOD_TMDB_GENRES,
  pickTonight,
  type TonightCandidate,
  type TonightMood,
  type TonightPick,
  type TonightReason,
  type TonightSource,
  type TonightTime,
  type TonightType,
} from '../../lib/tonightPicker';
import {
  blockRecommendation,
  fetchBlockedRecommendations,
} from '../../services/recFeedbackService';
import { t } from '../../services/i18n';
import { watchRegion } from '../../services/region';
import { tmdbFetch } from '../../services/tmdbClient';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { getImageUrl } from '../../utils/imageUrl';
import { BottomSheet } from '../ui/BottomSheet';
import './TonightSheet.css';

const PREFS_KEY = 'tonightPrefs';

const TIME_OPTIONS: { value: TonightTime; label: string }[] = [
  { value: 0, label: 'Egal' },
  { value: 30, label: '30 Min' },
  { value: 60, label: '1 Std' },
  { value: 120, label: '2 Std' },
];

const MOOD_OPTIONS: { value: TonightMood; label: string }[] = [
  { value: 'egal', label: 'Egal' },
  { value: 'leicht', label: 'Leicht' },
  { value: 'lustig', label: 'Lustig' },
  { value: 'spannend', label: 'Spannend' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'romantisch', label: 'Romantisch' },
  { value: 'duester', label: 'Düster' },
  { value: 'gruselig', label: 'Gruselig' },
];

const TYPE_OPTIONS: { value: TonightType; label: string }[] = [
  { value: 'egal', label: 'Egal' },
  { value: 'series', label: 'Serie' },
  { value: 'movie', label: 'Film' },
];

const SOURCE_OPTIONS: { value: TonightSource; label: string }[] = [
  { value: 'egal', label: 'Egal' },
  { value: 'library', label: 'Meine Liste' },
  { value: 'discover', label: 'Was Neues' },
];

interface TonightPrefs {
  time: TonightTime;
  mood: TonightMood;
  type: TonightType;
  source: TonightSource;
}

const readPrefs = (): TonightPrefs => {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (p && typeof p.time === 'number') {
      return { type: 'egal', source: 'egal', mood: 'egal', ...p };
    }
  } catch {
    // Defaults
  }
  return { time: 0, mood: 'egal', type: 'egal', source: 'egal' };
};

interface DiscoverRaw {
  id?: number;
  name?: string;
  title?: string;
  poster_path?: string;
  vote_average?: number;
}

const daySeed = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const reasonText = (r: TonightReason): string => {
  switch (r.kind) {
    case 'continue':
      if (r.episodes === 0) return t('Du bist mittendrin — einfach weiterschauen');
      return r.episodes === 1
        ? t('Eine Folge ({m} Min) passt in dein Fenster', { m: r.runtime })
        : t('{n} Folgen à {m} Min passen in dein Fenster', { n: r.episodes, m: r.runtime });
    case 'fresh-start':
      return t('Liegt ungestartet in deiner Liste');
    case 'movie-fits':
      return t('Film, {m} Min', { m: r.runtime });
    case 'watchlist':
      return t('Steht auf deiner Watchlist');
    case 'mood':
      return t('Passt zu deiner Stimmung');
    case 'discover': {
      const base = r.rating
        ? t('Neu für dich — TMDB {n}/10', { n: r.rating.toFixed(1) })
        : t('Neu für dich — noch nicht in deiner Liste');
      return r.onSubs ? `${base} · ${t('läuft bei deinen Anbietern')}` : base;
    }
  }
};

interface TonightSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TonightSheet: React.FC<TonightSheetProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [prefs, setPrefs] = useState(readPrefs);
  const [blocked, setBlocked] = useState<Set<number>>(new Set());
  const [discoverPool, setDiscoverPool] = useState<TonightCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const {
    activeProviders: activeSubscriptions,
    isOnActiveSub,
    loading: subsLoading,
  } = useActiveSubscriptions();

  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    let cancelled = false;
    fetchBlockedRecommendations(user.uid).then((set) => {
      if (!cancelled) setBlocked(set);
    });
    setIndex(0);
    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.uid]);

  // "Neues entdecken": TMDB-Discover passend zu Stimmung/Typ, ohne Titel,
  // die schon in der Bibliothek liegen; mit aktiven Abos zusätzlich auf
  // "läuft bei deinen Anbietern" gefiltert.
  useEffect(() => {
    if (!isOpen || prefs.source === 'library') {
      setDiscoverPool([]);
      return;
    }
    // Erst wenn die Abos geladen sind — sonst läuft der erste Pool ungefiltert durch
    if (subsLoading) return;
    let cancelled = false;
    const genres = prefs.mood !== 'egal' ? MOOD_TMDB_GENRES[prefs.mood] : null;
    const kinds: ('tv' | 'movie')[] =
      prefs.type === 'series' ? ['tv'] : prefs.type === 'movie' ? ['movie'] : ['tv', 'movie'];

    const load = async () => {
      const responses = await Promise.all(
        kinds.map((kind) =>
          tmdbFetch<{ results?: DiscoverRaw[] }>(`discover/${kind}`, {
            region: watchRegion,
            sort_by: 'popularity.desc',
            'vote_count.gte': kind === 'tv' ? 50 : 100,
            ...(genres ? { with_genres: kind === 'tv' ? genres.tv : genres.movie } : {}),
            page: 1,
          }).catch(() => ({ results: [] as DiscoverRaw[] }))
        )
      );
      if (cancelled) return;

      const owned = new Set<number>([
        ...seriesList.map((s) => s.id),
        ...movieList.map((m) => m.id),
      ]);
      let pool: TonightCandidate[] = [];
      responses.forEach((res, i) => {
        for (const raw of res.results || []) {
          const candidate = discoverToCandidate(raw, kinds[i] === 'tv' ? 'series' : 'movie');
          if (candidate && !owned.has(candidate.id) && !blocked.has(candidate.id)) {
            pool.push(candidate);
          }
        }
      });

      if (activeSubscriptions.size > 0) {
        const filterable = pool.slice(0, 60).map((c) => ({
          id: c.id,
          type: (c.kind === 'new-movie' ? 'movie' : 'series') as 'series' | 'movie',
          candidate: c,
        }));
        const kept = await filterItemsByActiveProviders(filterable, activeSubscriptions);
        if (cancelled) return;
        pool = kept.map((k) => ({ ...k.candidate, onMySubs: true }));
      }

      setDiscoverPool(pool.slice(0, 30));
    };
    void load();
    return () => {
      cancelled = true;
    };
    // Bibliotheks-Längen statt Objekte: der Pool muss nicht bei jedem Listener-Tick neu laden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    prefs.source,
    prefs.mood,
    prefs.type,
    blocked,
    activeSubscriptions,
    subsLoading,
    seriesList.length,
    movieList.length,
  ]);

  const updatePrefs = (next: Partial<TonightPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    setIndex(0);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    } catch {
      // Quota egal
    }
  };

  const picks: TonightPick[] = useMemo(() => {
    if (!isOpen) return [];
    // Mit aktiven Abos gilt die Abo-Pflicht auch für die eigene Liste:
    // vorgeschlagen wird nur, was gerade wirklich streambar ist.
    const hasSubs = activeSubscriptions.size > 0;
    const ownSeries = hasSubs ? seriesList.filter((s) => isOnActiveSub(s)) : seriesList;
    const ownMovies = hasSubs ? movieList.filter((m) => isOnActiveSub(m)) : movieList;
    return pickTonight(
      [...buildTonightCandidates(ownSeries, ownMovies, blocked), ...discoverPool],
      {
        time: prefs.time,
        mood: prefs.mood,
        type: prefs.type,
        source: prefs.source,
        seed: daySeed(),
      }
    );
  }, [
    isOpen,
    seriesList,
    movieList,
    blocked,
    discoverPool,
    prefs,
    activeSubscriptions,
    isOnActiveSub,
  ]);

  const pick = picks[index % Math.max(1, picks.length)];

  const handleGo = () => {
    if (!pick) return;
    onClose();
    const isMovie = pick.candidate.kind === 'movie' || pick.candidate.kind === 'new-movie';
    navigate(isMovie ? `/movie/${pick.candidate.id}` : `/series/${pick.candidate.id}`);
  };

  const handleBlock = () => {
    if (!pick || !user?.uid) return;
    const { id, kind } = pick.candidate;
    const isMovie = kind === 'movie' || kind === 'new-movie';
    void blockRecommendation(user.uid, id, isMovie ? 'movie' : 'series');
    setBlocked((prev) => new Set(prev).add(id));
    setIndex(0);
  };

  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const segButton = (active: boolean): React.CSSProperties => ({
    color: active ? onPrimary : currentTheme.text.secondary,
  });

  const pickSub =
    pick?.candidate.kind === 'series-next'
      ? `S${pick.candidate.seasonNumber}E${pick.candidate.episodeNumber}${
          pick.candidate.episodeName ? ` · ${pick.candidate.episodeName}` : ''
        }`
      : pick && pick.candidate.runtime
        ? t('{n} Min.', { n: pick.candidate.runtime })
        : '';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="480px" ariaLabel={t('Heute Abend')}>
      <div style={{ padding: '4px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <NightsStay style={{ fontSize: 22, color: currentTheme.primary }} />
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: currentTheme.text.primary,
            }}
          >
            {t('Was schaust du heute Abend?')}
          </h2>
        </div>

        {/* Der Vorschlag ist der Held — Kino-Karte mit Poster-Bühne */}
        {pick ? (
          <div className="tn-hero">
            {pick.candidate.poster && (
              <img
                className="tn-hero__bg"
                src={getImageUrl(pick.candidate.poster, 'w342')}
                alt=""
                aria-hidden="true"
              />
            )}
            <div className="tn-hero__scrim" />
            <div className="tn-hero__content">
              <img
                className="tn-hero__poster"
                src={getImageUrl(pick.candidate.poster, 'w185')}
                alt=""
              />
              <div className="tn-hero__info">
                <div className="tn-hero__title">{pick.candidate.title}</div>
                {pickSub && (
                  <div className="tn-hero__sub" style={{ color: currentTheme.accent }}>
                    {pickSub}
                  </div>
                )}
                <div className="tn-hero__tags">
                  {pick.reasons.map((r, i) => (
                    <span key={i}>{reasonText(r)}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="tn-hero"
            style={{
              padding: '26px 16px',
              textAlign: 'center',
              fontSize: 13,
              color: currentTheme.text.secondary,
            }}
          >
            {t('Nichts passt zu den Filtern — stell Zeit oder Stimmung um.')}
          </div>
        )}

        <div className="tn-actions" style={{ marginBottom: 20 }}>
          <button
            className="tn-go"
            onClick={handleGo}
            disabled={!pick}
            style={{ color: onPrimary }}
          >
            {t('Los geht’s')}
          </button>
          <button
            className="tn-icon"
            onClick={() => setIndex((i) => i + 1)}
            disabled={picks.length < 2}
            aria-label={t('Anderer Vorschlag')}
            style={{ color: currentTheme.text.primary }}
          >
            <Refresh style={{ fontSize: 20 }} />
          </button>
          <button
            className="tn-icon"
            onClick={handleBlock}
            disabled={!pick}
            aria-label={t('Nicht mein Ding')}
            style={{ color: currentTheme.text.secondary }}
          >
            <ThumbDown style={{ fontSize: 18 }} />
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="tn-label" style={{ color: currentTheme.text.secondary }}>
            {t('Wie viel Zeit hast du?')}
          </div>
          <div className="tn-seg">
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={prefs.time === o.value ? 'is-active' : ''}
                style={segButton(prefs.time === o.value)}
                onClick={() => updatePrefs({ time: o.value })}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="tn-label" style={{ color: currentTheme.text.secondary }}>
            {t('Wonach ist dir?')}
          </div>
          <div className="tn-chips">
            {MOOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={prefs.mood === o.value ? 'is-active' : ''}
                style={{
                  color: prefs.mood === o.value ? onPrimary : currentTheme.text.secondary,
                }}
                onClick={() => updatePrefs({ mood: o.value })}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="tn-seg">
            {TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={prefs.type === o.value ? 'is-active' : ''}
                style={segButton(prefs.type === o.value)}
                onClick={() => updatePrefs({ type: o.value })}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
          <div className="tn-seg">
            {SOURCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={prefs.source === o.value ? 'is-active' : ''}
                style={segButton(prefs.source === o.value)}
                onClick={() => updatePrefs({ source: o.value })}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
