/**
 * Vorschau-Zustände für die neuen Sektionen. Nur im Dev-Server sichtbar
 * (`/dev/ui-preview`) — echte Daten liegen erst vor, wenn genug geschaut wurde
 * bzw. das Backend das Abbruch-Aggregat schreibt.
 */

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ProviderChangeNotification } from '../../components/ui/notification/ProviderChangeNotification';
import { ProfileItemCard } from '../../components/ui/item/ProfileItemCard';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import { CatchUpPlanNote } from '../Countdown/CatchUpPlanNote';
import { DropOffView } from '../SeriesDetail/sections/DropOffSection';
import type { CatchUpPlan, CatchUpVariant } from '../../lib/watch/catchUpPlan';
import type { DropOffInsight } from '../../lib/watch/dropOff';
import { SingleEpisodeCard, EpisodeGroupCard } from '../Calendar/EpisodeCard';
import {
  DateGroupHeader,
  MovieCard,
  SearchBar as HistorySearchBar,
  SeriesAccordion,
  SingleEpisodeCard as HistoryEpisodeCard,
  TimeRangeChips as HistoryTimeChips,
} from '../RecentlyWatched/RecentlyWatchedComponents';
import type { WatchedEpisode, WatchedMovie } from '../RecentlyWatched/EpisodeDataManager';
import { CalendarViewModeContext } from '../Calendar/calendarViewMode';
import type { WeeklyEpisode } from '../../hooks/watch/useWeeklyEpisodes';
import '../Countdown/CountdownPage.css';
import '../Calendar/CalendarPage.css';
import '../RecentlyWatched/RecentlyWatchedPage.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

const variant = (over: Partial<CatchUpVariant> = {}): CatchUpVariant => ({
  episodes: 41,
  hours: 28,
  projectedDate: inDays(133),
  willMakeIt: false,
  daysLate: 86,
  ...over,
});

const plan = (over: Partial<CatchUpPlan> = {}): CatchUpPlan => ({
  shouldShow: true,
  daysUntilTarget: 47,
  episodesPerWeek: 4.2,
  requiredPerWeek: 6.1,
  current: variant(),
  withoutFiller: null,
  fillerSavesIt: false,
  ...over,
});

const insight = (over: Partial<DropOffInsight> = {}): DropOffInsight => ({
  shouldShow: true,
  decided: 143,
  completionRate: 0.29,
  seasons: [
    { seasonNumber: 1, quitters: 12, share: 0.08 },
    { seasonNumber: 2, quitters: 61, share: 0.43 },
    { seasonNumber: 3, quitters: 20, share: 0.14 },
    { seasonNumber: 4, quitters: 8, share: 0.06 },
  ],
  worstSeason: { seasonNumber: 2, quitters: 61, share: 0.43 },
  holdPoint: { episodeNumber: 6, completionAfter: 0.89 },
  ...over,
});

const Case = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          margin: '0 0 6px 0',
          color: currentTheme.text.muted,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
};

/** Aufhol-Plan: die Zeile unter einem Countdown, in allen Ausprägungen. */
export const CatchUpPreview = () => (
  <div style={{ padding: 16 }}>
    <Case label="Tempo reicht nicht">
      <CatchUpPlanNote plan={plan()} />
    </Case>

    <Case label="Filler-Verzicht rettet den Termin">
      <CatchUpPlanNote
        plan={plan({
          current: variant({ episodes: 30, daysLate: 24 }),
          withoutFiller: variant({ episodes: 19, willMakeIt: true, daysLate: 0 }),
          fillerSavesIt: true,
        })}
      />
    </Case>

    <Case label="Filler hilft, reicht aber nicht">
      <CatchUpPlanNote
        plan={plan({
          withoutFiller: variant({ episodes: 30, daysLate: 40 }),
        })}
      />
    </Case>

    <Case label="Rechtzeitig durch">
      <CatchUpPlanNote
        plan={plan({
          requiredPerWeek: 1.2,
          current: variant({
            episodes: 6,
            willMakeIt: true,
            daysLate: 0,
            projectedDate: inDays(10),
          }),
        })}
      />
    </Case>

    <Case label="Kein Tempo messbar (pausiert)">
      <CatchUpPlanNote
        plan={plan({ episodesPerWeek: 0, current: variant({ projectedDate: null }) })}
      />
    </Case>

    <Case label="Kompakt (Listeneintrag)">
      <CatchUpPlanNote plan={plan()} compact />
    </Case>
  </div>
);

