import {
  AutoStories,
  ChevronRight,
  LibraryBooks,
  FormatSize,
  Palette,
  ViewQuilt,
  VisibilityOff,
  Weekend,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
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
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { useAppFocus } from '../../../hooks/ui/useAppFocus';
import { setAppFocus, type AppFocus } from '../../../services/settings/appFocus';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import { setReadingAreas } from '../../../services/settings/readingAreas';
import { showToast } from '../../../lib/interaction/toast';

const SIZE_OPTIONS: { scale: DisplayScale; label: string; a: number }[] = [
  { scale: DISPLAY_SCALES[0], label: t('Klein'), a: 13 },
  { scale: DISPLAY_SCALES[1], label: t('Standard'), a: 15 },
  { scale: DISPLAY_SCALES[2], label: t('Groß'), a: 18 },
  { scale: DISPLAY_SCALES[3], label: t('Sehr groß'), a: 22 },
];

const DisplaySizeControl = memo(() => {
  const { currentTheme } = useTheme();
  const [scale, setScale] = useState<DisplayScale>(() => getDisplayScale());
  const onPrimary = getOptimalTextColor(currentTheme.primary);

  const choose = (s: DisplayScale) => {
    setScale(s);
    setDisplayScale(s);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="settings-nav-btn settings-size-card"
      style={{ color: currentTheme.text.primary }}
    >
      <div className="settings-size-head">
        <div
          className="settings-nav-btn-icon"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
        >
          <FormatSize style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
        </div>
        <div className="settings-nav-btn-text">
          <h2 className="settings-nav-btn-title">{t('Anzeigegröße')}</h2>
          <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
            {t('Ganze App größer oder kleiner')}
          </p>
        </div>
      </div>
      <div className="settings-size-seg">
        {SIZE_OPTIONS.map((o) => {
          const active = scale === o.scale;
          return (
            <button
              key={o.scale}
              type="button"
              onClick={() => choose(o.scale)}
              aria-label={o.label}
              aria-pressed={active}
              className={active ? 'is-active' : ''}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: onPrimary,
                      borderColor: 'transparent',
                    }
                  : { color: currentTheme.text.muted }
              }
            >
              <span className="sz-a" style={{ fontSize: o.a }}>
                A
              </span>
              <span className="sz-lbl">{o.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

DisplaySizeControl.displayName = 'DisplaySizeControl';

const focusOptions = (): { focus: AppFocus; label: string; hint: string }[] => [
  { focus: 'watch', label: t('Serien & Filme'), hint: t('Startseite für Serien und Filme') },
  { focus: 'read', label: t('Manga & Bücher'), hint: t('Startseite für Manga und Bücher') },
  { focus: 'both', label: t('Beides'), hint: t('Serien-Startseite, Lesen über das Dock') },
];

/** Schwerpunkt der App — schaltet die Startseite zwischen Schauen und Lesen um. */
const FocusControl = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { focus } = useAppFocus();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const options = focusOptions();
  const current = options.find((o) => o.focus === focus);

  const choose = (next: AppFocus) => {
    if (!user || next === focus) return;
    setAppFocus(user.uid, next).catch(() =>
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="settings-nav-btn settings-size-card"
      style={{ color: currentTheme.text.primary }}
    >
      <div className="settings-size-head">
        <div
          className="settings-nav-btn-icon"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.primary})`,
          }}
        >
          <Weekend style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
        </div>
        <div className="settings-nav-btn-text">
          <h2 className="settings-nav-btn-title">{t('Schwerpunkt')}</h2>
          <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
            {current?.hint}
          </p>
        </div>
      </div>
      <div className="settings-size-seg">
        {options.map((o) => {
          const active = focus === o.focus;
          return (
            <button
              key={o.focus}
              type="button"
              onClick={() => choose(o.focus)}
              aria-pressed={active}
              className={active ? 'is-active' : ''}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: onPrimary,
                      borderColor: 'transparent',
                    }
                  : { color: currentTheme.text.muted }
              }
            >
              <span className="sz-lbl" style={{ fontSize: 13 }}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

FocusControl.displayName = 'FocusControl';

const readingAreaOptions = (): { areas: ReadingAreas; label: string; hint: string }[] => [
  {
    areas: 'both',
    label: t('Beides'),
    hint: t('Bücher und Manga auf einer Lesen-Seite'),
  },
  { areas: 'books', label: t('Bücher'), hint: t('Lesen zeigt nur Bücher') },
  { areas: 'manga', label: 'Manga', hint: t('Lesen zeigt nur Manga') },
];

/** Welche Lesebereiche die Lesen-Seite zeigt — reine Buch- oder Manga-Leser blenden den anderen aus. */
const ReadingAreasControl = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const areas = useReadingAreas();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const options = readingAreaOptions();
  const current = options.find((o) => o.areas === areas);

  const choose = (next: ReadingAreas) => {
    if (!user || next === areas) return;
    setReadingAreas(user.uid, next).catch(() =>
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17 }}
      className="settings-nav-btn settings-size-card"
      style={{ color: currentTheme.text.primary }}
    >
      <div className="settings-size-head">
        <div
          className="settings-nav-btn-icon"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
        >
          <LibraryBooks style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
        </div>
        <div className="settings-nav-btn-text">
          <h2 className="settings-nav-btn-title">{t('Lesebereiche')}</h2>
          <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
            {current?.hint}
          </p>
        </div>
      </div>
      <div className="settings-size-seg">
        {options.map((o) => {
          const active = areas === o.areas;
          return (
            <button
              key={o.areas}
              type="button"
              onClick={() => choose(o.areas)}
              aria-pressed={active}
              className={active ? 'is-active' : ''}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: onPrimary,
                      borderColor: 'transparent',
                    }
                  : { color: currentTheme.text.muted }
              }
            >
              <span className="sz-lbl" style={{ fontSize: 13 }}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

ReadingAreasControl.displayName = 'ReadingAreasControl';

const SPOILER_OPTIONS: { level: SpoilerLevel; label: string; hint: string }[] = [
  { level: 0, label: t('Aus'), hint: t('Alles sichtbar') },
  { level: 1, label: t('Bilder'), hint: t('Bilder ungesehener Folgen blurren') },
  { level: 2, label: t('Streng'), hint: t('Auch Titel und Beschreibungen verstecken') },
];

const SpoilerControl = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const level = useSpoilerLevel();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const current = SPOILER_OPTIONS.find((o) => o.level === level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="settings-nav-btn settings-size-card"
      style={{ color: currentTheme.text.primary }}
    >
      <div className="settings-size-head">
        <div
          className="settings-nav-btn-icon"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
        >
          <VisibilityOff style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
        </div>
        <div className="settings-nav-btn-text">
          <h2 className="settings-nav-btn-title">{t('Spoiler-Schutz')}</h2>
          <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
            {current?.hint || t('Bilder ungesehener Folgen blurren')}
          </p>
        </div>
      </div>
      <div className="settings-size-seg">
        {SPOILER_OPTIONS.map((o) => {
          const active = level === o.level;
          return (
            <button
              key={o.level}
              type="button"
              onClick={() => setSpoilerLevel(user?.uid, o.level)}
              aria-label={o.label}
              aria-pressed={active}
              className={active ? 'is-active' : ''}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: onPrimary,
                      borderColor: 'transparent',
                    }
                  : { color: currentTheme.text.muted }
              }
            >
              <span className="sz-lbl">{o.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

SpoilerControl.displayName = 'SpoilerControl';

interface AppearanceSectionProps {
  onNavigateTheme: () => void;
  onNavigateLayout: () => void;
}

export const AppearanceSection = memo(
  ({ onNavigateTheme, onNavigateLayout }: AppearanceSectionProps) => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    return (
      <>
        {/* Theme Settings */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={tapScaleSmall}
          onClick={onNavigateTheme}
          className="settings-nav-btn"
          style={{ color: currentTheme.text.primary }}
        >
          <div
            className="settings-nav-btn-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          >
            <Palette style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
          </div>
          <div className="settings-nav-btn-text">
            <h2 className="settings-nav-btn-title">{t('Design & Themes')}</h2>
            <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
              {t('Farben und Aussehen anpassen')}
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        <FocusControl />

        <ReadingAreasControl />

        {/* Homepage Layout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileTap={tapScaleSmall}
          onClick={onNavigateLayout}
          className="settings-nav-btn"
          style={{ color: currentTheme.text.primary }}
        >
          <div
            className="settings-nav-btn-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.primary})`,
            }}
          >
            <ViewQuilt style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
          </div>
          <div className="settings-nav-btn-text">
            <h2 className="settings-nav-btn-title">{t('Homepage Layout')}</h2>
            <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
              {t('Sektionen sortieren & ausblenden')}
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        {/* Lesen-Seite: Bücher und Manga, gleicher Editor */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          whileTap={tapScaleSmall}
          onClick={() => navigate('/reading/layout')}
          className="settings-nav-btn"
          style={{ color: currentTheme.text.primary }}
        >
          <div
            className="settings-nav-btn-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          >
            <AutoStories style={{ fontSize: '24px', color: currentTheme.text.secondary }} />
          </div>
          <div className="settings-nav-btn-text">
            <h2 className="settings-nav-btn-title">{t('Lesen-Seite')}</h2>
            <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
              {t('Sektionen sortieren & ausblenden')}
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        {/* Anzeigegröße — skaliert die ganze UI proportional (Zoom) */}
        <DisplaySizeControl />

        {/* Spoiler-Schutz für ungesehene Folgen */}
        <SpoilerControl />
      </>
    );
  }
);

AppearanceSection.displayName = 'AppearanceSection';
