import { useState } from 'react';
import { CarouselNotification } from '../../components/ui/notification/CarouselNotification';
import '../../components/ui/notification/CarouselNotification.css';
import { AnimeMangaHandoffNotification } from '../../components/ui/notification/AnimeMangaHandoffNotification';
import { ProviderChangeNotification } from '../../components/ui/notification/ProviderChangeNotification';
import { UnsubscribedNewSeasonNotification } from '../../components/ui/notification/UnsubscribedNewSeasonNotification';
import { ProactiveRecapCard } from '../HomePage/cards/ProactiveRecapCard';
import { SeriesListContext, useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Series } from '../../types/Series';

const DAY = 24 * 60 * 60 * 1000;
const TMDB = (path: string) => `https://image.tmdb.org/t/p/w342${path}`;

const makeSeries = (
  id: number,
  title: string,
  poster: string,
  backdrop: string,
  watched: number,
  total: number,
  daysAgo: number,
  over: Partial<Series> = {}
): Series =>
  ({
    id,
    title,
    original_name: title,
    poster: { poster: TMDB(poster) },
    backdrop,
    watchlist: true,
    seasonCount: 2,
    genre: { genres: ['Drama'] },
    seasons: [
      {
        seasonNumber: 0,
        episodes: Array.from({ length: total }, (_, i) => ({
          id: id * 1000 + i,
          episode_number: i + 1,
          name: `Folge ${i + 1}`,
          air_date: '2020-01-01',
          watched: i < watched,
          watchCount: i < watched ? 1 : 0,
          lastWatchedAt: i < watched ? new Date(Date.now() - daysAgo * DAY).toISOString() : '',
        })),
      },
    ],
    ...over,
  }) as unknown as Series;

const SOPRANOS = makeSeries(
  1398,
  'Die Sopranos',
  '/57okJJUBK0AaijxLh3RjNUaMvFI.jpg',
  '/lNpkvX2s8LGB0mjGODMT4o6Up7j.jpg',
  23,
  86,
  130
);
const SEVERANCE = makeSeries(
  95396,
  'Severance',
  '/Rb7sga832Cyqvafd7CqOzbwdK4.jpg',
  '/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
  9,
  19,
  45
);
const BEAR = makeSeries(
  136315,
  'The Bear: King of the Kitchen',
  '/i6sJI3O1874FBdDtM0jn6fpPE0x.jpg',
  '/aJtG4txtmiRHwAAqENQHZvBs6kY.jpg',
  14,
  38,
  70
);
const ARCANE = makeSeries(
  94605,
  'Arcane',
  '/a36DmrKhgh1MexagX6bTmb9bZqn.jpg',
  '/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg',
  18,
  18,
  12
);
const LOKI = makeSeries(
  84958,
  'Loki',
  '/oJdVHUYrjdS2IqiNztVIP4GPB1p.jpg',
  '/q3jHCb4dMfYF6ojikKuHd6LscxC.jpg',
  12,
  12,
  3,
  { watchlist: false, seasonCount: 3 }
);

type DeckVariant = React.ComponentProps<typeof CarouselNotification>['variant'];

const DeckHost = ({ initial, variant }: { initial: Series[]; variant: DeckVariant }) => {
  const { currentTheme } = useTheme();
  const base = useSeriesList();
  const [series, setSeries] = useState(initial);
  return (
    <SeriesListContext.Provider
      value={{
        ...base,
        resolveSeriesNotification: (_lists, id) =>
          setSeries((prev) => prev.filter((s) => s.id !== id)),
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          paddingTop: 24,
          background: currentTheme.background.default,
          color: currentTheme.text.primary,
        }}
      >
        <div className="notif-hub">
          <CarouselNotification series={series} variant={variant} onDismiss={() => setSeries([])} />
        </div>
      </div>
    </SeriesListContext.Provider>
  );
};

export const HintDeckSinglePreview = () => <DeckHost initial={[SOPRANOS]} variant="inactive" />;

export const HintDeckMultiPreview = () => (
  <DeckHost initial={[SOPRANOS, SEVERANCE, BEAR]} variant="inactive" />
);

export const HintDeckNewSeasonPreview = () => (
  <DeckHost initial={[LOKI, SEVERANCE]} variant="new-season" />
);