/** Aussteiger-Radar: Sektion auf der Serien-Detailseite. Kopfzeile klappt auf. */
export const DropOffPreview = () => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ padding: 16 }}>
      <Case label="Serie bricht in Staffel 2 weg (aufklappbar)">
        <DropOffView insight={insight()} currentTheme={currentTheme} isMobile={false} />
      </Case>

      <Case label="Hält ihr Publikum">
        <DropOffView
          insight={insight({
            completionRate: 0.82,
            worstSeason: null,
            holdPoint: null,
            seasons: [
              { seasonNumber: 1, quitters: 9, share: 0.06 },
              { seasonNumber: 2, quitters: 7, share: 0.05 },
            ],
          })}
          currentTheme={currentTheme}
          isMobile={false}
        />
      </Case>

      <Case label="Harter Einstieg, danach stabil">
        <DropOffView
          insight={insight({
            completionRate: 0.55,
            worstSeason: null,
            holdPoint: { episodeNumber: 3, completionAfter: 0.91 },
          })}
          currentTheme={currentTheme}
          isMobile={false}
        />
      </Case>

      <Case label="Zu wenig Daten (rendert nichts)">
        <DropOffView insight={null} currentTheme={currentTheme} isMobile={false} />
      </Case>
    </div>
  );
};

/* Provider-Wechsel bei ausgeblendeten Serien — Angebot zum Wiedereinblenden. */

const POSTER = PLACEHOLDER_SVG;

const hiddenChange = (id: number, title: string, providers: string[]) => ({
  series: { id, title, poster: { poster: POSTER } },
  addedProviders: providers,
  removedProviders: [],
  currentProviders: providers,
});

export const UnhideProviderPreview = () => (
  <div style={{ padding: 16 }}>
    <Case label="Eine ausgeblendete Serie ist zurueck">
      <ProviderChangeNotification
        variant="hidden"
        changes={[hiddenChange(1, 'The Expanse', ['Amazon Prime Video'])]}
        onDismiss={() => {}}
        onUnhide={() => {}}
      />
    </Case>

    <Case label="Mehrere — mit Karussell und langem Titel">
      <ProviderChangeNotification
        variant="hidden"
        changes={[
          hiddenChange(2, 'Der Herr der Ringe: Die Ringe der Macht', ['Amazon Prime Video']),
          hiddenChange(3, 'Dark', ['Netflix', 'Joyn Plus']),
          hiddenChange(4, 'Fringe', ['Disney Plus']),
        ]}
        onDismiss={() => {}}
        onUnhide={() => {}}
      />
    </Case>

    <Case label="Zum Vergleich: normaler Provider-Wechsel">
      <ProviderChangeNotification
        changes={[hiddenChange(5, 'Severance', ['Apple TV Plus'])]}
        onDismiss={() => {}}
      />
    </Case>
  </div>
);

/* Freundesprofil: Titel des Freundes in die eigene Liste uebernehmen. */

const provider = (name: string) => ({ id: 1, name, logo: POSTER });

