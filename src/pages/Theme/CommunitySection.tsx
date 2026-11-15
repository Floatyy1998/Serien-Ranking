import { memo, useState } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import {
  COMMUNITY_THEME_NAME_MAX,
  COMMUNITY_THEMES_PER_USER,
  cleanThemeName,
  type CommunityTheme,
  type CommunityThemeColors,
} from '../../services/theme/communityThemes';
import { ThemePreviewCard, type PresetTheme } from './ThemePreviewCard';
import type { CommunityThemesState } from './useCommunityThemes';

interface CommunitySectionProps {
  state: CommunityThemesState;
  uid: string | undefined;
  /** Die aktuellen eigenen Farben; null, solange sie sich nicht teilen lassen. */
  ownColors: CommunityThemeColors | null;
  pickedId: string | undefined;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isActive: (theme: PresetTheme) => boolean;
  onPick: (theme: CommunityTheme) => void;
  onPreview: (theme: PresetTheme | null) => void;
}

/** Designs anderer Nutzer ansehen und übernehmen, das eigene mit einem Namen dazustellen. */
export const CommunitySection = memo(
  ({
    state,
    uid,
    ownColors,
    pickedId,
    currentTheme,
    isActive,
    onPick,
    onPreview,
  }: CommunitySectionProps) => {
    const [formOpen, setFormOpen] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const mine = state.themes.filter((theme) => theme.uid === uid);
    const myUses = mine.reduce((sum, theme) => sum + theme.uses, 0);
    const atLimit = mine.length >= COMMUNITY_THEMES_PER_USER;
    const alreadyShared =
      !!ownColors &&
      mine.some(
        (theme) =>
          theme.primaryColor === ownColors.primaryColor &&
          theme.backgroundColor === ownColors.backgroundColor &&
          theme.surfaceColor === ownColors.surfaceColor &&
          theme.accentColor === ownColors.accentColor &&
          theme.textColor === ownColors.textColor
      );

    const submit = async () => {
      const clean = cleanThemeName(name);
      if (!clean || !ownColors || busy) return;
      setBusy(true);
      setError('');
      const ok = await state.share(clean, ownColors);
      setBusy(false);
      if (ok) {
        setName('');
        setFormOpen(false);
      } else {
        setError(t('Das Design konnte nicht geteilt werden.'));
      }
    };

    return (
      <section className="theme-section theme-community">
        <div className="theme-community__head">
          <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
            {t('Community')}
          </h2>
          {!formOpen &&
            ownColors &&
            !atLimit &&
            !alreadyShared &&
            !state.loading &&
            !state.failed && (
              <button
                type="button"
                className="theme-community__share"
                onClick={() => setFormOpen(true)}
              >
                {t('Mein Design teilen')}
              </button>
            )}
        </div>

        <p className="theme-community__lead" style={{ color: currentTheme.text.muted }}>
          {mine.length > 0
            ? t('Deine Designs werden gerade {n}× genutzt.', { n: myUses })
            : t('Designs von anderen — und deins für alle, wenn du magst.')}
        </p>

        {!formOpen && !state.loading && !state.failed && (atLimit || alreadyShared) && (
          <p className="theme-community__lead" style={{ color: currentTheme.text.muted }}>
            {atLimit
              ? t(
                  'Du hast {n} Designs geteilt — mehr geht nicht. Entferne eins, um ein neues zu teilen.',
                  { n: mine.length }
                )
              : t('Deine aktuellen Farben hast du schon geteilt.')}
          </p>
        )}

        {formOpen && ownColors && (
          <form
            className="theme-share"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <span className="theme-share__art" style={{ background: ownColors.backgroundColor }}>
              <span
                className="theme-preset-art__title"
                style={{
                  background: `linear-gradient(90deg, ${ownColors.primaryColor}, ${ownColors.accentColor})`,
                }}
              />
              <span className="theme-preset-art__tiles">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} style={{ background: ownColors.surfaceColor }} />
                ))}
              </span>
              <span className="theme-preset-art__foot">
                <b style={{ background: ownColors.primaryColor }} />
                <em style={{ background: ownColors.accentColor }} />
              </span>
            </span>
            <div className="theme-share__body">
              <label className="theme-share__label" htmlFor="theme-share-name">
                {t('Wie soll dein Design heißen?')}
              </label>
              <div className="theme-share__field">
                <input
                  id="theme-share-name"
                  type="text"
                  value={name}
                  maxLength={COMMUNITY_THEME_NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Name deines Designs')}
                  className="theme-share__input"
                  autoFocus
                />
                <span className="theme-share__count">
                  {name.length}/{COMMUNITY_THEME_NAME_MAX}
                </span>
              </div>
              <div className="theme-share__actions">
                <button
                  type="submit"
                  className="theme-share__btn theme-share__btn--primary"
                  disabled={busy || !cleanThemeName(name)}
                >
                  {t('Teilen')}
                </button>
                <button
                  type="button"
                  className="theme-share__btn"
                  onClick={() => setFormOpen(false)}
                >
                  {t('Abbrechen')}
                </button>
              </div>
              <p className="theme-share__note">
                {t(
                  'Geteilt werden deine fünf Farben, der Name und dein Anzeigename. Du kannst das Design jederzeit wieder entfernen.'
                )}
              </p>
              {error && (
                <p className="theme-share__note theme-share__note--error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>
        )}

        {state.loading ? (
          <p className="theme-community__lead" style={{ color: currentTheme.text.muted }}>
            {t('Lädt…')}
          </p>
        ) : state.failed ? (
          <p className="theme-community__lead" style={{ color: currentTheme.text.muted }}>
            {t('Die Community-Designs sind gerade nicht erreichbar.')}
          </p>
        ) : state.themes.length === 0 ? (
          <p className="theme-community__lead" style={{ color: currentTheme.text.muted }}>
            {t('Noch hat niemand ein Design geteilt. Mach den Anfang.')}
          </p>
        ) : (
          <div className="theme-preset-grid">
            {state.themes.map((theme, index) => (
              <ThemePreviewCard
                key={theme.id}
                preset={theme}
                index={index}
                isActive={isActive(theme)}
                isPicked={pickedId === theme.id}
                currentTheme={currentTheme}
                onApply={() => onPick(theme)}
                onPreview={onPreview}
                meta={
                  <>
                    <span className="theme-preset-meta__author">
                      {theme.uid === uid ? t('von dir') : t('von {name}', { name: theme.author })}
                    </span>
                    <span className="theme-preset-meta__uses">
                      {theme.hidden ? t('wird geprüft') : t('{n} nutzen es', { n: theme.uses })}
                    </span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    );
  }
);

CommunitySection.displayName = 'CommunitySection';

interface RenameThemeFormProps {
  initial: string;
  /** Von der Moderation zurückgehalten: ein neuer Name gibt das Design wieder frei. */
  hidden: boolean;
  onRename: (name: string) => Promise<boolean>;
}

/** Umbenennen des eigenen, gerade gewählten Designs — steht bei den Knöpfen unter der Vorschau. */
export const RenameThemeForm = ({ initial, hidden, onRename }: RenameThemeFormProps) => {
  const [open, setOpen] = useState(hidden);
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const clean = cleanThemeName(name);

  if (!open) {
    return (
      <button type="button" className="theme-apply-btn" onClick={() => setOpen(true)}>
        {t('Umbenennen')}
      </button>
    );
  }

  return (
    <form
      className="theme-rename"
      onSubmit={(e) => {
        e.preventDefault();
        if (!clean || clean === initial || busy) return;
        setBusy(true);
        setFailed(false);
        void onRename(clean).then((ok) => {
          setBusy(false);
          if (!ok) setFailed(true);
        });
      }}
    >
      {hidden && (
        <p className="theme-share__note">
          {t(
            'Dieses Design wird gerade zurückgehalten. Gib ihm einen anderen Namen, dann wird es neu geprüft.'
          )}
        </p>
      )}
      <div className="theme-share__field">
        <input
          type="text"
          value={name}
          maxLength={COMMUNITY_THEME_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          aria-label={t('Neuer Name')}
          className="theme-share__input"
          autoFocus
        />
        <span className="theme-share__count">
          {name.length}/{COMMUNITY_THEME_NAME_MAX}
        </span>
      </div>
      <button
        type="submit"
        className="theme-share__btn theme-share__btn--primary"
        disabled={busy || !clean || clean === initial}
      >
        {t('Speichern')}
      </button>
      {failed && (
        <p className="theme-share__note theme-share__note--error" role="alert">
          {t('Der Name konnte nicht gespeichert werden.')}
        </p>
      )}
    </form>
  );
};
