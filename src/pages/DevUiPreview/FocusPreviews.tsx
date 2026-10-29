import { useMemo, useState } from 'react';
import { MangaListContext } from '../../contexts/MangaListContext';
import { ReadingGreetingTitle } from '../../components/reading/ReadingGreetingTitle';
import { useBookYear } from '../Books/hooks/useBookYear';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import type { AppFocus } from '../../services/settings/appFocus';
import type { Manga } from '../../types/Manga';
import { GreetingSection } from '../HomePage/sections/GreetingSection';
import { ReadingHomeSections } from '../HomePage/sections/ReadingHomeSections';
import { ActsProvider, actsFor } from '../Onboarding/data/acts';
import type {
  ReadingItem,
  ReadingPick,
  ReadingPickStatus,
} from '../Onboarding/hooks/useReadingPicks';
import '../Onboarding/onboarding.css';
import { FocusStep } from '../Onboarding/steps/FocusStep';
import { ReadingStep } from '../Onboarding/steps/ReadingStep';
import { WelcomeStep } from '../Onboarding/steps/WelcomeStep';
import { AppearanceSection } from '../Settings/sections/AppearanceSection';
import '../Settings/SettingsPage.css';
import { BooksPreviewShell } from './BooksPreviews';

const MANGA: Manga[] = [
  ['Frieren', 120, 'reading'],
  ['Dandadan', 98, 'reading'],
  ['Blue Lock', 210, 'reading'],
  ['Vinland Saga', 210, 'completed'],
].map(([title, chapter, status], i) => ({
  nmr: i + 1,
  anilistId: 9000 + i,
  title: String(title),
  poster: PLACEHOLDER_SVG,
  rating: {},
  currentChapter: Number(chapter),
  readStatus: status as Manga['readStatus'],
  lastReadAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  completedAt: status === 'completed' ? '2026-03-02T10:00:00.000Z' : undefined,
}));

const NO_MANGA: Manga[] = [];

const CATCHUP_MANGA: Manga[] = [
  ['Omniscient Reader', 0, 311],
  ['The Lone Necromancer', 25, 223],
  ['Not Your Typical Reincarnation Story', 9, 115],
  ['The Perfect Hybrid', 51, 153],
  ['The Northern Warrior’s Beloved Bride', 4, 64],
  ['How to Put Your Savior on the Throne', 12, 98],
  ['The Villainess is a Marionette', 45, 112],
].map(([title, chapter, total], i) => ({
  nmr: i + 1,
  anilistId: 9100 + i,
  title: String(title),
  poster: PLACEHOLDER_SVG,
  rating: {},
  chapters: Number(total),
  currentChapter: Number(chapter),
  readStatus: 'reading' as const,
  lastReadAt: new Date(Date.now() - i * 86_400_000).toISOString(),
}));

const ReadingHomePreviewSections = () => {
  const bookYear = useBookYear();
  return <ReadingHomeSections areas="both" bookYear={bookYear} onSearch={() => {}} />;
};

/** Startseite beim Schwerpunkt „Manga & Bücher"; `?empty=1` zeigt den Leerzustand. */
export const ReadingHomePreview = () => {
  const empty = new URLSearchParams(window.location.search).get('empty') === '1';
  const manga = empty ? NO_MANGA : MANGA;
  const ctx = useMemo(
    () => ({
      mangaList: manga,
      allMangaList: manga,
      hiddenMangaList: [],
      loading: false,
      refetchManga: () => {},
      toggleHideManga: async () => {},
      isOffline: false,
      isStale: false,
    }),
    [manga]
  );
  return (
    <BooksPreviewShell>
      <MangaListContext.Provider value={ctx}>
        <GreetingSection
          displayName="Bärbel"
          photoURL={undefined}
          totalUnreadBadge={2}
          onNotificationsOpen={() => {}}
          pods={[
            { key: 'books', value: 12, label: 'Bücher', to: '/books', highlight: false },
            { key: 'manga', value: manga.length, label: 'Manga', to: '/manga', highlight: false },
          ]}
          searchHint="Bücher und Manga suchen..."
          onSearch={() => {}}
          title={<ReadingGreetingTitle displayName="Bärbel" areas="both" onSearch={() => {}} />}
        />
        <ReadingHomePreviewSections />
      </MangaListContext.Provider>
    </BooksPreviewShell>
  );
};

