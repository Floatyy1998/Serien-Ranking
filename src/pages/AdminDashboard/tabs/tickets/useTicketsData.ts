import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../AuthContext';
import { dbRef } from '../../../../services/db/ref';
import { sendNotificationToUser } from '../../../../hooks/useDiscussionHelpers';
import type { BugTicket, TicketComment, TicketStatus, TicketType } from '../../../BugReport/types';
import { STATUS_CONFIG, TYPE_CONFIG } from '../../../BugReport/types';

interface UseTicketsDataResult {
  tickets: BugTicket[];
  loading: boolean;
  filtered: BugTicket[];
  counts: Record<string, number>;
  expandedId: string | null;
  setExpandedId: React.Dispatch<React.SetStateAction<string | null>>;
  expandedRef: React.RefObject<HTMLDivElement | null>;
  statusFilter: TicketStatus | 'all';
  setStatusFilter: (s: TicketStatus | 'all') => void;
  typeFilter: TicketType | 'all';
  setTypeFilter: (t: TicketType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  updateTicket: (ticketId: string, updates: Partial<BugTicket>) => Promise<void>;
  addAdminComment: (ticketId: string, text: string) => Promise<void>;
  addAdminNote: (ticketId: string, text: string) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
}

/**
 * Realtime ticket list + filter state + mutations. Lifted out of TicketsTab
 * so the JSX stays focused on layout.
 */
export function useTicketsData(): UseTicketsDataResult {
  const { user } = useAuth() || {};
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(
    () => searchParams.get('ticket') || null
  );
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TicketType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // limitToLast begrenzt den Listener auf die 100 neuesten Tickets (Push-Keys
    // sind chronologisch). Spart massiv Egress, weil ein einzelner Ticket-Update
    // sonst den kompletten Tickets-Node neu herunterlaedt.
    const query = dbRef('bugTickets').orderByKey().limitToLast(100);
    const handler = query.on('value', (snap) => {
      const val = snap.val();
      if (val) {
        const list = Object.values(val) as BugTicket[];
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setTickets(list);
      } else {
        setTickets([]);
      }
      setLoading(false);
    });
    return () => query.off('value', handler);
  }, []);

  // Auto-scroll to expanded ticket from notification
  useEffect(() => {
    if (expandedId && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [expandedId]);

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
      const ticket = tickets.find((t) => t.id === ticketId);
      if (
        updates.status &&
        ['done', 'rejected', 'obsolete'].includes(updates.status) &&
        ticket?.screenshots?.length
      ) {
        await deleteScreenshots(ticket.screenshots);
        updates.screenshots = [];
      }
      await dbRef(`bugTickets/${ticketId}`).update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      if (updates.status && ticket && updates.status !== ticket.status) {
        const statusLabel = (STATUS_CONFIG[updates.status] || STATUS_CONFIG.done).label;
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_status',
          title: 'Ticket-Status geändert',
          message: `Dein Ticket "${ticket.title}" ist jetzt: ${statusLabel}`,
          data: { ticketId, ticketType: ticket.ticketType || 'bug' },
        });
      }
    },
    [tickets, deleteScreenshots]
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
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_reply',
          title: 'Antwort auf dein Ticket',
          message: `Admin hat auf "${ticket.title}" geantwortet: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`,
          data: { ticketId, ticketType: ticket.ticketType || 'bug' },
        });
      }
    },
    [user, tickets]
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
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket?.screenshots?.length) {
        await deleteScreenshots(ticket.screenshots);
      }
      await dbRef(`bugTickets/${ticketId}`).remove();
    },
    [tickets, deleteScreenshots]
  );

  const filtered = useMemo(() => {
    let result = tickets;
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter((t) => (t.ticketType || 'bug') === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.createdByName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, statusFilter, typeFilter, searchQuery]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const key of Object.keys(STATUS_CONFIG)) {
      c[key] = tickets.filter((t) => t.status === key).length;
    }
    c['bug'] = tickets.filter((t) => (t.ticketType || 'bug') === 'bug').length;
    c['feature'] = tickets.filter((t) => t.ticketType === 'feature').length;
    // Touch TYPE_CONFIG so the import isn't tree-shaken away — kept here for
    // future per-type stats without re-importing in TicketsTab.
    void TYPE_CONFIG;
    return c;
  }, [tickets]);

  return {
    tickets,
    loading,
    filtered,
    counts,
    expandedId,
    setExpandedId,
    expandedRef,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    updateTicket,
    addAdminComment,
    addAdminNote,
    deleteTicket,
  };
}
