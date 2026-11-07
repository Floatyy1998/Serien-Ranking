/**
 * Filter, Sortierung und stabile Reihenfolge der Ticket-Inbox. Die Liste darf
 * beim Arbeiten nicht springen: ein Statuswechsel oder eine Antwort ändert
 * `updatedAt` und den Status, die Position aber erst, wenn man die Liste
 * bewusst neu aufbaut.
 */
import type { BugTicket, TicketComment, TicketType } from '../../../BugReport/types';
import { isArchivedStatus, normalizeStatus } from '../../../BugReport/types';

export type TicketQueue = 'inbox' | 'waiting' | 'done' | 'rejected' | 'obsolete' | 'all';
export type TicketSort = 'newest' | 'oldest' | 'activity';

export interface ThreadEntry extends TicketComment {
  kind: 'comment' | 'note';
}

const time = (iso: string | undefined): number => {
  const value = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
};

/** Kommentare und interne Notizen in einer Zeitleiste. */
export function buildThread(ticket: BugTicket): ThreadEntry[] {
  const comments = Object.values(ticket.comments || {}).map((c) => ({
    ...c,
    kind: 'comment' as const,
  }));
  const notes = Object.values(ticket.adminNotes || {}).map((n) => ({
    ...n,
    kind: 'note' as const,
  }));
  return [...comments, ...notes].sort((a, b) => time(a.createdAt) - time(b.createdAt));
}

/** Liegt der Ball beim Admin? Offen und noch nie beantwortet, oder der Nutzer hat zuletzt geschrieben. */
export function needsReply(ticket: BugTicket): boolean {
  if (isArchivedStatus(ticket.status)) return false;
  const comments = Object.values(ticket.comments || {}).sort(
    (a, b) => time(a.createdAt) - time(b.createdAt)
  );
  const last = comments[comments.length - 1];
  if (!last) return normalizeStatus(ticket.status) === 'open';
  return !last.isAdmin;
}

export function matchesQueue(ticket: BugTicket, queue: TicketQueue): boolean {
  const status = normalizeStatus(ticket.status);
  switch (queue) {
    case 'inbox':
      return status === 'open' || status === 'in-progress';
    case 'waiting':
      return needsReply(ticket);
    case 'done':
    case 'rejected':
    case 'obsolete':
      return status === queue;
    default:
      return true;
  }
}

export interface TicketFilter {
  queue: TicketQueue;
  type: TicketType | 'all';
  search: string;
}

export function matchesFilter(ticket: BugTicket, filter: TicketFilter): boolean {
  if (!matchesQueue(ticket, filter.queue)) return false;
  if (filter.type !== 'all' && (ticket.ticketType || 'bug') !== filter.type) return false;
  const q = filter.search.trim().toLowerCase();
  if (!q) return true;
  return [ticket.title, ticket.description, ticket.createdByName, ticket.id].some((field) =>
    String(field || '')
      .toLowerCase()
      .includes(q)
  );
}

export function sortTickets(tickets: BugTicket[], sort: TicketSort): BugTicket[] {
  const key = (t: BugTicket) => time(sort === 'activity' ? t.updatedAt : t.createdAt);
  const dir = sort === 'oldest' ? 1 : -1;
  return [...tickets].sort((a, b) => (key(a) - key(b)) * dir || a.id.localeCompare(b.id));
}

export function countQueues(tickets: BugTicket[]): Record<TicketQueue, number> {
  const queues: TicketQueue[] = ['inbox', 'waiting', 'done', 'rejected', 'obsolete', 'all'];
  return Object.fromEntries(
    queues.map((q) => [q, tickets.filter((t) => matchesQueue(t, q)).length])
  ) as Record<TicketQueue, number>;
}

/**
 * Führt die eingefrorene Reihenfolge mit dem neuen Datenstand zusammen:
 * gelöschte Tickets fallen raus, neu eingegangene passende Tickets kommen
 * oben dazu, alles andere bleibt, wo es war — auch wenn es nicht mehr zum
 * Filter passt.
 */
export function mergeOrder(
  order: string[],
  seen: ReadonlySet<string>,
  freshIds: string[],
  existingIds: ReadonlySet<string>
): string[] {
  const kept = order.filter((id) => existingIds.has(id));
  const keptSet = new Set(kept);
  const arrivals = freshIds.filter((id) => !seen.has(id) && !keptSet.has(id));
  return arrivals.length || kept.length !== order.length ? [...arrivals, ...kept] : order;
}

/** Wie viele Tickets würden bei einem Neuaufbau dazukommen oder verschwinden. */
export function pendingChanges(order: string[], freshIds: string[]): number {
  const orderSet = new Set(order);
  const freshSet = new Set(freshIds);
  return (
    freshIds.filter((id) => !orderSet.has(id)).length +
    order.filter((id) => !freshSet.has(id)).length
  );
}