export const FriendAddCardPreview = () => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ padding: 16 }}>
      <Case label="Karten-Raster wie auf dem Freundesprofil">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          <ProfileItemCard
            title="Dark"
            posterUrl={POSTER}
            isMovie={false}
            rating={9.1}
            progress={64}
            providers={[provider('Netflix')]}
            year="2017"
            genres="Mystery"
            currentTheme={currentTheme}
            onClick={() => {}}
            onAdd={() => {}}
          />
          <ProfileItemCard
            title="Severance"
            posterUrl={POSTER}
            isMovie={false}
            rating={8.7}
            providers={[provider('Apple TV Plus'), provider('Netflix')]}
            year="2022"
            genres="Drama"
            currentTheme={currentTheme}
            onClick={() => {}}
            inList
            onAdd={() => {}}
          />
          <ProfileItemCard
            title="Der Herr der Ringe: Die Gefaehrten"
            posterUrl={POSTER}
            isMovie
            rating={9.4}
            providers={[]}
            year="2001"
            genres="Fantasy"
            currentTheme={currentTheme}
            onClick={() => {}}
            adding
            onAdd={() => {}}
          />
          <ProfileItemCard
            title="Ohne Hinzufuegen-Knopf"
            posterUrl={POSTER}
            isMovie={false}
            rating={7.2}
            providers={[provider('Disney Plus')]}
            year="2019"
            genres="Action"
            currentTheme={currentTheme}
            onClick={() => {}}
          />
        </div>
      </Case>
    </div>
  );
};

const folge = (over: Partial<WeeklyEpisode> = {}): WeeklyEpisode => ({
  seriesId: 95396,
  seriesTitle: 'Severance',
  poster: PLACEHOLDER_SVG,
  seasonNumber: 2,
  episodeNumber: 7,
  episodeName: 'Chikhai Bardo',
  airDate: '2026-09-18',
  watched: false,
  seasonIndex: 1,
  episodeIndex: 6,
  runtime: 48,
  providerNames: [],
  providers: [],
  userRating: 0,
  ...over,
});

const addSlot = (zustand: 'frei' | 'laeuft' | 'drin') => ({
  inList: () => zustand === 'drin',
  adding: () => zustand === 'laeuft',
  add: () => {},
});

/** Fremder Kalender: der Knopf, der eine Serie in die eigene Liste holt. */
export const FriendCalendarAddPreview = () => (
  <div style={{ padding: 16 }}>
    {(['frei', 'laeuft', 'drin'] as const).map((zustand) => (
      <Case
        key={zustand}
        label={
          zustand === 'frei'
            ? 'Noch nicht in meiner Liste'
            : zustand === 'laeuft'
              ? 'Wird hinzugefügt'
              : 'Schon in meiner Liste'
        }
      >
        <CalendarViewModeContext.Provider value={{ readOnly: true, addToList: addSlot(zustand) }}>
          <div className="cal-day-episodes" style={{ display: 'grid', gap: 10, maxWidth: 300 }}>
            <SingleEpisodeCard
              ep={folge({ userRating: 8.4 })}
              backdropSrc={undefined}
              onMarkWatched={() => {}}
              onRateSeries={() => {}}
            />
            <SingleEpisodeCard
              ep={folge({ watched: true, episodeNumber: 6, episodeName: 'Attila' })}
              backdropSrc={undefined}
              onMarkWatched={() => {}}
              onRateSeries={() => {}}
            />
            <EpisodeGroupCard
              group={{
                seriesId: 1396,
                seriesTitle: 'Breaking Bad',
                episodes: [
                  folge({ seriesId: 1396, seriesTitle: 'Breaking Bad', episodeNumber: 3 }),
                  folge({
                    seriesId: 1396,
                    seriesTitle: 'Breaking Bad',
                    episodeNumber: 4,
                    episodeIndex: 3,
                    watched: true,
                  }),
                ],
              }}
              backdropSrc={undefined}
              isExpanded={false}
              onToggle={() => {}}
              onMarkWatched={() => {}}
              onRateSeries={() => {}}
            />
          </div>
        </CalendarViewModeContext.Provider>
      </Case>
    ))}
  </div>
);

