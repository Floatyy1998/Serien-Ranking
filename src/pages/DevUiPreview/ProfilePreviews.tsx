import {
  AutoStories,
  EmojiEvents,
  Explore,
  Forum,
  Group,
  History,
  Insights,
  Leaderboard,
  LibraryBooks,
  LocalLibrary,
  MenuBook,
  Palette,
  Pets,
  Search,
  Settings,
  Star,
  TrendingUp,
  UploadFile,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ProfileFeaturedNav,
  ProfileHeader,
  ProfileLogoutButton,
  ProfileMenuGroup,
  ProfileStats,
} from '../Profile/ProfileComponents';
import type { ProfileMenuItem, ProfileReadingStats } from '../Profile/useProfileData';
import '../Profile/ProfilePage.css';

const STATS = {
  totalSeries: 348,
  totalMovies: 226,
  watchedEpisodes: 10374,
  totalMinutes: 0,
  timeString: '9M 11T 2S 10Min',
};

const READING: Record<string, ProfileReadingStats | null> = {
  none: null,
  books: { booksRead: 14, pagesRead: 5280, mangaChapters: 0 },
  all: { booksRead: 37, pagesRead: 12430, mangaChapters: 1874 },
};

/** Eigenes Profil mit Watch- und Lese-Kacheln; `?reading=none|books|all`. */
export const ProfileStatsPreview = () => {
  const { currentTheme } = useTheme();
  const [params] = useSearchParams();
  const key = params.get('reading') ?? 'all';
  const reading = key in READING ? READING[key] : READING.all;
  const item = (label: string, icon: ProfileMenuItem['icon'], color: string): ProfileMenuItem => ({
    label,
    icon,
    color,
    path: `/${label}`,
  });
  const featured = [
    item('Meine Bewertungen', Star, currentTheme.status.warning),
    item('Aktivität & Freunde', Group, currentTheme.primary),
    item('Hinzufügen & Suchen', Search, currentTheme.status.error),
  ];
  const secondary = [
    item('Rangliste', Leaderboard, '#f59e0b'),
    item('Statistiken', TrendingUp, currentTheme.primary),
    item('Verlauf', History, currentTheme.status.success),
    item('Erfolge', EmojiEvents, currentTheme.status.warning),
    item('Haustiere', Pets, '#ec4899'),
  ];
  const lesen = [
    item('Bücher', LocalLibrary, currentTheme.primary),
    item('Dein Regal', LibraryBooks, currentTheme.status.warning),
    item('Lese-Statistik', Insights, currentTheme.accent),
    item('Bücher importieren', UploadFile, currentTheme.status.success),
    item('Manga Home', AutoStories, currentTheme.secondary),
    item('Manga-Leseliste', MenuBook, currentTheme.status.error),
    item('Manga entdecken', Explore, currentTheme.secondary),
  ];
  const settings = [
    item('Design', Palette, currentTheme.primary),
    item('Einstellungen', Settings, currentTheme.text.secondary),
    item('Ideen & Probleme', Forum, '#3b82f6'),
  ];
  return (
    <div className="profile-page" style={{ background: currentTheme.background.default }}>
      <div className="profile-hero">
        <div className="profile-hero-collage" aria-hidden="true">
          {['#3a2a4a', '#4a2f3a', '#2f3a4a', '#4a3f2a', '#2a4a3f', '#3f2a4a'].map((c) => (
            <div
              key={c}
              className="profile-hero-tile"
              style={{ background: `linear-gradient(160deg, ${c}, #121016)` }}
            />
          ))}
        </div>
        <div
          className="profile-hero-scrim"
          aria-hidden="true"
          style={{
            background: `linear-gradient(90deg, ${currentTheme.background.default}e6 0%, ${currentTheme.background.default}59 24%, transparent 48%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.45) 55%, ${currentTheme.background.default} 100%)`,
          }}
        />
        <div className="profile-hero-content">
          <ProfileHeader
            displayName="Floatyy"
            email="flo@example.com"
            photoURL={null}
            currentTheme={currentTheme}
          />
          <ProfileStats stats={STATS} reading={reading} currentTheme={currentTheme} />
        </div>
      </div>
      <ProfileFeaturedNav
        title="Schnellzugriff"
        items={featured}
        currentTheme={currentTheme}
        onNavigate={() => {}}
        animationDelay={0}
      />
      <ProfileMenuGroup
        title="Deine Aktivitäten"
        items={secondary}
        currentTheme={currentTheme}
        onNavigate={() => {}}
        animationDelay={0}
      />
      <ProfileMenuGroup
        title="Lesen"
        items={lesen}
        currentTheme={currentTheme}
        onNavigate={() => {}}
        animationDelay={0}
      />
      <ProfileMenuGroup
        title="Einstellungen"
        items={settings}
        currentTheme={currentTheme}
        onNavigate={() => {}}
        animationDelay={0}
      />
      <ProfileLogoutButton currentTheme={currentTheme} onLogout={() => {}} animationDelay={0} />
    </div>
  );
};
