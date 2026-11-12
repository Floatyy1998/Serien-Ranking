import ManageAccountsRounded from '@mui/icons-material/ManageAccountsRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import PaletteRounded from '@mui/icons-material/PaletteRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import type { SvgIconComponent } from '@mui/icons-material';

export type SettingsCategoryId =
  'darstellung' | 'profil' | 'benachrichtigungen' | 'allgemein' | 'konto';

export interface SettingsCategory {
  id: SettingsCategoryId;
  title: string;
  description: string;
  Icon: SvgIconComponent;
  keywords: string[];
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'darstellung',
    title: 'Darstellung',
    description: 'Design, Startseite und Anzeige',
    Icon: PaletteRounded,
    keywords: [
      'theme',
      'farbe',
      'design',
      'größe',
      'zoom',
      'spoiler',
      'startseite',
      'layout',
      'schwerpunkt',
      'lesen',
      'bücher',
      'manga',
    ],
  },
  {
    id: 'profil',
    title: 'Profil & Community',
    description: 'Interessen, öffentliches Profil und Rangliste',
    Icon: PublicRounded,
    keywords: [
      'interessen',
      'öffentlich',
      'link',
      'teilen',
      'rangliste',
      'kalender',
      'freigabe',
      'freunde',
    ],
  },
  {
    id: 'benachrichtigungen',
    title: 'Benachrichtigungen',
    description: 'Push, Erinnerungen und dein Pet',
    Icon: NotificationsRounded,
    keywords: ['push', 'erinnerung', 'inaktiv', 'anbieter', 'provider', 'pet', 'haustier', 'töne'],
  },
  {
    id: 'allgemein',
    title: 'Allgemein',
    description: 'Sprache, Apps und Rechtliches',
    Icon: TuneRounded,
    keywords: [
      'sprache',
      'übersetzen',
      'land',
      'region',
      'streaming',
      'desktop',
      'android',
      'autostart',
      'bewerten',
      'seitenhilfen',
      'datenschutz',
      'impressum',
    ],
  },
  {
    id: 'konto',
    title: 'Konto & Daten',
    description: 'Anmeldung, Import, Export und Konto löschen',
    Icon: ManageAccountsRounded,
    keywords: [
      'passwort',
      'e-mail',
      'mail',
      'sicherheit',
      'anmeldung',
      'import',
      'export',
      'backup',
      'trakt',
      'löschen',
    ],
  },
];

export const isSettingsCategory = (v: string | null): v is SettingsCategoryId =>
  SETTINGS_CATEGORIES.some((c) => c.id === v);

export function matchSettingsCategories(
  query: string,
  translate: (s: string) => string
): SettingsCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS_CATEGORIES;
  return SETTINGS_CATEGORIES.filter((c) =>
    [translate(c.title), translate(c.description), c.title, ...c.keywords].some((s) =>
      s.toLowerCase().includes(q)
    )
  );
}
