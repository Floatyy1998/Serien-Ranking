import { useCallback, useEffect, useMemo, useState } from 'react';
import { Palette, ColorLens, Brightness6, Wallpaper, FormatColorText } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createAccessibleTextColors, getContrastRatio } from '../../theme/colorUtils';
import { PageHeader, PageLayout } from '../../components/ui';
import { hapticTap } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import { ThemePreview, type PreviewTitle } from './ThemePreview';
import { ThemePreviewCard, type PresetTheme } from './ThemePreviewCard';
import { ColorEditor, type ColorCategory } from './ColorEditor';
import { CommunitySection, RenameThemeForm } from './CommunitySection';
import { useCommunityThemes } from './useCommunityThemes';
import {
  isShareableColors,
  type CommunityTheme,
  type CommunityThemeColors,
} from '../../services/theme/communityThemes';
import { ResetSection } from './ResetSection';
import { SeasonCard } from './SeasonCard';
import {
  activeSeason,
  currentSeason,
  withActiveSeasonOff,
  withSeasonFlag,
  type SeasonId,
} from '../../theme/seasonalThemes';
import './ThemePage.css';

const presetThemes: PresetTheme[] = [
  {
    // Das Standard-Design: trägt jeder, der nie etwas umgestellt hat.
    name: 'TV-Rank',
    primaryColor: '#ef6f8a', // Rosé
    backgroundColor: '#2b1a2e', // Plum
    surfaceColor: '#3a2640',
    accentColor: '#f2a648', // Amber
    textColor: '#f1e8ee',
  },
  {
    name: 'Abyss',
    primaryColor: '#00e5ff', // Electric Cyan
    backgroundColor: '#030d18', // Deep ocean black
    surfaceColor: '#060f20', // Very dark blue
    accentColor: '#7c3aed', // Deep violet
    textColor: '#e6f6fb', // zum Theme passende Schrift
  },
  {
    name: 'Inferno',
    primaryColor: '#ff6b35', // Orange-red
    backgroundColor: '#14050a', // Deep dark warm black
    surfaceColor: '#200810', // Dark crimson-black
    accentColor: '#ffd700', // Gold
    textColor: '#fbeee6', // zum Theme passende Schrift
  },
  {
    name: 'Sakura',
    primaryColor: '#ff7eb3', // Vivid pink
    backgroundColor: '#0d0614', // Deep purple-black
    surfaceColor: '#160a1f', // Dark purple
    accentColor: '#7b61ff', // Indigo-violet
    textColor: '#f7e9f1', // zum Theme passende Schrift
  },
  {
    name: 'Glacier',
    primaryColor: '#7dd3fc', // Sky blue
    backgroundColor: '#0c1220', // Deep slate
    surfaceColor: '#111828', // Dark slate
    accentColor: '#a78bfa', // Soft violet
    textColor: '#e8f1fb', // zum Theme passende Schrift
  },
  {
    name: 'Emerald',
    primaryColor: '#10b981', // Vivid emerald
    backgroundColor: '#031209', // Deep forest black
    surfaceColor: '#051a0d', // Very dark green
    accentColor: '#f59e0b', // Amber
    textColor: '#e6f5ec', // zum Theme passende Schrift
  },
  {
    name: 'Cosmic',
    primaryColor: '#818cf8', // Indigo
    backgroundColor: '#07040e', // Deep space black
    surfaceColor: '#0e0919', // Very dark purple
    accentColor: '#22d3ee', // Cyan
    textColor: '#ecebfb', // zum Theme passende Schrift
  },
  {
    name: 'Neon',
    primaryColor: '#f0abfc', // Neon pink-purple
    backgroundColor: '#0a0415', // Deep purple-black
    surfaceColor: '#110720', // Dark purple
    accentColor: '#67e8f9', // Ice cyan
    textColor: '#f6ebfb', // zum Theme passende Schrift
  },
  {
    name: 'Ember',
    primaryColor: '#fb923c', // Amber-orange
    backgroundColor: '#100806', // Deep brown-black
    surfaceColor: '#1a0e08', // Dark brown
    accentColor: '#fbbf24', // Warm yellow
    textColor: '#fbf0e4', // zum Theme passende Schrift
  },
];

const colorCategories: ColorCategory[] = [
  {
    key: 'primaryColor',
    name: t('Primär'),
    icon: <ColorLens />,
    description: t('Hauptfarbe für Buttons'),
  },
  {
    key: 'backgroundColor',
    name: t('Hintergrund'),
    icon: <Brightness6 />,
    description: t('Hintergrundfarbe'),
  },
  {
    key: 'textColor',
    name: t('Text'),
    icon: <FormatColorText />,
    description: t('Textfarbe'),
  },
  {
    key: 'surfaceColor',
    name: t('Oberfläche'),
    icon: <Wallpaper />,
    description: t('Kartenfarben'),
  },
  { key: 'accentColor', name: t('Akzent'), icon: <Palette />, description: t('Akzentfarbe') },
];

