import {
  AutoStories,
  FormatSize,
  LibraryBooks,
  Palette,
  ViewQuilt,
  VisibilityOff,
  Weekend,
} from '@mui/icons-material';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { t } from '../../../services/i18n';
import {
  DISPLAY_SCALES,
  getDisplayScale,
  setDisplayScale,
  type DisplayScale,
} from '../../../services/settings/displayScale';
import {
  setSpoilerLevel,
  useSpoilerLevel,
  type SpoilerLevel,
} from '../../../services/settings/spoilerMode';
import { useAppFocus } from '../../../hooks/ui/useAppFocus';
import { setAppFocus, type AppFocus } from '../../../services/settings/appFocus';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import { setReadingAreas } from '../../../services/settings/readingAreas';
import { useBookAddPrompt } from '../../../hooks/ui/useBookAddPrompt';
import { setBookAddPrompt } from '../../../services/settings/bookAddPrompt';
import { showToast } from '../../../lib/interaction/toast';
import { SRow, SSegment } from '../kit/SettingsKit';

const SIZE_OPTIONS: { scale: DisplayScale; label: string; a: number }[] = [
  { scale: DISPLAY_SCALES[0], label: t('Klein'), a: 12 },
  { scale: DISPLAY_SCALES[1], label: t('Standard'), a: 14 },
  { scale: DISPLAY_SCALES[2], label: t('Groß'), a: 17 },
  { scale: DISPLAY_SCALES[3], label: t('Sehr groß'), a: 20 },
];

const saveFailed = () => showToast(t('Speichern fehlgeschlagen'), 2200, 'error');

const DisplaySizeControl = memo(() => {
  const [scale, setScale] = useState<DisplayScale>(() => getDisplayScale());
  return (
    <SRow
      icon={FormatSize}
      title={t('Anzeigegröße')}
      subtitle={t('Ganze App größer oder kleiner')}
      below={
        <SSegment
          ariaLabel={t('Anzeigegröße')}
          value={scale}
          onChange={(s) => {
            setScale(s);
            setDisplayScale(s);
          }}
          options={SIZE_OPTIONS.map((o) => ({
            value: o.scale,
            label: o.label,
            preview: (
              <span className="st-size-a" style={{ fontSize: o.a }} aria-hidden>
                A
              </span>
            ),
          }))}
        />
      }
    />
  );
});
DisplaySizeControl.displayName = 'DisplaySizeControl';

const focusOptions = (): { focus: AppFocus; label: string; hint: string }[] => [
  { focus: 'watch', label: t('Serien & Filme'), hint: t('Startseite für Serien und Filme') },
  { focus: 'read', label: t('Manga & Bücher'), hint: t('Startseite für Manga und Bücher') },
  { focus: 'both', label: t('Beides'), hint: t('Serien-Startseite, Lesen über das Dock') },
];

const FocusControl = memo(() => {
  const { user } = useAuth() || {};
  const { focus } = useAppFocus();
  const options = focusOptions();
  return (
    <SRow
      icon={Weekend}
      title={t('Schwerpunkt')}
      subtitle={options.find((o) => o.focus === focus)?.hint}
      below={
        <SSegment
          ariaLabel={t('Schwerpunkt')}
          value={focus}
          onChange={(next) => {
            if (!user || next === focus) return;
            setAppFocus(user.uid, next).catch(saveFailed);
          }}
          options={options.map((o) => ({ value: o.focus, label: o.label }))}
        />
      }
    />
  );
});
FocusControl.displayName = 'FocusControl';

const readingAreaOptions = (): { areas: ReadingAreas; label: string; hint: string }[] => [
  { areas: 'both', label: t('Beides'), hint: t('Bücher und Manga auf einer Lesen-Seite') },
  { areas: 'books', label: t('Bücher'), hint: t('Lesen zeigt nur Bücher') },
  { areas: 'manga', label: 'Manga', hint: t('Lesen zeigt nur Manga') },
];