/** Verlauf: ein Tag mit Folgen und Filmen nebeneinander. */
const historyEpisode: WatchedEpisode = {
  seriesId: 1396,
  seriesName: 'Breaking Bad',
  seriesPoster: PLACEHOLDER_SVG,
  seasonIndex: 2,
  episodeIndex: 6,
  episodeName: 'Fly',
  episodeNumber: 10,
  seasonNumber: 3,
  firstWatchedAt: new Date(),
  watchCount: 1,
  daysAgo: 0,
  dateSource: 'firstWatched',
};

const historyMovie = (over: Partial<WatchedMovie> = {}): WatchedMovie => ({
  movieId: 693134,
  title: 'Dune: Part Two',
  poster: PLACEHOLDER_SVG,
  watchedAt: new Date(),
  daysAgo: 0,
  rating: 9.2,
  runtime: 167,
  year: '2024',
  dateSource: 'watched',
  ...over,
});

export const HistoryMoviesPreview = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('dune');
  const [days, setDays] = useState(30);
  const group = [
    { ...historyEpisode, episodeName: 'Fly', episodeNumber: 10, episodeIndex: 9 },
    { ...historyEpisode, episodeName: 'Half Measures', episodeNumber: 12, episodeIndex: 11 },
    {
      ...historyEpisode,
      episodeName: 'Full Measure',
      episodeNumber: 13,
      episodeIndex: 12,
      watchCount: 3,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* content-visibility haelt die Karten im Screenshot leer */}
      <style>{'.rw-card { content-visibility: visible; }'}</style>

      <div style={{ margin: '0 -16px 18px' }}>
        <HistorySearchBar searchQuery={query} onSearchChange={setQuery} />
        <HistoryTimeChips
          timeRanges={[
            { days: 7, label: '7 Tage' },
            { days: 30, label: '30 Tage' },
            { days: 90, label: '3 Monate' },
          ]}
          daysToShow={days}
          onTimeRangeChange={setDays}
        />
      </div>

      <div className="rw-group">
        <DateGroupHeader displayDate="Heute" episodeCount={1} movieCount={2} />
        <div className="rw-cards">
          <HistoryEpisodeCard
            episode={{
              ...historyEpisode,
              seriesName: 'Die Verräter — Vertraue Niemandem',
              episodeName: 'Folge 8',
              seasonNumber: 4,
              episodeNumber: 8,
            }}
            isCompleting={false}
            onRewatch={() => {}}
            onNavigateToSeries={() => {}}
            onNavigateToEpisode={() => {}}
            onNavigateToDiscussion={() => {}}
          />
          <HistoryEpisodeCard
            episode={historyEpisode}
            isCompleting={false}
            onRewatch={() => {}}
            onNavigateToSeries={() => {}}
            onNavigateToEpisode={() => {}}
            onNavigateToDiscussion={() => {}}
          />
          <MovieCard movie={historyMovie()} onNavigateToMovie={() => {}} />
          <MovieCard
            movie={historyMovie({
              movieId: 27205,
              title: 'Ein sehr langer Filmtitel, der umbrechen müsste',
              rating: 0,
              runtime: undefined,
              dateSource: 'rated',
            })}
            onNavigateToMovie={() => {}}
          />
        </div>
      </div>

      <div className="rw-group">
        <DateGroupHeader displayDate="Gestern" episodeCount={3} movieCount={1} />
        <div className="rw-cards">
          <SeriesAccordion
            seriesId={1396}
            episodes={group}
            dateKey="gestern"
            isExpanded={!open}
            completingEpisodes={new Set()}
            onToggle={() => setOpen((v) => !v)}
            onRewatch={() => {}}
            onNavigateToSeries={() => {}}
            onNavigateToEpisode={() => {}}
            onNavigateToDiscussion={() => {}}
          />
          <MovieCard
            movie={historyMovie({ movieId: 155, title: 'The Dark Knight', rating: 8.7 })}
            onNavigateToMovie={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
