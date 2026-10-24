/**
 * Spielwiese für Staffel-Button + „Rest abhaken"-Tipp: echte Tipp-Logik,
 * aber Fake-Serie und Haken nur im lokalen State — nichts geht in die Datenbank.
 */
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Series } from '../../types/Series';
import { SeasonsSection } from '../SeriesDetail/sections/SeasonsSection';
import { filterBulkMarkable } from '../../lib/episode/releaseState';
import {
  countRemainingMarkable,
  maybeShowBulkMarkNudge,
  noteBulkMarkUsed,
  resetBulkMarkNudge,
} from '../../hooks/watch/bulkMarkNudge';
import { showToast, showUndoToast } from '../../lib/interaction/toast';
import '../SeriesDetail/SeriesDetailPage.css';
import { BulkActionBar } from '../EpisodeManagement/BulkActionBar';
import '../EpisodeManagement/EpisodeManagementPage.css';
import { ContinueWatchingSection } from '../HomePage/sections/ContinueWatchingSection';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';

type Episode = Series['seasons'][number]['episodes'][number];

const TITLES = ['Pilot', 'Der Neue', 'Schatten', 'Funkstille', 'Das Treffen', 'Zwischenspiel'];

const makeEpisodes = (season: number, released: number, upcoming: number): Episode[] =>
  Array.from({ length: released + upcoming }, (_, i) => ({
    id: season * 100 + i + 1,
    episode_number: i + 1,
    name: TITLES[i % TITLES.length],
    air_date: i < released ? `2024-${String((i % 12) + 1).padStart(2, '0')}-10` : '2099-01-01',
    watched: false,
    watchCount: 0,
  })) as unknown as Episode[];

const makeSeries = (): Series =>
  ({
    id: 900001,
    title: 'Vorschau-Serie',
    seasons: [
      { seasonNumber: 0, episodes: makeEpisodes(0, 10, 0) },
      { seasonNumber: 1, episodes: makeEpisodes(1, 8, 2) },
    ],
  }) as unknown as Series;

const mapSeason = (series: Series, seasonIndex: number, fn: (eps: Episode[]) => Episode[]) => ({
  ...series,
  seasons: series.seasons.map((s, i) =>
    i === seasonIndex ? { ...s, episodes: fn(s.episodes ?? []) } : s
  ),
});

