/**
 * Zentrale Registry für Namens-Badges (kleine Chips hinter Nutzernamen).
 * Neue Badges (Events, Käufe, …) brauchen nur einen Eintrag hier plus eine
 * Zuweisung — heute hart verdrahtet (Owner), später z. B. aus einem öffentlich
 * lesbaren RTDB-Knoten.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import { ADMIN_UID } from '../../../config/admin';
import { t } from '../../../services/i18n';

export interface NameBadgeDefinition {
  id: string;
  label: string;
  /** Tooltip-Text */
  title: string;
  gradient: string;
  textColor: string;
  Icon: SvgIconComponent;
}

export const NAME_BADGES: Record<string, NameBadgeDefinition> = {
  owner: {
    id: 'owner',
    label: t('Owner'),
    title: t('Betreiber von TV-Rank'),
    gradient: 'linear-gradient(135deg, #f8d574, #e9980f)',
    textColor: '#1a1203',
    Icon: WorkspacePremiumRounded,
  },
  // Vorbereitet für kommende Events/Belohnungen — noch nirgends zugewiesen.
  'event-champion': {
    id: 'event-champion',
    label: t('Champion'),
    title: t('Hat ein TV-Rank-Event gewonnen'),
    gradient: 'linear-gradient(135deg, #c084fc, #7c3aed)',
    textColor: '#ffffff',
    Icon: EmojiEventsRounded,
  },
  supporter: {
    id: 'supporter',
    label: t('Supporter'),
    title: t('Unterstützt TV-Rank'),
    gradient: 'linear-gradient(135deg, #fb7185, #be185d)',
    textColor: '#ffffff',
    Icon: FavoriteRounded,
  },
};

/** Zentrale Zuweisung: welche Badges trägt diese UID? */
export function resolveNameBadgeIds(uid?: string | null): string[] {
  if (!uid) return [];
  return uid === ADMIN_UID ? ['owner'] : [];
}