export const HintDeckUnratedPreview = () => (
  <DeckHost initial={[ARCANE, SEVERANCE]} variant="unrated" />
);

const withProviders = (series: Series, names: [string, string][]): Series =>
  ({
    ...series,
    provider: { provider: names.map(([name, logo], i) => ({ id: i + 1, name, logo })) },
  }) as unknown as Series;

const FRIEREN = makeSeries(
  209867,
  'Frieren - Nach dem Ende der Reise',
  '/dDRiOkCBCkd7w6ysMFr39G16opQ.jpg',
  '/rBOnrVlck7BIlGeWVlzYiZeg4l2.jpg',
  28,
  28,
  2
);
const SOLO = makeSeries(
  127532,
  'Solo Leveling',
  '/a7i9OdTUo9jZ1XoraCRIQNJ6ACX.jpg',
  '/xMNH87maNLt9n2bMDYeI6db5VFm.jpg',
  25,
  25,
  5
);

const NETFLIX: [string, string] = ['Netflix', '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg'];
const DISNEY: [string, string] = ['Disney Plus', '/97yvRBw1GzX7fXprcF80er19ot.jpg'];

const PreviewPage = ({ children }: { children: React.ReactNode }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        minHeight: '100vh',
        paddingTop: 24,
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
      }}
    >
      <div className="notif-hub">{children}</div>
    </div>
  );
};

export const HintProviderPreview = () => (
  <PreviewPage>
    <ProviderChangeNotification
      onDismiss={() => {}}
      changes={[
        {
          series: withProviders(SEVERANCE, [NETFLIX]),
          addedProviders: ['Netflix'],
          removedProviders: [],
          currentProviders: ['Netflix'],
        },
        {
          series: withProviders(BEAR, [DISNEY]),
          addedProviders: ['Disney Plus'],
          removedProviders: ['Apple TV Plus'],
          currentProviders: ['Disney Plus'],
        },
      ]}
    />
  </PreviewPage>
);

export const HintHiddenProviderPreview = () => (
  <PreviewPage>
    <ProviderChangeNotification
      variant="hidden"
      onDismiss={() => {}}
      onUnhide={() => {}}
      changes={[
        {
          series: withProviders(SOPRANOS, [NETFLIX]),
          addedProviders: ['Netflix'],
          removedProviders: [],
          currentProviders: ['Netflix'],
        },
      ]}
    />
  </PreviewPage>
);

export const HintUnsubscribedPreview = () => (
  <PreviewPage>
    <UnsubscribedNewSeasonNotification
      onDismiss={() => {}}
      entries={[
        { series: LOKI, providers: ['Disney Plus'] },
        { series: SEVERANCE, providers: ['Apple TV Plus'] },
      ]}
    />
  </PreviewPage>
);

export const HintAnimeMangaPreview = () => (
  <PreviewPage>
    <AnimeMangaHandoffNotification
      onDismiss={() => {}}
      handoffs={[
        {
          series: FRIEREN,
          seasonNumber: 1,
          mangaId: 118586,
          mangaTitle: 'Frieren',
          totalChapters: 140,
          estimatedChapter: 61,
        },
        {
          series: SOLO,
          seasonNumber: 2,
          mangaId: 105398,
          mangaTitle: 'Solo Leveling',
          totalChapters: 200,
          estimatedChapter: 110,
        },
      ]}
    />
  </PreviewPage>
);

const RECAP_TEXT = [
  '• Mark entdeckt, dass Helly die Tochter des Lumon-Erben ist.',
  '• Die Innies schaffen es kurz in die Außenwelt und erzählen, was im Büro passiert.',
  '• Irving findet Burt, Dylan sieht sein Kind.',
].join('\n');

export const HintRecapPreview = () => (
  <PreviewPage>
    <ProactiveRecapCard
      onDismiss={() => {}}
      onFetchRecap={async () => {}}
      recaps={[
        {
          seriesId: 95396,
          seriesTitle: 'Severance',
          posterUrl: TMDB('/Rb7sga832Cyqvafd7CqOzbwdK4.jpg'),
          triggerType: 'new-season',
          startsToday: true,
          seasonNumber: 3,
          recap: RECAP_TEXT,
          loading: false,
          cacheKey: 'sev-3',
        },
      ]}
    />
  </PreviewPage>
);
