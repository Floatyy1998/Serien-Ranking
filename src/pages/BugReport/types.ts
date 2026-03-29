export type TicketStatus = 'open' | 'in-progress' | 'done' | 'rejected' | 'obsolete';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketType = 'bug' | 'feature';

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
}

export const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Offen', color: '#f59e0b' },
  'in-progress': { label: 'In Bearbeitung', color: '#3b82f6' },
  done: { label: 'Erledigt', color: '#22c55e' },
  rejected: { label: 'Abgelehnt', color: '#ef4444' },
  obsolete: { label: 'Hinfällig', color: '#78716c' },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Niedrig', color: '#6b7280' },
  medium: { label: 'Mittel', color: '#f59e0b' },
  high: { label: 'Hoch', color: '#ef4444' },
};

export const TYPE_CONFIG: Record<TicketType, { label: string; color: string; icon: string }> = {
  bug: { label: 'Bug', color: '#ef4444', icon: '🐛' },
  feature: { label: 'Feature', color: '#8b5cf6', icon: '💡' },
};