type StudioTab = 'themes' | 'community' | 'colors';

const isHexColor = (c: string): boolean => /^#?[0-9a-fA-F]{6}$/.test(c);

/**
 * Fertige Themes bringen keine Textfarbe mit. Passt die aktuelle Schrift nicht zu ihrem
 * Hintergrund (helles Theme aktiv, dunkles Theme gewählt), liefert das eine lesbare Farbe.
 */
const textFor = (background: string, current: string): string => {
  if (!isHexColor(background) || !isHexColor(current)) return current;
  return getContrastRatio(current, background) >= 4.5
    ? current
    : createAccessibleTextColors(background).secondary;
};

export const ThemePage = () => {
  const { userConfig, updateTheme, resetTheme, currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const [hovered, setHovered] = useState<PresetTheme | null>(null);
  // Angetipptes Theme: erst ansehen, dann übernehmen. Gespeichert wird erst mit dem Knopf.
  const [picked, setPicked] = useState<PresetTheme | null>(null);
  const [tab, setTab] = useState<StudioTab>('themes');
  // Einzelne Farben, die geändert, aber noch nicht übernommen sind.
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const colorOf = (key: string): string | undefined =>
    draft?.[key] ?? (userConfig[key as keyof typeof userConfig] as string | undefined);
  const shown = hovered ?? picked;
  const community = useCommunityThemes(user?.uid, user?.displayName || '');
  const pickedCommunity = picked && 'id' in picked ? (picked as CommunityTheme) : null;
  const setCommunityUse = community.setUse;

  // Eigene Titel in der Vorschau: so sieht man die Farben an etwas Vertrautem.
  const previewTitles = useMemo<PreviewTitle[]>(
    () =>
      (seriesList ?? [])
        .filter((s) => s?.poster?.poster)
        .slice(0, 7)
        .map((s) => ({ title: s.title || '', poster: s.poster.poster })),
    [seriesList]
  );

  const previewColors = {
    primary: shown?.primaryColor ?? draft?.primaryColor ?? currentTheme.primary,
    accent: shown?.accentColor ?? draft?.accentColor ?? currentTheme.accent,
    background: shown?.backgroundColor ?? draft?.backgroundColor ?? currentTheme.background.default,
    surface: shown?.surfaceColor ?? draft?.surfaceColor ?? currentTheme.background.surface,
    text:
      shown?.textColor ??
      (shown
        ? textFor(shown.backgroundColor, currentTheme.text.secondary)
        : (draft?.textColor ?? currentTheme.text.secondary)),
  };

  // Kontrast-Schutz: warnt, wenn die gewählte Text/Hintergrund-Kombination unter
  // WCAG-AA (4.5:1) fällt, damit man sich nicht versehentlich „unsichtbar" macht.
  const contrastWarning = useMemo(() => {
    const textColor = draft?.textColor ?? ((userConfig.textColor as string) || '');
    const bgColor = draft?.backgroundColor ?? ((userConfig.backgroundColor as string) || '');
    if (!isHexColor(textColor) || !isHexColor(bgColor)) return null;
    const ratio = getContrastRatio(textColor, bgColor);
    if (ratio >= 4.5) return null;
    return ratio < 3
      ? t('Sehr geringer Kontrast zwischen Text und Hintergrund – Text ist kaum lesbar.')
      : t('Geringer Kontrast zwischen Text und Hintergrund (unter WCAG-AA 4.5:1).');
  }, [userConfig.textColor, userConfig.backgroundColor, draft]);

  // Farbänderungen sind erst ein Entwurf: nur die Vorschau zeigt sie, bis man sie übernimmt.
  const handleColorChange = useCallback((key: string, value: string) => {
    setPicked(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyDraft = useCallback(() => {
    if (!draft) return;
    hapticTap();
    updateTheme({ ...draft, seasons: withActiveSeasonOff(userConfig) });
    // Eine eigene Farbe heißt: das übernommene Community-Design ist es nicht mehr.
    setCommunityUse(null);
    setDraft(null);
  }, [draft, updateTheme, userConfig, setCommunityUse]);

  const pickPreset = useCallback((preset: PresetTheme) => {
    hapticTap();
    setDraft(null);
    setPicked((prev) => (prev === preset ? null : preset));
  }, []);

  const applyPresetTheme = useCallback(
    (preset: PresetTheme) => {
      hapticTap();
      updateTheme({
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        surfaceColor: preset.surfaceColor,
        accentColor: preset.accentColor,
        // Ohne eigene Textfarbe: die bisherige behalten, solange sie auf dem neuen Grund lesbar ist.
        textColor:
          preset.textColor ??
          textFor(
            preset.backgroundColor,
            (userConfig.textColor as string) || currentTheme.text.secondary
          ),
        seasons: withActiveSeasonOff(userConfig),
      });
    },
    [updateTheme, userConfig, currentTheme.text.secondary]
  );

  const toggleSeason = useCallback(
    (season: SeasonId, next: boolean) =>
      updateTheme({ seasons: withSeasonFlag(userConfig.seasons, season, next) }),
    [updateTheme, userConfig.seasons]
  );

  const season = activeSeason(userConfig);
  const runningSeason = currentSeason();

  const isPresetActive = (preset: PresetTheme) =>
    !season &&
    userConfig.primaryColor === preset.primaryColor &&
    userConfig.backgroundColor === preset.backgroundColor &&
    userConfig.surfaceColor === preset.surfaceColor &&
    userConfig.accentColor === preset.accentColor &&
    (!preset.textColor || userConfig.textColor === preset.textColor);

  // Abgleich beim Öffnen: trägt das Konto gerade ein Community-Design oder ein fertiges Theme
  // (z. B. auf einem anderen Gerät übernommen oder schon vor der Zählung), gilt es hier als
  // dessen Nutzer. Fertige Themes zählen ohne Textfarbe.
  const activeCommunityId = community.themes.find(
    (theme) =>
      !season &&
      userConfig.primaryColor === theme.primaryColor &&
      userConfig.backgroundColor === theme.backgroundColor &&
      userConfig.surfaceColor === theme.surfaceColor &&
      userConfig.accentColor === theme.accentColor &&
      userConfig.textColor === theme.textColor
  )?.id;
  const wornPreset = season
    ? undefined
    : presetThemes.find(
        (preset) =>
          userConfig.primaryColor === preset.primaryColor &&
          userConfig.backgroundColor === preset.backgroundColor &&
          userConfig.surfaceColor === preset.surfaceColor &&
          userConfig.accentColor === preset.accentColor
      );
  const wornPresetId = wornPreset ? community.presets[wornPreset.name]?.id : undefined;
  const countedId = activeCommunityId ?? wornPresetId;
  useEffect(() => {
    if (!countedId) return;
    const active =
      community.themes.find((theme) => theme.id === countedId) ??
      Object.values(community.presets).find((theme) => theme.id === countedId);
    if (active) setCommunityUse(active);
    // Nur beim Wechsel des aktiven Designs, nicht bei jeder Zähler-Änderung der Liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countedId, setCommunityUse]);

  // Teilen geht nur mit fünf vollständigen Farben und ohne Saison-Design darüber.
  const ownColors = useMemo<CommunityThemeColors | null>(() => {
    const colors = {
      primaryColor: userConfig.primaryColor as string,
      backgroundColor: userConfig.backgroundColor as string,
      surfaceColor: userConfig.surfaceColor as string,
      accentColor: userConfig.accentColor as string,
      textColor: (userConfig.textColor as string) || currentTheme.text.secondary,
    };
    return !season && isShareableColors(colors) ? colors : null;
  }, [userConfig, currentTheme.text.secondary, season]);

  // Wie das gerade getragene Design heißt — Orientierung über den Reitern und in der Vorschau.
  const activeCommunity = community.themes.find((theme) => theme.id === activeCommunityId);
  const activePreset = presetThemes.find((preset) => isPresetActive(preset));
  const currentName = season
    ? t('Saison-Design')
    : activeCommunity
      ? t('{name} von {author}', { name: activeCommunity.name, author: activeCommunity.author })
      : activePreset
        ? activePreset.name
        : t('Eigene Farben');
  const shownName =
    shown && 'author' in shown
      ? t('{name} von {author}', {
          name: shown.name,
          author: (shown as CommunityTheme).author,
        })
      : shown?.name;

  const tabs: { key: StudioTab; label: string }[] = [
    { key: 'themes', label: 'Themes' },
    ...(user?.uid ? [{ key: 'community' as const, label: t('Community') }] : []),
    { key: 'colors', label: t('Eigene Farben') },
  ];

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, currentTheme.accent]}
      style={{ height: 'var(--vh, 100vh)', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader
        title="Design"
        icon={<Palette style={{ fontSize: 28 }} />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
      />

      <div className="theme-content ts">
        <div className="ts-grid">
          <section className="ts-stage" aria-label={t('Vorschau')}>
            <div className="ts-stage__head">
              <h2 className="ts-stage__title">{t('Vorschau')}</h2>
              <span className={`ts-stage__chip${shown || draft ? ' is-pending' : ''}`}>
                {shown ? shownName : draft ? t('Deine Änderung') : currentName}
              </span>
            </div>
            <ThemePreview
              colors={previewColors}
              titles={previewTitles}
              name={user?.displayName?.split(' ')[0]}
            />
            <div className="ts-action">
              {picked ? (
                <>
                  <button
                    type="button"
                    className="ts-btn ts-btn--primary"
                    onClick={() => {
                      applyPresetTheme(picked);
                      community.setUse(pickedCommunity ?? community.presets[picked.name] ?? null);
                      setPicked(null);
                    }}
                  >
                    {t('{name} übernehmen', { name: picked.name })}
                  </button>
                  <button type="button" className="ts-btn" onClick={() => setPicked(null)}>
                    {t('Verwerfen')}
                  </button>
                  {pickedCommunity && pickedCommunity.uid === user?.uid && (
                    <div className="ts-action__own">
                      <RenameThemeForm
                        key={pickedCommunity.id}
                        initial={pickedCommunity.name}
                        hidden={!!pickedCommunity.hidden}
                        onRename={async (name) => {
                          const ok = await community.rename(pickedCommunity.id, name);
                          if (ok) setPicked(null);
                          return ok;
                        }}
                      />
                      <button
                        type="button"
                        className="ts-btn ts-btn--danger"
                        onClick={() => {
                          void community.remove(pickedCommunity.id);
                          setPicked(null);
                        }}
                      >
                        {t('Aus der Community entfernen')}
                      </button>
                    </div>
                  )}
                </>
              ) : draft ? (
                <>
                  <button type="button" className="ts-btn ts-btn--primary" onClick={applyDraft}>
                    {t('Farben übernehmen')}
                  </button>
                  <button type="button" className="ts-btn" onClick={() => setDraft(null)}>
                    {t('Verwerfen')}
                  </button>
                </>
              ) : (
                <p className="ts-action__hint">
                  {t(
                    'Tipp ein Design an oder ändere eine Farbe. Gespeichert wird erst beim Übernehmen.'
                  )}
                </p>
              )}
            </div>
          </section>

          <section className="ts-panel">
            {runningSeason && (
              <SeasonCard
                season={runningSeason}
                active={season === runningSeason}
                onToggle={toggleSeason}
              />
            )}
            {season && (
              <p className="theme-season-note" style={{ color: currentTheme.text.muted }}>
                {t(
                  'Das Saison-Design liegt gerade über deinen Farben. Wählst du ein Theme oder eine Farbe, endet es.'
                )}
              </p>
            )}

            <div className="ts-tabs" role="tablist" aria-label={t('Design wählen')}>
              {tabs.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.key}
                  className={`ts-tab${tab === entry.key ? ' is-active' : ''}`}
                  onClick={() => setTab(entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            {tab === 'themes' && (
              <div className="ts-pane">
                <p className="ts-pane__lead">
                  {t('Fertige Farbwelten. Antippen zeigt sie in der Vorschau.')}
                </p>
                <div className="theme-preset-grid">
                  {presetThemes.map((preset, index) => (
                    <ThemePreviewCard
                      key={preset.name}
                      preset={preset}
                      index={index}
                      isActive={isPresetActive(preset)}
                      isPicked={picked === preset}
                      currentTheme={currentTheme}
                      onApply={pickPreset}
                      onPreview={setHovered}
                      meta={
                        community.presets[preset.name] ? (
                          <span className="theme-preset-meta__uses">
                            {t('{n} nutzen es', { n: community.presets[preset.name].uses })}
                          </span>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'community' && user?.uid && (
              <div className="ts-pane">
                <CommunitySection
                  state={community}
                  uid={user.uid}
                  ownColors={ownColors}
                  pickedId={pickedCommunity?.id}
                  currentTheme={currentTheme}
                  isActive={isPresetActive}
                  onPick={pickPreset}
                  onPreview={setHovered}
                />
              </div>
            )}

            {tab === 'colors' && (
              <div className="ts-pane">
                <p className="ts-pane__lead">
                  {t('Fünf Farben, aus denen TV-Rank den Rest ableitet.')}
                </p>
                {contrastWarning && (
                  <div className="ts-warning" role="alert">
                    {contrastWarning}
                  </div>
                )}
                <div className="theme-color-list">
                  {colorCategories.map((category) => (
                    <ColorEditor
                      key={category.key}
                      category={category}
                      color={
                        colorOf(category.key) ||
                        (category.key === 'textColor'
                          ? currentTheme.text.secondary
                          : currentTheme.accent)
                      }
                      currentTheme={currentTheme}
                      onColorChange={handleColorChange}
                    />
                  ))}
                </div>
                <ResetSection
                  currentTheme={currentTheme}
                  onReset={() => {
                    resetTheme();
                    setCommunityUse(null);
                    setDraft(null);
                  }}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
};