export function SeasonMarkNudgePreview() {
  const { currentTheme } = useTheme();
  const [series, setSeries] = useState<Series>(makeSeries);
  const [seasonIndex, setSeasonIndex] = useState(0);

  useEffect(() => resetBulkMarkNudge(), []);

  const reset = () => {
    resetBulkMarkNudge();
    setSeries(makeSeries());
    showToast('Zurückgesetzt', 1200, 'info');
  };

  const markRest = (sIdx: number) => {
    setSeries((prev) => {
      const markable = new Set(filterBulkMarkable(prev.seasons[sIdx]?.episodes ?? []));
      return mapSeason(prev, sIdx, (eps) =>
        eps.map((ep) =>
          markable.has(ep) && !ep.watched ? { ...ep, watched: true, watchCount: 1 } : ep
        )
      );
    });
    noteBulkMarkUsed();
    showToast(`Staffel ${sIdx + 1} als gesehen markiert`, 2000, 'success');
  };

  const toggle = async (sIdx: number, eIdx: number) => {
    const season = series.seasons[sIdx];
    const episode = season?.episodes?.[eIdx];
    if (!season || !episode) return;
    const nowWatched = !episode.watched;
    const setWatched = (watched: boolean) =>
      setSeries((prev) =>
        mapSeason(prev, sIdx, (eps) =>
          eps.map((ep, i) => (i === eIdx ? { ...ep, watched, watchCount: watched ? 1 : 0 } : ep))
        )
      );
    setWatched(nowWatched);
    showUndoToast(
      `Vorschau-Serie S${sIdx + 1}E${eIdx + 1} ${nowWatched ? 'als gesehen markiert' : 'als nicht gesehen markiert'}`,
      () => setWatched(!nowWatched)
    );
    if (nowWatched) {
      maybeShowBulkMarkNudge({
        seriesId: series.id,
        seasonIndex: sIdx,
        remaining: countRemainingMarkable(season, episode.id),
        onOpenSeasonTools: () =>
          showToast(`Würde jetzt die Episodenübersicht öffnen (Staffel ${sIdx + 1})`, 2500, 'info'),
      });
    }
  };

  return (
    <div style={{ padding: 12, background: currentTheme.background.default, minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          fontSize: 13,
          color: currentTheme.text.secondary,
        }}
      >
        <span>
          5 Folgen einer Staffel einzeln abhaken (Nummern-Kästchen) — beim 5. kommt der Tipp. Alles
          nur lokal.
        </span>
        <button
          type="button"
          onClick={reset}
          style={{
            flexShrink: 0,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>
      </div>
      <SeasonsSection
        series={series as never}
        selectedSeasonIndex={seasonIndex}
        setSelectedSeasonIndex={setSeasonIndex}
        setShowRewatchDialog={() => {}}
        episodeDiscussionCounts={{}}
        warningColor={currentTheme.status.warning}
        currentTheme={currentTheme}
        handleStopRewatch={() => {}}
        handleStartRewatch={() => {}}
        handleEpisodeQuickToggle={toggle}
        onMarkSeasonWatched={markRest}
        navigate={(() => {}) as never}
      />
    </div>
  );
}

export function BulkHighlightPreview() {
  const [run, setRun] = useState(0);
  return (
    <div className="mobile-episode-page" style={{ minHeight: '100vh' }}>
      <BulkActionBar
        key={run}
        seasonNumber={1}
        seasonProgress={{
          watchedCount: 5,
          totalCount: 10,
          allWatched: false,
          seasonMinWatchCount: 0,
          progress: 50,
        }}
        selectedSeason={0}
        onSeasonToggle={() => {}}
        onMarkAll={() => {}}
        onCatchUp={() => {}}
        highlight
      />
      <div style={{ padding: 16 }}>
        <button type="button" onClick={() => setRun((n) => n + 1)}>
          Hervorhebung erneut abspielen
        </button>
      </div>
    </div>
  );
}

type ContinueItem = Parameters<typeof ContinueWatchingSection>[0]['items'][number];

const HOME_SERIES = [
  { id: 900101, title: 'Vorschau: Dark Harbor' },
  { id: 900102, title: 'Vorschau: Kleine Stadt' },
];

const makeHomeSeries = (): Series[] =>
  HOME_SERIES.map(
    ({ id, title }) =>
      ({
        id,
        title,
        poster: { poster: PLACEHOLDER_SVG },
        episodeRuntime: 45,
        genre: { genres: ['Drama'] },
        provider: { provider: [] },
        seasons: [
          {
            seasonNumber: 0,
            episodes: makeEpisodes(0, 10, 0).map((ep, i) =>
              i === 0
                ? { ...ep, watched: true, watchCount: 1, lastWatchedAt: new Date().toISOString() }
                : ep
            ),
          },
          { seasonNumber: 1, episodes: makeEpisodes(1, 8, 0) },
        ],
      }) as unknown as Series
  );

function toContinueItem(series: Series): ContinueItem | null {
  for (const [seasonIndex, season] of series.seasons.entries()) {
    const markable = new Set(filterBulkMarkable(season.episodes ?? []));
    const episodeIndex = (season.episodes ?? []).findIndex((ep) => !ep.watched && markable.has(ep));
    if (episodeIndex === -1) continue;
    const ep = season.episodes[episodeIndex];
    const watched = series.seasons.flatMap((s) => s.episodes ?? []).filter((e) => e.watched);
    const total = series.seasons.flatMap((s) => s.episodes ?? []).length;
    return {
      type: 'series',
      id: series.id,
      title: series.title,
      poster: PLACEHOLDER_SVG,
      progress: Math.round((watched.length / total) * 100),
      seasons: series.seasons,
      episodeRuntime: 45,
      nextEpisode: {
        seasonNumber: season.seasonNumber + 1,
        episodeNumber: episodeIndex + 1,
        name: ep.name ?? '',
        seasonIndex,
        episodeIndex,
        episodeId: ep.id as number,
      },
      airDate: String(ep.air_date ?? ''),
      lastWatchedAt: new Date().toISOString(),
      genre: series.genre,
      provider: series.provider,
    };
  }
  return null;
}

export function HomeNudgePreview() {
  const [series, setSeries] = useState<Series[]>(makeHomeSeries);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [swiping, setSwiping] = useState<Set<string>>(new Set());
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const [directions, setDirections] = useState<Record<string, 'left' | 'right'>>({});

  useEffect(() => resetBulkMarkNudge(), []);

  const items = series.map(toContinueItem).filter((i): i is ContinueItem => i !== null);

  const setEpisodeWatched = (seriesId: number, sIdx: number, eIdx: number, watched: boolean) =>
    setSeries((prev) =>
      prev.map((s) =>
        s.id === seriesId
          ? mapSeason(s, sIdx, (eps) =>
              eps.map((ep, i) =>
                i === eIdx ? { ...ep, watched, watchCount: watched ? 1 : 0 } : ep
              )
            )
          : s
      )
    );

  const complete = (item: ContinueItem, direction: 'left' | 'right') => {
    const key = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
    const { seasonIndex, episodeIndex, episodeId } = item.nextEpisode;
    setDirections((prev) => ({ ...prev, [key]: direction }));
    setCompleting((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setHidden((prev) => new Set(prev).add(key));
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setEpisodeWatched(item.id, seasonIndex, episodeIndex, true);
    }, 300);
    showUndoToast(
      `${item.title} S${item.nextEpisode.seasonNumber}E${item.nextEpisode.episodeNumber} als gesehen markiert`,
      () => {
        setEpisodeWatched(item.id, seasonIndex, episodeIndex, false);
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    );
    const fullSeries = series.find((s) => s.id === item.id);
    maybeShowBulkMarkNudge({
      seriesId: item.id,
      seasonIndex,
      remaining: countRemainingMarkable(fullSeries?.seasons[seasonIndex], episodeId),
      onOpenSeasonTools: () =>
        showToast(
          `Würde jetzt die Episodenübersicht öffnen (Staffel ${seasonIndex + 1})`,
          2500,
          'info'
        ),
    });
  };

  const reset = () => {
    resetBulkMarkNudge();
    setSeries(makeHomeSeries());
    setHidden(new Set());
    showToast('Zurückgesetzt', 1200, 'info');
  };

  return (
    <div style={{ padding: '12px 0', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 12px 16px',
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        <span>Dieselbe Serie 5-mal wegwischen — beim 5. kommt der Tipp. Alles nur lokal.</span>
        <button
          type="button"
          onClick={reset}
          style={{
            flexShrink: 0,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Zurücksetzen
        </button>
      </div>
      <ContinueWatchingSection
        items={items}
        hiddenEpisodes={hidden}
        completingEpisodes={completing}
        swipingEpisodes={swiping}
        dragOffsets={offsets}
        swipeDirections={directions}
        onSwipeStart={(key) => setSwiping((prev) => new Set(prev).add(key))}
        onSwipeDrag={(key, offset) => setOffsets((prev) => ({ ...prev, [key]: offset }))}
        onSwipeEnd={(key) => {
          setSwiping((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setOffsets((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }}
        onComplete={complete}
        onPosterClick={() => {}}
      />
    </div>
  );
}
