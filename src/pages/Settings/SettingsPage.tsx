import { Android, DesktopWindows, Logout, PowerSettingsNew } from '@mui/icons-material';
import { currentScroller } from '../../components/layout/pageScroller';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, PageHeader } from '../../components/ui';
import { ImageCropSheet } from '../../components/ui/overlay/ImageCropSheet';
import { useSettingsData } from './useSettingsData';
import { t } from '../../services/i18n';
import { isNativeApp } from '../../services/app/nativeShell';
import { effectiveWidth, getDisplayScale } from '../../services/settings/displayScale';
import { ProfileSection } from './sections/ProfileSection';
import { PublicProfileSection } from './sections/PublicProfileSection';
import { InterestsSection } from './sections/InterestsSection';
import { LeaderboardVisibilitySection } from './sections/LeaderboardVisibilitySection';
import { ShareAccessSection } from './sections/ShareAccessSection';
import { DeleteAccountSection } from './sections/DeleteAccountSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { LegalSection } from './sections/LegalSection';
import { PageToursSection } from './sections/PageToursSection';
import { RateAppSection } from './sections/RateAppSection';
import { LanguageSection } from './sections/LanguageSection';
import { ImportExportSection } from './sections/ImportExportSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { PetSection } from './sections/PetSection';
import { SecuritySection } from './sections/SecuritySection';
import { SGroup, SRow, SSwitch } from './kit/SettingsKit';
import { SettingsCategoryList } from './parts/SettingsCategoryList';
import {
  SETTINGS_CATEGORIES,
  isSettingsCategory,
  matchSettingsCategories,
  type SettingsCategoryId,
} from './parts/settingsCategories';
import './SettingsPage.css';

const SPLIT_MIN_WIDTH = 1000;

const isSplit = () => effectiveWidth(window.innerWidth, getDisplayScale()) >= SPLIT_MIN_WIDTH;

