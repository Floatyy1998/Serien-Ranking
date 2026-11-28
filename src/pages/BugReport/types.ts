import type { SvgIconComponent } from '@mui/icons-material';
import BugReportIcon from '@mui/icons-material/BugReport';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { t } from '../../services/i18n';
import type { BugContext } from '../../types/ErrorReport';

/** `closed` ist Altbestand (vom Nutzer selbst geschlossen) und zählt als `done`. */
export type TicketStatus = 'open' | 'in-progress' | 'done' | 'rejected' | 'obsolete' | 'closed';

export const TICKET_STATUSES = ['open', 'in-progress', 'done', 'rejected', 'obsolete'] as const;

export const normalizeStatus = (status: TicketStatus): TicketStatus =>
  status === 'closed' ? 'done' : status;

export const isArchivedStatus = (status: TicketStatus): boolean =>
  status === 'done' || status === 'rejected' || status === 'obsolete' || status === 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketType = 'bug' | 'feature' | 'question';

export const TICKET_TYPES = ['bug', 'feature', 'question'] as const;

export const normalizeTicketType = (type: unknown): TicketType =>
  type === 'feature' || type === 'question' ? type : 'bug';

export interface TicketComment {
  id: string;
  authorUid: string;
  authorName: string;
  isAdmin: boolean;
  text: string;
  createdAt: string;
}

export interface BugTicket {
  id: string;
  ticketType: TicketType;
  title: string;
  description: string;
  stepsToReproduce: string;
  screenshots: string[];
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  comments: Record<string, TicketComment>;
  adminNotes?: Record<string, TicketComment>;
  device?: string;
  consoleErrors?: string;
  context?: BugContext;
  /** Hat der Ersteller das Ticket selbst geschlossen? */
  closedByUser?: boolean;
}

// rawLabel = deutscher Quelltext, für sprachfixierte Benachrichtigungen (tLocale)
export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; rawLabel: string; color: string }
> = {
  open: { label: t('Offen'), rawLabel: 'Offen', color: '#f59e0b' },
  'in-progress': { label: t('In Bearbeitung'), rawLabel: 'In Bearbeitung', color: '#3b82f6' },
  done: { label: t('Erledigt'), rawLabel: 'Erledigt', color: '#22c55e' },
  rejected: { label: t('Abgelehnt'), rawLabel: 'Abgelehnt', color: '#ef4444' },
  obsolete: { label: t('Hinfällig'), rawLabel: 'Hinfällig', color: '#78716c' },
  closed: { label: t('Erledigt'), rawLabel: 'Erledigt', color: '#22c55e' },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: t('Niedrig'), color: '#6b7280' },
  medium: { label: t('Mittel'), color: '#f59e0b' },
  high: { label: t('Hoch'), color: '#ef4444' },
};

export const TYPE_CONFIG: Record<
  TicketType,
  { label: string; rawLabel: string; color: string; Icon: SvgIconComponent }
> = {
  bug: { label: t('Bug'), rawLabel: 'Bug', color: '#ef4444', Icon: BugReportIcon },
  feature: { label: t('Feature'), rawLabel: 'Feature', color: '#8b5cf6', Icon: LightbulbIcon },
  question: { label: t('Frage'), rawLabel: 'Frage', color: '#0ea5e9', Icon: HelpOutlineIcon },
};

export const NEW_TICKET_TITLE: Record<TicketType, string> = {
  bug: 'Neues Bug-Ticket',
  feature: 'Neuer Feature-Wunsch',
  question: 'Neue Frage',
};