/** Onboarding-Auftakt: Wofür bist du hier? */
export const OnboardingFocusPreview = () => {
  const [focus, setFocus] = useState<AppFocus | null>('read');
  return (
    <div className="ob-root" style={{ height: '100vh' }}>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <FocusStep focus={focus} onChange={setFocus} onNext={() => {}} />
      </div>
    </div>
  );
};

/** Lese-Akt mit echten Vorschlägen; `?optional=1` zeigt die Variante für Serien-Nutzer. */
export const OnboardingReadingPreview = () => {
  const optional = new URLSearchParams(window.location.search).get('optional') === '1';
  const [picks, setPicks] = useState<Map<string, ReadingPick>>(new Map());
  const toggle = (item: ReadingItem) =>
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.set(item.key, { ...item, status: item.kind === 'book' ? 'completed' : 'reading' });
      return next;
    });
  const setStatus = (key: string, status: ReadingPickStatus) =>
    setPicks((prev) => {
      const pick = prev.get(key);
      return pick ? new Map(prev).set(key, { ...pick, status }) : prev;
    });
  return (
    <div className="ob-root" style={{ height: '100vh' }}>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <ActsProvider value={actsFor(optional ? 'watch' : 'read')}>
          <ReadingStep
            genreSlugs={['crime', 'scifi']}
            picks={picks}
            required={!optional}
            onToggle={toggle}
            onStatus={setStatus}
            onNext={() => {}}
            onBack={() => {}}
          />
        </ActsProvider>
      </div>
    </div>
  );
};

/** Kuration beim Schwerpunkt „Manga & Bücher": Lese-Cover und Lese-Genres. */
export const OnboardingWelcomeReadingPreview = () => {
  const [slugs, setSlugs] = useState<string[]>(['crime']);
  return (
    <div className="ob-root" style={{ height: '100vh' }}>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <ActsProvider value={actsFor('read')}>
          <WelcomeStep
            reading
            username="Bärbel"
            selectedSlugs={slugs}
            onToggleGenre={(slug) =>
              setSlugs((prev) =>
                prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
              )
            }
            onNext={() => {}}
          />
        </ActsProvider>
      </div>
    </div>
  );
};

/** Einstellungen → Design mit dem Schwerpunkt-Schalter. */
export const SettingsFocusPreview = () => (
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <AppearanceSection onNavigateTheme={() => {}} onNavigateLayout={() => {}} />
  </div>
);

/** Lese-Unterseite mit Beispiel-Büchern und -Manga. */
export const ReadingSubpagePreview = ({
  page,
  manga = MANGA,
}: {
  page: React.ReactNode;
  manga?: Manga[];
}) => {
  const ctx = useMemo(
    () => ({
      mangaList: manga,
      allMangaList: manga,
      hiddenMangaList: [],
      loading: false,
      refetchManga: () => {},
      toggleHideManga: async () => {},
      isOffline: false,
      isStale: false,
    }),
    [manga]
  );
  return (
    <BooksPreviewShell>
      <MangaListContext.Provider value={ctx}>{page}</MangaListContext.Provider>
    </BooksPreviewShell>
  );
};

/** Aufholen mit langen Manga-Titeln — die Prozentzahl lief rechts aus dem Bild. */
export const ReadingCatchUpMangaPreview = ({ page }: { page: React.ReactNode }) => (
  <ReadingSubpagePreview page={page} manga={CATCHUP_MANGA} />
);