function useSplitLayout(): boolean {
  const [split, setSplit] = useState(isSplit);
  useEffect(() => {
    const onResize = () => setSplit(isSplit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return split;
}

const HASH_CATEGORY: Record<string, SettingsCategoryId> = { '#interessen': 'profil' };

const withCategory = (pathname: string, search: string, cat: SettingsCategoryId | null) => {
  const params = new URLSearchParams(search);
  if (cat) params.set('cat', cat);
  else params.delete('cat');
  const query = params.toString();
  return { pathname, search: query ? `?${query}` : '' };
};

export const SettingsPage = () => {
  const { currentTheme } = useTheme();
  const split = useSplitLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { hash } = location;
  const routerNavigate = useNavigate();
  const fromList = (location.state as { settingsList?: boolean } | null)?.settingsList === true;
  const [query, setQuery] = useState('');

  const {
    displayName,
    setDisplayName,
    photoURL,
    uploading,
    saving,
    displayNameEditable,
    setDisplayNameEditable,
    fileInputRef,
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,
    dialog,
    setDialog,
    handleLogout,
    avatar,
    saveDisplayName,
    handlePublicProfileToggle,
    copyPublicLink,
    sharePublicLink,
    regeneratePublicId,
    navigate,
  } = useSettingsData();

  const param = searchParams.get('cat');
  const fromHash = HASH_CATEGORY[hash];
  const selected: SettingsCategoryId | null = isSettingsCategory(param)
    ? param
    : (fromHash ?? (split ? 'darstellung' : null));
  const category = SETTINGS_CATEGORIES.find((c) => c.id === selected) ?? null;

  const select = (id: SettingsCategoryId) => {
    currentScroller()?.scrollTo({ top: 0 });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('cat', id);
        return next;
      },
      { replace: split, state: { settingsList: true } }
    );
  };

  const { pathname, search } = location;

  useEffect(() => {
    if (split || !category || fromList) return;
    routerNavigate(withCategory(pathname, search, null), { replace: true });
    routerNavigate(withCategory(pathname, search, category.id), {
      state: { settingsList: true },
    });
  }, [split, category, fromList, pathname, search, routerNavigate]);

  const backToList = () => {
    if (fromList) routerNavigate(-1);
    else routerNavigate(withCategory(pathname, search, null), { replace: true });
  };

  const visibleCategories = useMemo(() => matchSettingsCategories(query, t), [query]);
  const isElectron = !!window.electronAPI?.isElectron;

  const layout: Record<SettingsCategoryId, { left: ReactNode; right: ReactNode }> = {
    darstellung: {
      left: (
        <SGroup title={t('Design')}>
          <AppearanceSection
            part="design"
            onNavigateTheme={() => navigate('/theme')}
            onNavigateLayout={() => navigate('/home-layout')}
          />
        </SGroup>
      ),
      right: (
        <SGroup title={t('Startseite & Lesen')}>
          <AppearanceSection
            part="home"
            onNavigateTheme={() => navigate('/theme')}
            onNavigateLayout={() => navigate('/home-layout')}
          />
        </SGroup>
      ),
    },
    profil: {
      left: (
        <SGroup title={t('Interessen')}>
          <InterestsSection />
        </SGroup>
      ),
      right: (
        <>
          <SGroup title={t('Sichtbarkeit')}>
            <PublicProfileSection
              isPublicProfile={isPublicProfile}
              publicProfileId={publicProfileId}
              isLoadingProfile={isLoadingProfile}
              onToggle={handlePublicProfileToggle}
              onCopyLink={copyPublicLink}
              onShareLink={sharePublicLink}
              onRegenerateId={regeneratePublicId}
            />
            <LeaderboardVisibilitySection />
          </SGroup>
          <ShareAccessSection />
        </>
      ),
    },
    benachrichtigungen: {
      left: (
        <SGroup title={t('Benachrichtigungen')}>
          <NotificationsSection />
        </SGroup>
      ),
      right: (
        <SGroup title={t('Dein Pet')}>
          <PetSection />
        </SGroup>
      ),
    },
    allgemein: {
      left: (
        <SGroup title={t('Sprache & Region')}>
          <LanguageSection />
        </SGroup>
      ),
      right: (
        <>
          <SGroup title={t('Apps & Hilfe')}>
            {isElectron ? (
              <AutoStartToggle />
            ) : (
              <SRow
                icon={DesktopWindows}
                title={t('Desktop App')}
                subtitle={t('TV-Rank für Windows herunterladen')}
                href="https://github.com/Floatyy1998/Serien-Ranking/releases/latest/download/TV-Rank-Setup.exe"
                download
                chevron
              />
            )}
            {!isNativeApp() && !isElectron && (
              <SRow
                icon={Android}
                title={t('Android App')}
                subtitle={t('APK direkt herunterladen und installieren')}
                href="https://github.com/Floatyy1998/Serien-Ranking/releases/latest/download/TV-Rank.apk"
                download
                chevron
              />
            )}
            <RateAppSection />
            <PageToursSection />
          </SGroup>
          <SGroup title={t('Rechtliches')}>
            <LegalSection
              onNavigatePrivacy={() => navigate('/privacy')}
              onNavigateImpressum={() => navigate('/impressum')}
            />
          </SGroup>
        </>
      ),
    },
    konto: {
      left: (
        <SGroup title={t('Anmeldung & Sicherheit')}>
          <SecuritySection />
          <DeleteAccountSection />
        </SGroup>
      ),
      right: (
        <SGroup title={t('Import & Export')}>
          <ImportExportSection />
        </SGroup>
      ),
    },
  };

  const logout = (
    <button type="button" onClick={handleLogout} className="settings-logout-btn">
      <Logout />
      {t('Abmelden')}
    </button>
  );

  const categoryPicker = (active: SettingsCategoryId | null) => (
    <>
      <label className="settings-search">
        <SearchRounded aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Einstellung suchen')}
          aria-label={t('Einstellung suchen')}
        />
        {query && (
          <button
            type="button"
            className="settings-search-clear"
            onClick={() => setQuery('')}
            aria-label={t('Suche leeren')}
          >
            <CloseRounded aria-hidden />
          </button>
        )}
      </label>
      {visibleCategories.length > 0 ? (
        <SettingsCategoryList categories={visibleCategories} active={active} onSelect={select} />
      ) : (
        <p className="settings-search-empty">{t('Nichts gefunden')}</p>
      )}
    </>
  );

  const profileCard = (
    <ProfileSection
      photoURL={photoURL}
      displayName={displayName}
      uploading={uploading}
      saving={saving}
      displayNameEditable={displayNameEditable}
      fileInputRef={fileInputRef}
      onImageUpload={avatar.handleFileSelected}
      onDisplayNameChange={setDisplayName}
      onSaveDisplayName={saveDisplayName}
      onEditDisplayName={() => setDisplayNameEditable(true)}
    />
  );

  const detail = category && (
    <main className="settings-detail" key={category.id}>
      {split && (
        <header className="settings-detail-head">
          <span className="settings-detail-icon" aria-hidden>
            <category.Icon />
          </span>
          <div>
            <h2 className="settings-detail-title">{t(category.title)}</h2>
            <p className="settings-detail-desc">{t(category.description)}</p>
          </div>
        </header>
      )}
      <div className="settings-detail-cols">
        <div className="settings-detail-col">{layout[category.id].left}</div>
        <div className="settings-detail-col">{layout[category.id].right}</div>
      </div>
    </main>
  );

  return (
    <div
      className={`settings-page${split ? ' settings-page--split' : ''}`}
      style={{ background: currentTheme.background.default }}
    >
      <div className="settings-page-bg" aria-hidden />

      <PageHeader
        title={!split && category ? t(category.title) : t('Einstellungen')}
        eyebrow={!split && category ? t('Einstellungen') : undefined}
        onBack={!split && category ? backToList : undefined}
        gradientFrom={currentTheme.text.secondary}
        gradientTo={currentTheme.primary}
      />

      {split ? (
        <div className="settings-split">
          <aside className="settings-rail">
            {profileCard}
            {categoryPicker(selected)}
            <div className="settings-rail-foot">{logout}</div>
          </aside>
          {detail}
        </div>
      ) : category ? (
        <div className="settings-mobile">{detail}</div>
      ) : (
        <div className="settings-mobile">
          {profileCard}
          {categoryPicker(null)}
          {logout}
        </div>
      )}

      <ImageCropSheet
        file={avatar.pendingFile}
        onCancel={avatar.cancelCrop}
        onConfirm={avatar.confirmCrop}
        busy={avatar.uploading}
      />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
};

const AutoStartToggle = () => {
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    window.electronAPI?.getAutoStart().then(setAutoStart);
  }, []);

  const handleToggle = async (next: boolean) => {
    await window.electronAPI?.setAutoStart(next);
    setAutoStart(next);
  };

  return (
    <SRow
      icon={PowerSettingsNew}
      title={t('Autostart')}
      subtitle={t('TV-Rank beim Hochfahren starten')}
      trailing={
        <SSwitch
          checked={autoStart}
          onChange={(next) => void handleToggle(next)}
          label={t('Autostart')}
        />
      }
    />
  );
};
