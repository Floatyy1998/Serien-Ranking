import {
  ChatBubbleOutline,
  ContentCopy,
  Delete,
  ExpandMore,
  Search,
  Send,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import { sendNotificationToUser } from '../../../hooks/useDiscussionHelpers';
import type {
  BugTicket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '../../BugReport/types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../../BugReport/types';

interface TicketsTabProps {
  theme: {
    primary: string;
    text: { primary: string; secondary: string; muted: string };
    background: { surface: string; default: string };
    status: { success: string; error: string; warning: string };
    border: { default: string };
  };
}

export function TicketsTab({ theme }: TicketsTabProps) {
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
    const ref = firebase.database().ref('bugTickets');
    const handler = ref.on('value', (snap) => {
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
    return () => ref.off('value', handler);
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
      await firebase
        .database()
        .ref(`bugTickets/${ticketId}`)
        .update({ ...updates, updatedAt: new Date().toISOString() });
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
      const commentId = firebase.database().ref().push().key ?? crypto.randomUUID();
      const comment: TicketComment = {
        id: commentId,
        authorUid: user.uid,
        authorName: user.displayName || 'Admin',
        isAdmin: true,
        text,
        createdAt: new Date().toISOString(),
      };
      await firebase.database().ref(`bugTickets/${ticketId}/comments/${commentId}`).set(comment);
      await firebase
        .database()
        .ref(`bugTickets/${ticketId}/updatedAt`)
        .set(new Date().toISOString());
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
      const noteId = firebase.database().ref().push().key ?? crypto.randomUUID();
      const entry: TicketComment = {
        id: noteId,
        authorUid: user.uid,
        authorName: user.displayName || 'Admin',
        isAdmin: true,
        text,
        createdAt: new Date().toISOString(),
      };
      await firebase.database().ref(`bugTickets/${ticketId}/adminNotes/${noteId}`).set(entry);
    },
    [user]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket?.screenshots?.length) {
        await deleteScreenshots(ticket.screenshots);
      }
      await firebase.database().ref(`bugTickets/${ticketId}`).remove();
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
    return c;
  }, [tickets]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ── Stats Bar ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'Gesamt', value: tickets.length, color: theme.text.secondary },
          { label: 'Offen', value: counts['open'] || 0, color: STATUS_CONFIG.open.color },
          {
            label: 'In Arbeit',
            value: counts['in-progress'] || 0,
            color: STATUS_CONFIG['in-progress'].color,
          },
          { label: 'Bugs', value: counts['bug'] || 0, color: TYPE_CONFIG.bug.color },
          { label: 'Features', value: counts['feature'] || 0, color: TYPE_CONFIG.feature.color },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: '1 1 60px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: theme.background.surface,
              border: '1px solid rgba(255,255,255,0.04)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: theme.text.muted, marginTop: '2px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: theme.text.muted,
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ticket suchen (Titel, Beschreibung, Ersteller)..."
          style={{
            width: '100%',
            padding: '8px 10px 8px 32px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: theme.background.surface,
            color: theme.text.secondary,
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '13px',
              color: theme.text.muted,
              fontWeight: 600,
              marginRight: '2px',
            }}
          >
            Typ:
          </span>
          {[
            { key: 'all' as const, label: 'Alle', color: theme.text.secondary },
            {
              key: 'bug' as const,
              label: `${TYPE_CONFIG.bug.icon} Bug`,
              color: TYPE_CONFIG.bug.color,
            },
            {
              key: 'feature' as const,
              label: `${TYPE_CONFIG.feature.icon} Feature`,
              color: TYPE_CONFIG.feature.color,
            },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                padding: '4px 8px',
                borderRadius: '14px',
                border: 'none',
                background: typeFilter === key ? `${color}20` : 'transparent',
                color: typeFilter === key ? color : theme.text.muted,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '13px',
              color: theme.text.muted,
              fontWeight: 600,
              marginRight: '2px',
            }}
          >
            Status:
          </span>
          {[
            { key: 'all' as const, label: 'Alle', color: theme.text.secondary },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({
              key: k as TicketStatus,
              label: v.label,
              color: v.color,
            })),
          ].map(({ key, label, color }) => {
            const count = counts[key] || 0;
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key as TicketStatus | 'all')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '14px',
                  border: 'none',
                  background: active ? `${color}20` : 'transparent',
                  color: active ? color : theme.text.muted,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
                {count > 0 && <span style={{ opacity: 0.6, marginLeft: '3px' }}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Results Info ── */}
      <div style={{ fontSize: '14px', color: theme.text.muted }}>
        {filtered.length} von {tickets.length} Tickets
        {searchQuery && ` für "${searchQuery}"`}
      </div>

      {/* ── Ticket List ── */}
      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted, fontSize: 16 }}>
          Keine Tickets gefunden.
        </div>
      )}

      {filtered.map((ticket) => (
        <div key={ticket.id} ref={expandedId === ticket.id ? expandedRef : undefined}>
          <TicketCard
            ticket={ticket}
            theme={theme}
            expanded={expandedId === ticket.id}
            onToggle={() => setExpandedId((p) => (p === ticket.id ? null : ticket.id))}
            onUpdateStatus={(s) => updateTicket(ticket.id, { status: s })}
            onUpdatePriority={(p) => updateTicket(ticket.id, { priority: p })}
            onAddAdminNote={(t) => addAdminNote(ticket.id, t)}
            onAddComment={(t) => addAdminComment(ticket.id, t)}
            onDelete={() => deleteTicket(ticket.id)}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Ticket Card ── */

function TicketCard({
  ticket,
  theme,
  expanded,
  onToggle,
  onUpdateStatus,
  onUpdatePriority,
  onAddAdminNote,
  onAddComment,
  onDelete,
}: {
  ticket: BugTicket;
  theme: TicketsTabProps['theme'];
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onUpdatePriority: (priority: TicketPriority) => void;
  onAddAdminNote: (text: string) => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.done;
  const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const typeCfg = TYPE_CONFIG[ticket.ticketType || 'bug'];
  const comments = ticket.comments ? Object.values(ticket.comments) : [];
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const adminNotes = ticket.adminNotes ? Object.values(ticket.adminNotes) : [];
  adminNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const isClosed =
    ticket.status === 'done' || ticket.status === 'rejected' || ticket.status === 'obsolete';

  const handleSend = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    await onAddComment(commentText.trim());
    setCommentText('');
    setSending(false);
  };

  const exportTicket = () => {
    const data = {
      id: ticket.id,
      type: ticket.ticketType || 'bug',
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      createdBy: ticket.createdByName,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      description: ticket.description,
      stepsToReproduce: ticket.stepsToReproduce || undefined,
      consoleErrors: ticket.consoleErrors || undefined,
      device: ticket.device || undefined,
      screenshots: ticket.screenshots?.length ? ticket.screenshots : undefined,
      comments: comments.length
        ? comments.map((c) => ({
            author: c.authorName,
            isAdmin: c.isAdmin,
            text: c.text,
            date: c.createdAt,
          }))
        : undefined,
      adminNotes: adminNotes.length
        ? adminNotes.map((n) => ({ author: n.authorName, text: n.text, date: n.createdAt }))
        : undefined,
    };
    navigator.clipboard.writeText(JSON.stringify(JSON.parse(JSON.stringify(data)), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyComment = (commentId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommentId(commentId);
    setTimeout(() => setCopiedCommentId(null), 2000);
  };

  const [now] = useState(() => Date.now());
  const age = Math.floor((now - new Date(ticket.createdAt).getTime()) / 86400000);
  const ageStr = age === 0 ? 'Heute' : age === 1 ? 'Gestern' : `vor ${age}d`;
  const updatedAge = Math.floor((now - new Date(ticket.updatedAt).getTime()) / 86400000);
  const updatedStr =
    updatedAge === 0 ? 'Heute' : updatedAge === 1 ? 'Gestern' : `vor ${updatedAge}d`;

  return (
    <div
      style={{
        borderRadius: '10px',
        background: theme.background.surface,
        border: expanded ? `1px solid ${statusCfg.color}40` : '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${statusCfg.color}`,
        opacity: isClosed && !expanded ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left',
        }}
      >
        {/* Type Icon */}
        <div
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '8px',
            background: `${typeCfg.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          {typeCfg.icon}
        </div>

        {/* Title + Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: isClosed ? 'line-through' : 'none',
            }}
          >
            {ticket.title}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: theme.text.muted,
              marginTop: '3px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 500 }}>{ticket.createdByName}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>Erstellt {ageStr}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>Update {updatedStr}</span>
            {comments.length > 0 && (
              <>
                <span style={{ opacity: 0.4 }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ChatBubbleOutline style={{ fontSize: 10 }} /> {comments.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <Badge color={priorityCfg.color}>{priorityCfg.label}</Badge>
          <Badge color={statusCfg.color}>{statusCfg.label}</Badge>
        </div>

        <ExpandMore
          style={{
            fontSize: 18,
            color: theme.text.muted,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* ── Actions Bar ── */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: theme.background.default,
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: theme.text.muted, fontWeight: 600 }}>
                    Status:
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => onUpdateStatus(e.target.value as TicketStatus)}
                    style={selectStyle(theme)}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: theme.text.muted, fontWeight: 600 }}>
                    Prio:
                  </label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => onUpdatePriority(e.target.value as TicketPriority)}
                    style={selectStyle(theme)}
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <button
                    onClick={exportTicket}
                    style={actionBtnStyle(copied ? theme.status.success : theme.primary)}
                  >
                    <ContentCopy style={{ fontSize: 12 }} /> {copied ? 'Kopiert!' : 'JSON'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Ticket endgültig löschen?')) onDelete();
                    }}
                    style={actionBtnStyle(theme.status.error)}
                  >
                    <Delete style={{ fontSize: 12 }} /> Löschen
                  </button>
                </div>
              </div>

              {/* ── Ticket Details ── */}
              <div
                style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {/* Beschreibung */}
                <Section title="Beschreibung" theme={theme}>
                  <div style={contentBox(theme)}>{ticket.description}</div>
                </Section>

                {/* Schritte */}
                {ticket.stepsToReproduce && (
                  <Section title="Schritte zum Reproduzieren" theme={theme}>
                    <div style={contentBox(theme)}>{ticket.stepsToReproduce}</div>
                  </Section>
                )}

                {/* Screenshots */}
                {ticket.screenshots?.length > 0 && (
                  <Section title={`Screenshots (${ticket.screenshots.length})`} theme={theme}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ticket.screenshots.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Screenshot ${i + 1}`}
                            style={{
                              width: '140px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              transition: 'transform 0.15s',
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Konsolenfehler */}
                {ticket.consoleErrors && (
                  <Section title="Konsolenfehler" theme={theme}>
                    <pre
                      style={{
                        ...contentBox(theme),
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: theme.status.error,
                        border: `1px solid ${theme.status.error}20`,
                        maxHeight: '150px',
                        overflowY: 'auto',
                      }}
                    >
                      {ticket.consoleErrors}
                    </pre>
                  </Section>
                )}

                {/* Device */}
                {ticket.device && (
                  <div style={{ fontSize: '13px', color: theme.text.muted, padding: '4px 0' }}>
                    Device: {ticket.device.slice(0, 120)}
                  </div>
                )}
              </div>

              {/* ── Kommentare ── */}
              <div style={{ marginTop: '16px' }}>
                <Section title={`Kommentare (${comments.length})`} theme={theme}>
                  {comments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: c.isAdmin ? `${theme.primary}10` : theme.background.default,
                            borderLeft: c.isAdmin
                              ? `3px solid ${theme.primary}`
                              : `3px solid ${theme.text.muted}30`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: c.isAdmin ? theme.primary : theme.text.secondary,
                              }}
                            >
                              {c.authorName}
                            </span>
                            {c.isAdmin && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  background: theme.primary,
                                  color: '#fff',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  fontWeight: 700,
                                }}
                              >
                                ADMIN
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '13px',
                                color: theme.text.muted,
                                marginLeft: 'auto',
                              }}
                            >
                              {new Date(c.createdAt).toLocaleString('de-DE')}
                            </span>
                            <button
                              onClick={() => copyComment(c.id, c.text)}
                              title="Kommentar kopieren"
                              style={{
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: 'none',
                                background:
                                  copiedCommentId === c.id
                                    ? `${theme.status.success}20`
                                    : 'transparent',
                                color:
                                  copiedCommentId === c.id
                                    ? theme.status.success
                                    : theme.text.muted,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '12px',
                                transition: 'all 0.15s',
                              }}
                            >
                              <ContentCopy style={{ fontSize: 13 }} />
                              {copiedCommentId === c.id && 'Kopiert!'}
                            </button>
                          </div>
                          <div
                            style={{
                              fontSize: '15px',
                              color: theme.text.secondary,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {c.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <textarea
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        autoResize(e.target);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                          const ta = e.target as HTMLTextAreaElement;
                          ta.style.height = 'auto';
                        }
                      }}
                      placeholder="Antwort schreiben (sichtbar für User)..."
                      rows={1}
                      style={{
                        ...inputStyle(theme),
                        resize: 'none',
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!commentText.trim() || sending}
                      style={sendBtnStyle(theme, !!(commentText.trim() && !sending))}
                    >
                      <Send style={{ fontSize: 13 }} />
                    </button>
                  </div>
                </Section>
              </div>

              {/* ── Interne Notizen ── */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: `${theme.status.warning}06`,
                  border: `1px dashed ${theme.status.warning}25`,
                }}
              >
                <Section
                  title="Interne Notizen (nur Admin)"
                  theme={theme}
                  color={theme.status.warning}
                >
                  {adminNotes.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      {adminNotes.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            fontSize: '14px',
                            color: theme.text.secondary,
                            padding: '4px 0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: theme.status.warning, fontWeight: 600 }}>
                              {n.authorName}
                            </span>
                            <span style={{ color: theme.text.muted, fontSize: '13px' }}>
                              {new Date(n.createdAt).toLocaleString('de-DE')}
                            </span>
                          </div>
                          <div style={{ marginTop: '2px', whiteSpace: 'pre-wrap' }}>{n.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <textarea
                      value={noteText}
                      onChange={(e) => {
                        setNoteText(e.target.value);
                        autoResize(e.target);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && noteText.trim()) {
                          e.preventDefault();
                          onAddAdminNote(noteText.trim());
                          setNoteText('');
                          const ta = e.target as HTMLTextAreaElement;
                          ta.style.height = 'auto';
                        }
                      }}
                      placeholder="Interne Notiz hinzufügen..."
                      rows={1}
                      style={{
                        ...inputStyle(theme),
                        borderColor: `${theme.status.warning}25`,
                        resize: 'none',
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                      }}
                    />
                    <button
                      onClick={() => {
                        if (noteText.trim()) {
                          onAddAdminNote(noteText.trim());
                          setNoteText('');
                        }
                      }}
                      disabled={!noteText.trim()}
                      style={sendBtnStyle(theme, !!noteText.trim(), theme.status.warning)}
                    >
                      +
                    </button>
                  </div>
                </Section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helper Components ── */

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: '5px',
        background: `${color}15`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
  theme,
  color,
}: {
  title: string;
  children: React.ReactNode;
  theme: TicketsTabProps['theme'];
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: color || theme.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/* ── Helpers ── */

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

/* ── Shared Styles ── */

const selectStyle = (theme: TicketsTabProps['theme']): React.CSSProperties => ({
  padding: '5px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: theme.background.surface,
  color: theme.text.secondary,
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
});

const actionBtnStyle = (color: string): React.CSSProperties => ({
  padding: '5px 10px',
  borderRadius: '6px',
  border: 'none',
  background: `${color}15`,
  color,
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const contentBox = (theme: TicketsTabProps['theme']): React.CSSProperties => ({
  fontSize: '15px',
  color: theme.text.secondary,
  whiteSpace: 'pre-wrap',
  padding: '10px 12px',
  borderRadius: '8px',
  background: theme.background.default,
  margin: 0,
  lineHeight: 1.5,
});

const inputStyle = (theme: TicketsTabProps['theme']): React.CSSProperties => ({
  flex: 1,
  padding: '7px 10px',
  background: theme.background.default,
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: theme.text.secondary,
  fontSize: '15px',
  outline: 'none',
});

const sendBtnStyle = (
  theme: TicketsTabProps['theme'],
  active: boolean,
  color?: string
): React.CSSProperties => ({
  padding: '7px 12px',
  borderRadius: '6px',
  border: 'none',
  background: active ? color || theme.primary : `${color || theme.primary}30`,
  color: active ? '#fff' : `${color || theme.primary}60`,
  fontSize: '15px',
  fontWeight: 600,
  cursor: active ? 'pointer' : 'default',
  display: 'flex',
  alignItems: 'center',
});
