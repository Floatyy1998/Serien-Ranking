import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { dbRef } from '../../../../services/db/ref';
import { localizedVariants, tLocale } from '../../../../services/i18n';
import { sendNotificationToUser } from '../../../../hooks/social/useDiscussionHelpers';
import type { BugTicket, TicketComment, TicketType } from '../../../BugReport/types';
import { isArchivedStatus, STATUS_CONFIG } from '../../../BugReport/types';
import { onValue } from '../../../../services/db/subscribeValue';
import {
  countQueues,
  matchesFilter,
  mergeOrder,
  pendingChanges,
  sortTickets,
  type TicketQueue,
  type TicketSort,
} from './ticketQueue';

export interface InboxItem {
  ticket: BugTicket;
  /** Passt nach einer Änderung nicht mehr zum Filter, bleibt bis zum Neuaufbau stehen. */
  stale: boolean;
}

interface ViewState {
  key: string;
  src: BugTicket[];
  order: string[];
  seen: Set<string>;
}

/**
 * Realtime-Ticketliste, Inbox-Filter und Schreibaktionen. Die Reihenfolge der
 * Liste wird eingefroren, sobald ein Filter steht — siehe `mergeOrder`.
 */
export function useTicketsData() {
  const { user } = useAuth() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  // Das offene Ticket steht in der URL: Push-Taps landen direkt darauf, und die
  // Zurück-Taste am Handy führt vom Ticket zur Liste statt aus dem Admin raus.
  const selectedId = searchParams.get('ticket') || null;
  const openedHere = (location.state as { tkDetail?: boolean } | null)?.tkDetail === true;
  const setSelectedId = useCallback(
    (id: string | null) => {
      if (!id && openedHere) {
        navigate(-1);
        return;
      }
      const next = new URLSearchParams(searchParams);
      if (id) next.set('ticket', id);
      else next.delete('ticket');
      setSearchParams(next, {
        replace: !id || !!selectedId,
        state: id ? { tkDetail: openedHere || !selectedId } : null,
      });
    },
    [navigate, openedHere, searchParams, selectedId, setSearchParams]
  );
  const [queue, setQueue] = useState<TicketQueue>(() => (selectedId ? 'all' : 'inbox'));
  const [typeFilter, setTypeFilter] = useState<TicketType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<TicketSort>('newest');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    // limitToLast begrenzt den Listener auf die 100 neuesten Tickets (Push-Keys
    // sind chronologisch). Spart massiv Egress, weil ein einzelner Ticket-Update
    // sonst den kompletten Tickets-Node neu herunterlaedt.
    const query = dbRef('bugTickets').orderByKey().limitToLast(100);
    const handler = onValue(query, (snap) => {
      const val = snap.val();
      setTickets(val ? (Object.values(val) as BugTicket[]) : []);
      setLoading(false);
    });
    return () => query.off('value', handler);
  }, []);

  const byId = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);

  const freshIds = useMemo(
    () =>
      sortTickets(
        tickets.filter((t) => matchesFilter(t, { queue, type: typeFilter, search: searchQuery })),
        sort
      ).map((t) => t.id),
    [tickets, queue, typeFilter, searchQuery, sort]
  );

  const viewKey = `${queue}|${typeFilter}|${searchQuery}|${sort}|${refreshToken}`;
  const [view, setView] = useState<ViewState>({
    key: viewKey,
    src: tickets,
    order: freshIds,
    seen: new Set(tickets.map((t) => t.id)),
  });

  // Abgeleiteter Zustand aus dem vorigen Render (React-Muster statt Effekt):
  // neuer Filter = neu aufbauen, neue Daten = nur einsortieren.
  if (view.key !== viewKey) {
    setView({ key: viewKey, src: tickets, order: freshIds, seen: new Set(byId.keys()) });
  } else if (view.src !== tickets) {
    setView({
      key: viewKey,
      src: tickets,
      order: mergeOrder(view.order, view.seen, freshIds, new Set(byId.keys())),
      seen: new Set([...view.seen, ...byId.keys()]),
    });
  }

  // Kommt ein Ticket von außen (Push, Glocke), das der aktuelle Filter nicht
  // zeigt, auf „Alle" wechseln — sonst fehlt es links in der Liste.
  const [seenSelection, setSeenSelection] = useState(selectedId);
  if (selectedId !== seenSelection) {
    setSeenSelection(selectedId);
    if (selectedId && !view.order.includes(selectedId)) setQueue('all');
  }

  const items = useMemo<InboxItem[]>(() => {
    const fresh = new Set(freshIds);
    return view.order.flatMap((id) => {
      const ticket = byId.get(id);
      return ticket ? [{ ticket, stale: !fresh.has(id) }] : [];
    });
  }, [view.order, byId, freshIds]);

  const pending = useMemo(() => pendingChanges(view.order, freshIds), [view.order, freshIds]);
  const counts = useMemo(() => countQueues(tickets), [tickets]);
  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);
  const selected = selectedId ? byId.get(selectedId) || null : null;

  const deleteScreenshots = useCallback(async (screenshots: string[]) => {
    for (const url of screenshots) {
      try {
        await firebase.storage().refFromURL(url).delete();
      } catch {
        // ignore
      }
    }
  }, []);

  const updateTicket = useCallback(
    async (ticketId: string, updates: Partial<BugTicket>) => {
      const ticket = byId.get(ticketId);
      if (updates.status && isArchivedStatus(updates.status) && ticket?.screenshots?.length) {
        await deleteScreenshots(ticket.screenshots);
        updates.screenshots = [];
      }
      await dbRef(`bugTickets/${ticketId}`).update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      if (updates.status && ticket && updates.status !== ticket.status) {
        const statusRaw = (STATUS_CONFIG[updates.status] || STATUS_CONFIG.done).rawLabel;
        const template = 'Dein Ticket "{title}" ist jetzt: {status}';
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_status',
          title: 'Ticket-Status geändert',
          titleL: await localizedVariants('Ticket-Status geändert'),
          message: tLocale('de', template, { title: ticket.title, status: statusRaw }),
          messageL: await localizedVariants(template, {
            title: ticket.title,
            status: tLocale('en', statusRaw),
          }),
          data: { ticketId, ticketType: ticket.ticketType || 'bug' },
        });
      }
    },
    [byId, deleteScreenshots]
  );

  const addAdminComment = useCallback(
    async (ticketId: string, text: string) => {
      if (!user) return;
      const commentId = dbRef().push().key ?? crypto.randomUUID();
      const comment: TicketComment = {
        id: commentId,
        authorUid: user.uid,
        authorName: user.displayName || 'Admin',
        isAdmin: true,
        text,
        createdAt: new Date().toISOString(),
      };
      await dbRef(`bugTickets/${ticketId}/comments/${commentId}`).set(comment);
      await dbRef(`bugTickets/${ticketId}/updatedAt`).set(new Date().toISOString());
      const ticket = byId.get(ticketId);
      if (ticket) {
        const template = 'Admin hat auf "{title}" geantwortet: {snippet}';
        const vars = {
          title: ticket.title,
          snippet: `${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`,
        };
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_reply',
          title: 'Antwort auf dein Ticket',
          titleL: await localizedVariants('Antwort auf dein Ticket'),
          message: tLocale('de', template, vars),
          messageL: await localizedVariants(template, vars),
          data: { ticketId, ticketType: ticket.ticketType || 'bug' },
        });
      }
    },
    [user, byId]
  );

  const addAdminNote = useCallback(
    async (ticketId: string, text: string) => {
      if (!user) return;
      const noteId = dbRef().push().key ?? crypto.randomUUID();
      const entry: TicketComment = {
        id: noteId,
        authorUid: user.uid,
        authorName: user.displayName || 'Admin',
        isAdmin: true,
        text,
        createdAt: new Date().toISOString(),
      };
      await dbRef(`bugTickets/${ticketId}/adminNotes/${noteId}`).set(entry);
    },
    [user]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      const ticket = byId.get(ticketId);
      if (ticket?.screenshots?.length) {
        await deleteScreenshots(ticket.screenshots);
      }
      await dbRef(`bugTickets/${ticketId}`).remove();
      if (selectedId === ticketId) setSelectedId(null);
    },
    [byId, deleteScreenshots, selectedId, setSelectedId]
  );

  return {
    tickets,
    loading,
    items,
    counts,
    pending,
    refresh,
    selected,
    selectedId,
    setSelectedId,
    queue,
    setQueue,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    updateTicket,
    addAdminComment,
    addAdminNote,
    deleteTicket,
  };
}

export type TicketsData = ReturnType<typeof useTicketsData>;