const ReadingAreasControl = memo(() => {
  const { user } = useAuth() || {};
  const areas = useReadingAreas();
  const options = readingAreaOptions();
  return (
    <SRow
      icon={LibraryBooks}
      title={t('Lesebereiche')}
      subtitle={options.find((o) => o.areas === areas)?.hint}
      below={
        <SSegment
          ariaLabel={t('Lesebereiche')}
          value={areas}
          onChange={(next) => {
            if (!user || next === areas) return;
            setReadingAreas(user.uid, next).catch(saveFailed);
          }}
          options={options.map((o) => ({ value: o.areas, label: o.label }))}
        />
      }
    />
  );
});
ReadingAreasControl.displayName = 'ReadingAreasControl';

const bookAddOptions = (): { ask: boolean; label: string; hint: string }[] => [
  {
    ask: false,
    label: t('Direkt auf die Leseliste'),
    hint: t('Neue Bücher landen erst einmal auf der Leseliste, wie Serien auf der Watchlist'),
  },
  { ask: true, label: t('Erst fragen'), hint: t('Beim Hinzufügen wählst du den Lesestand') },
];

const BookAddPromptControl = memo(() => {
  const { user } = useAuth() || {};
  const ask = useBookAddPrompt();
  const options = bookAddOptions();
  return (
    <SRow
      icon={LibraryBooks}
      title={t('Bücher aufnehmen')}
      subtitle={options.find((o) => o.ask === ask)?.hint}
      below={
        <SSegment
          ariaLabel={t('Bücher aufnehmen')}
          value={ask}
          onChange={(next) => {
            if (!user || next === ask) return;
            setBookAddPrompt(user.uid, next).catch(saveFailed);
          }}
          options={options.map((o) => ({ value: o.ask, label: o.label }))}
        />
      }
    />
  );
});
BookAddPromptControl.displayName = 'BookAddPromptControl';

const SPOILER_OPTIONS: { level: SpoilerLevel; label: string; hint: string }[] = [
  { level: 0, label: t('Aus'), hint: t('Alles sichtbar') },
  { level: 1, label: t('Bilder'), hint: t('Bilder ungesehener Folgen blurren') },
  { level: 2, label: t('Streng'), hint: t('Auch Titel und Beschreibungen verstecken') },
];

const SpoilerControl = memo(() => {
  const { user } = useAuth() || {};
  const level = useSpoilerLevel();
  return (
    <SRow
      icon={VisibilityOff}
      title={t('Spoiler-Schutz')}
      subtitle={SPOILER_OPTIONS.find((o) => o.level === level)?.hint}
      below={
        <SSegment
          ariaLabel={t('Spoiler-Schutz')}
          value={level}
          onChange={(next) => setSpoilerLevel(user?.uid, next)}
          options={SPOILER_OPTIONS.map((o) => ({ value: o.level, label: o.label }))}
        />
      }
    />
  );
});
SpoilerControl.displayName = 'SpoilerControl';

interface AppearanceSectionProps {
  onNavigateTheme: () => void;
  onNavigateLayout: () => void;
  part?: 'design' | 'home';
}

export const AppearanceSection = memo(
  ({ onNavigateTheme, onNavigateLayout, part }: AppearanceSectionProps) => {
    const navigate = useNavigate();
    const show = (p: 'design' | 'home') => !part || part === p;

    return (
      <>
        {show('design') && (
          <SRow
            icon={Palette}
            title={t('Design & Themes')}
            subtitle={t('Farben und Aussehen anpassen')}
            chevron
            onClick={onNavigateTheme}
          />
        )}
        {show('design') && <DisplaySizeControl />}
        {show('design') && <SpoilerControl />}
        {show('home') && <FocusControl />}
        {show('home') && (
          <SRow
            icon={ViewQuilt}
            title={t('Homepage Layout')}
            subtitle={t('Sektionen sortieren & ausblenden')}
            chevron
            onClick={onNavigateLayout}
          />
        )}
        {show('home') && <ReadingAreasControl />}
        {show('home') && <BookAddPromptControl />}
        {show('home') && (
          <SRow
            icon={AutoStories}
            title={t('Lesen-Seite')}
            subtitle={t('Sektionen sortieren & ausblenden')}
            chevron
            onClick={() => navigate('/reading/layout')}
          />
        )}
      </>
    );
  }
);

AppearanceSection.displayName = 'AppearanceSection';
