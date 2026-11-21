import { ContinueWatchingSection } from '../HomePage/sections/ContinueWatchingSection';
import { RewatchSection } from '../HomePage/sections/RewatchSection';
import { TodayEpisodesSection } from '../HomePage/sections/TodayEpisodesSection';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';

type ContinueItem = Parameters<typeof ContinueWatchingSection>[0]['items'][number];
type RewatchItem = Parameters<typeof RewatchSection>[0]['episodes'][number];
type TodayItem = Parameters<typeof TodayEpisodesSection>[0]['episodes'][number];

const noop = () => {};
const swipe = {
  completingEpisodes: new Set<string>(),
  swipingEpisodes: new Set<string>(),
  dragOffsets: {},
  swipeDirections: {},
  onSwipeStart: noop,
  onSwipeDrag: noop,
  onSwipeEnd: noop,
  onComplete: noop,
  onPosterClick: noop,
};

const continueItem = (
  id: number,
  title: string,
  name: string,
  progress: number,
  chipType?: ContinueItem['chipType']
): ContinueItem => ({
  type: 'series',
  id,
  title,
  poster: PLACEHOLDER_SVG,
  progress,
  seasons: [],
  episodeRuntime: 24,
  nextEpisode: {
    seasonNumber: 1,
    episodeNumber: 7,
    name,
    seasonIndex: 0,
    episodeIndex: 6,
    episodeId: id * 10,
  },
  airDate: '2026-11-14',
  lastWatchedAt: '2026-11-15T19:00:00.000Z',
  genre: { genres: ['Animation'] },
  provider: { provider: [] },
  chipType,
});

const CONTINUE: ContinueItem[] = [
  continueItem(910001, 'Vorschau: Nebelküste', 'Der Dämon und das Herz', 78),
  continueItem(910002, 'Vorschau: Letzter Zug', 'Abschied', 96, 'season-finale'),
  continueItem(910003, 'Vorschau: Neue Ufer', 'Aufbruch', 4, 'season-start'),
  continueItem(910004, 'Vorschau: Halbzeit', 'Vor der Pause', 52, 'season-break'),
];

const rewatchItem = (id: number, title: string, episodeName: string, count: number) =>
  ({
    id,
    title,
    poster: PLACEHOLDER_SVG,
    seasonIndex: 4,
    episodeIndex: 9,
    seasonNumber: 5,
    episodeNumber: 10,
    episodeName,
    currentWatchCount: count,
    targetWatchCount: count + 1,
    progress: 82,
    progressCurrent: 82,
    progressTotal: 100,
    genre: { genres: ['Drama'] },
    provider: { provider: [] },
    episodeRuntime: 45,
    lastWatchedAt: '2026-11-18T19:00:00.000Z',
  }) as RewatchItem;

const REWATCH: RewatchItem[] = [
  rewatchItem(920001, 'Vorschau: Alte Liebe', 'Verdammte Karaoke-Session', 2),
  rewatchItem(920002, 'Vorschau: Dojo', 'Verwahrlost war einmal', 1),
];

const todayItem = (
  id: number,
  seriesTitle: string,
  episodeName: string,
  watched: boolean,
  chipType?: TodayItem['chipType']
): TodayItem => ({
  seriesId: String(id),
  seriesTitle,
  poster: PLACEHOLDER_SVG,
  seasonNumber: 1,
  episodeNumber: 8,
  seasonIndex: 0,
  episodeIndex: 7,
  episodeId: String(id * 10),
  episodeName,
  watched,
  runtime: 24,
  chipType,
});

const TODAY: TodayItem[] = [
  todayItem(930001, 'Vorschau: Traumland', 'Episode 8', false),
  todayItem(930002, 'Vorschau: Kriegschronik', 'Episode 8', true),
  todayItem(930003, 'Vorschau: Schlussakt', 'Das Ende', false, 'season-finale'),
  todayItem(930004, 'Vorschau: Auftakt', 'Der Anfang', false, 'season-start'),
];

export function HomeSectionColorsPreview() {
  return (
    <div style={{ padding: '16px 0', minHeight: '100vh' }}>
      <ContinueWatchingSection items={CONTINUE} hiddenEpisodes={new Set()} {...swipe} />
      <RewatchSection
        episodes={REWATCH}
        hiddenRewatches={new Set()}
        completingRewatches={swipe.completingEpisodes}
        swipingRewatches={swipe.swipingEpisodes}
        dragOffsets={swipe.dragOffsets}
        swipeDirections={swipe.swipeDirections}
        onSwipeStart={noop}
        onSwipeDrag={noop}
        onSwipeEnd={noop}
        onComplete={noop}
        onPosterClick={noop}
      />
      <TodayEpisodesSection episodes={TODAY} hiddenEpisodes={new Set()} {...swipe} />
    </div>
  );
}
