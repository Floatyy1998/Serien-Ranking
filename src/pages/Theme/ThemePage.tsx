import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, ColorLens, Brightness6, Wallpaper, FormatColorText } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getContrastRatio } from '../../theme/colorUtils';
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
    name: 'Abyss',
    primaryColor: '#00e5ff', // Electric Cyan
    backgroundColor: '#030d18', // Deep ocean black
    surfaceColor: '#060f20', // Very dark blue
    accentColor: '#7c3aed', // Deep violet
  },
  {
    name: 'Inferno',
    primaryColor: '#ff6b35', // Orange-red
    backgroundColor: '#14050a', // Deep dark warm black
    surfaceColor: '#200810', // Dark crimson-black
    accentColor: '#ffd700', // Gold
  },
  {
    name: 'Sakura',
    primaryColor: '#ff7eb3', // Vivid pink
    backgroundColor: '#0d0614', // Deep purple-black
    surfaceColor: '#160a1f', // Dark purple
    accentColor: '#7b61ff', // Indigo-violet
  },
  {
    name: 'Glacier',
    primaryColor: '#7dd3fc', // Sky blue
    backgroundColor: '#0c1220', // Deep slate
    surfaceColor: '#111828', // Dark slate
    accentColor: '#a78bfa', // Soft violet
  },
  {
    name: 'Emerald',
    primaryColor: '#10b981', // Vivid emerald
    backgroundColor: '#031209', // Deep forest black
    surfaceColor: '#051a0d', // Very dark green
    accentColor: '#f59e0b', // Amber
  },
  {
    name: 'Cosmic',
    primaryColor: '#818cf8', // Indigo
    backgroundColor: '#07040e', // Deep space black
    surfaceColor: '#0e0919', // Very dark purple
    accentColor: '#22d3ee', // Cyan
  },
  {
    name: 'Neon',
    primaryColor: '#f0abfc', // Neon pink-purple
    backgroundColor: '#0a0415', // Deep purple-black
    surfaceColor: '#110720', // Dark purple
    accentColor: '#67e8f9', // Ice cyan
  },
  {
    name: 'Ember',
    primaryColor: '#fb923c', // Amber-orange
    backgroundColor: '#100806', // Deep brown-black
    surfaceColor: '#1a0e08', // Dark brown
    accentColor: '#fbbf24', // Warm yellow
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

const isHexColor = (c: string): boolean => /^#?[0-9a-fA-F]{6}$/.test(c);

export const ThemePage = () => {
  const { userConfig, updateTheme, resetTheme, currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const [hovered, setHovered] = useState<PresetTheme | null>(null);
  // Angetipptes Theme: erst ansehen, dann übernehmen. Gespeichert wird erst mit dem Knopf.
  const [picked, setPicked] = useState<PresetTheme | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  // Einzelne Farben, die geändert, aber noch nicht übernommen sind.
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const colorOf = (key: string): string | undefined =>
    draft?.[key] ?? (userConfig[key as keyof typeof userConfig] as string | undefined);
  const shown = hovered ?? picked;
  const community = useCommunityThemes(user?.uid, user?.displayName || t('Unbekannt'));
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
    text: shown?.textColor ?? draft?.textColor ?? currentTheme.text.secondary,
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
    // Schmal steht die Vorschau über der Liste: dorthin rollen, damit man das Theme auch sieht.
    previewRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }, []);

  const applyPresetTheme = useCallback(
    (preset: PresetTheme) => {
      hapticTap();
      updateTheme({
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        surfaceColor: preset.surfaceColor,
        accentColor: preset.accentColor,
        ...(preset.textColor ? { textColor: preset.textColor } : {}),
        seasons: withActiveSeasonOff(userConfig),
      });
    },
    [updateTheme, userConfig]
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

  // Abgleich beim Öffnen: trägt das Konto gerade ein fremdes Community-Design (z. B. von einem
  // anderen Gerät übernommen), gilt es hier als dessen Nutzer — sonst könnte es sich nie abmelden.
  const activeCommunityId = community.themes.find(
    (theme) =>
      theme.uid !== user?.uid &&
      !season &&
      userConfig.primaryColor === theme.primaryColor &&
      userConfig.backgroundColor === theme.backgroundColor &&
      userConfig.surfaceColor === theme.surfaceColor &&
      userConfig.accentColor === theme.accentColor &&
      userConfig.textColor === theme.textColor
  )?.id;
  useEffect(() => {
    if (!activeCommunityId) return;
    const active = community.themes.find((theme) => theme.id === activeCommunityId);
    if (active) setCommunityUse(active);
    // Nur beim Wechsel des aktiven Designs, nicht bei jeder Zähler-Änderung der Liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCommunityId, setCommunityUse]);

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

      <div className="theme-content">
        <div className="theme-studio">
          <aside className="theme-studio__preview" ref={previewRef}>
            <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
              {shown ? t('Vorschau: {name}', { name: shown.name }) : t('Vorschau')}
            </h2>
            <ThemePreview
              colors={previewColors}
              titles={previewTitles}
              name={user?.displayName?.split(' ')[0]}
            />
            {picked ? (
              <div className="theme-studio__apply">
                <button
                  type="button"
                  className="theme-apply-btn theme-apply-btn--primary"
                  onClick={() => {
                    applyPresetTheme(picked);
                    community.setUse(pickedCommunity);
                    setPicked(null);
                  }}
                >
                  {t('{name} übernehmen', { name: picked.name })}
                </button>
                <button type="button" className="theme-apply-btn" onClick={() => setPicked(null)}>
                  {t('Verwerfen')}
                </button>
                {pickedCommunity && pickedCommunity.uid === user?.uid && (
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
                )}
                {pickedCommunity && pickedCommunity.uid === user?.uid && (
                  <button
                    type="button"
                    className="theme-apply-btn theme-apply-btn--danger"
                    onClick={() => {
                      void community.remove(pickedCommunity.id);
                      setPicked(null);
                    }}
                  >
                    {t('Aus der Community entfernen')}
                  </button>
                )}
              </div>
            ) : (
              <p className="theme-studio__hint" style={{ color: currentTheme.text.muted }}>
                {t(
                  'So sieht TV-Rank mit deinen Farben aus. Wähl ein Theme, um es hier zu testen — gespeichert wird erst, wenn du es übernimmst.'
                )}
              </p>
            )}
          </aside>
          <div className="theme-studio__controls">
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="theme-section"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
                Themes
              </h2>
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
                  />
                ))}
              </div>
            </motion.div>

            {user?.uid && (
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
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="theme-section"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
                {t('Farben anpassen')}
              </h2>
              {contrastWarning && (
                <div
                  role="alert"
                  style={{
                    margin: '0 0 12px',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    background: `${currentTheme.status.warning}1f`,
                    color: currentTheme.status.warning,
                    border: `1px solid ${currentTheme.status.warning}55`,
                  }}
                >
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
            </motion.div>

            <ResetSection
              currentTheme={currentTheme}
              onReset={() => {
                resetTheme();
                setCommunityUse(null);
                setDraft(null);
              }}
            />
          </div>
        </div>
        {draft && (
          <div className="theme-draft-bar" role="status">
            <span className="theme-draft-bar__text">
              {t('Deine Farbänderungen sind noch nicht übernommen.')}
            </span>
            <button type="button" className="theme-apply-btn" onClick={() => setDraft(null)}>
              {t('Verwerfen')}
            </button>
            <button
              type="button"
              className="theme-apply-btn theme-apply-btn--primary"
              onClick={applyDraft}
            >
              {t('Farben übernehmen')}
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
