import { ChatBubbleOutline, Delete, ExpandMore, Send } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../AuthContext';
import type { BugTicket, TicketComment, TicketPriority, TicketStatus } from '../../BugReport/types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../../BugReport/types';
import { sendNotificationToUser } from '../../../hooks/useDiscussionHelpers';

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
  const [tickets, setTickets] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');

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

  const deleteScreenshots = useCallback(async (screenshots: string[]) => {
    for (const url of screenshots) {
      try {
        const fileRef = firebase.storage().refFromURL(url);
        await fileRef.delete();
      } catch {
        // Datei existiert evtl. nicht mehr — ignorieren
      }
    }
  }, []);

  const updateTicket = useCallback(
    async (ticketId: string, updates: Partial<BugTicket>) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      // Bei Status "closed": Screenshots aus Storage löschen und aus Ticket entfernen
      if (updates.status === 'closed' && ticket?.screenshots?.length) {
        await deleteScreenshots(ticket.screenshots);
        updates.screenshots = [];
      }
      await firebase
        .database()
        .ref(`bugTickets/${ticketId}`)
        .update({ ...updates, updatedAt: new Date().toISOString() });

      // Notification an User bei Status-Änderung
      if (updates.status && ticket && updates.status !== ticket.status) {
        const statusLabel = STATUS_CONFIG[updates.status].label;
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_status',
          title: 'Ticket-Status geändert',
          message: `Dein Ticket "${ticket.title}" ist jetzt: ${statusLabel}`,
          data: { ticketId },
        });
      }
    },
    [tickets, deleteScreenshots]
  );

  const addAdminComment = useCallback(
    async (ticketId: string, text: string) => {
      if (!user) return;
      const commentId = firebase.database().ref().push().key ?? crypto.randomUUID();
      const displayName = user.displayName || 'Admin';

      const comment: TicketComment = {
        id: commentId,
        authorUid: user.uid,
        authorName: displayName,
        isAdmin: true,
        text,
        createdAt: new Date().toISOString(),
      };

      await firebase.database().ref(`bugTickets/${ticketId}/comments/${commentId}`).set(comment);
      await firebase
        .database()
        .ref(`bugTickets/${ticketId}/updatedAt`)
        .set(new Date().toISOString());

      // Notification an User
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        await sendNotificationToUser(ticket.createdBy, {
          type: 'bug_ticket_reply',
          title: 'Antwort auf dein Ticket',
          message: `Admin hat auf "${ticket.title}" geantwortet: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`,
          data: { ticketId },
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

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(
          [
            ['all', 'Alle', theme.text.secondary],
            ['open', 'Offen', STATUS_CONFIG.open.color],
            ['in-progress', 'In Arbeit', STATUS_CONFIG['in-progress'].color],
            ['resolved', 'Gelöst', STATUS_CONFIG.resolved.color],
            ['closed', 'Geschlossen', STATUS_CONFIG.closed.color],
          ] as const
        ).map(([key, label, color]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: filter === key ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
              background: filter === key ? `${color}15` : theme.background.default,
              color: filter === key ? color : theme.text.muted,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {label}
            <span
              style={{
                background: `${color}20`,
                color,
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {statusCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets */}
      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted, fontSize: 13 }}>
          Keine Tickets in dieser Kategorie.
        </div>
      )}

      <AnimatePresence>
        {filtered.map((ticket) => (
          <AdminTicketCard
            key={ticket.id}
            ticket={ticket}
            theme={theme}
            expanded={expandedId === ticket.id}
            onToggle={() => setExpandedId((prev) => (prev === ticket.id ? null : ticket.id))}
            onUpdateStatus={(status) => updateTicket(ticket.id, { status })}
            onUpdatePriority={(priority) => updateTicket(ticket.id, { priority })}
            onAddAdminNote={(text) => addAdminNote(ticket.id, text)}
            onAddComment={(text) => addAdminComment(ticket.id, text)}
            onDelete={() => deleteTicket(ticket.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Admin Ticket Card ── */

function AdminTicketCard({
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
  const statusCfg = STATUS_CONFIG[ticket.status];
  const priorityCfg = PRIORITY_CONFIG[ticket.priority];
  const typeCfg = TYPE_CONFIG[ticket.ticketType || 'bug'];
  const comments = ticket.comments ? Object.values(ticket.comments) : [];
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const adminNotes = ticket.adminNotes ? Object.values(ticket.adminNotes) : [];
  adminNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSend = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    await onAddComment(commentText.trim());
    setCommentText('');
    setSending(false);
  };

  const selectStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: theme.background.default,
    color: theme.text.secondary,
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        borderRadius: '12px',
        background: theme.background.surface,
        border: `1px solid rgba(255,255,255,0.06)`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                background: `${typeCfg.color}20`,
                color: typeCfg.color,
              }}
            >
              {typeCfg.icon} {typeCfg.label}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px',
                background: `${statusCfg.color}20`,
                color: statusCfg.color,
                textTransform: 'uppercase',
              }}
            >
              {statusCfg.label}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                background: `${priorityCfg.color}15`,
                color: priorityCfg.color,
              }}
            >
              {priorityCfg.label}
            </span>
            <span style={{ fontSize: '11px', color: theme.text.muted }}>
              von {ticket.createdByName}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary }}>
            {ticket.title}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: theme.text.muted,
              marginTop: '3px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <span>{new Date(ticket.createdAt).toLocaleString('de-DE')}</span>
            {comments.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ChatBubbleOutline style={{ fontSize: 11 }} /> {comments.length}
              </span>
            )}
          </div>
        </div>
        <ExpandMore
          style={{
            fontSize: 20,
            color: theme.text.muted,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdateStatus(e.target.value as TicketStatus)}
                  style={selectStyle}
                >
                  <option value="open">Offen</option>
                  <option value="in-progress">In Bearbeitung</option>
                  <option value="resolved">Gelöst</option>
                  <option value="closed">Geschlossen</option>
                </select>
                <select
                  value={ticket.priority}
                  onChange={(e) => onUpdatePriority(e.target.value as TicketPriority)}
                  style={selectStyle}
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
                <button
                  onClick={() => {
                    if (confirm('Ticket wirklich löschen?')) onDelete();
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: `${theme.status.error}15`,
                    color: theme.status.error,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: 'auto',
                  }}
                >
                  <Delete style={{ fontSize: 14 }} /> Löschen
                </button>
              </div>

              {/* Description */}
              <div style={{ marginTop: '14px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.text.muted,
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  Beschreibung
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: theme.text.secondary,
                    whiteSpace: 'pre-wrap',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: theme.background.default,
                  }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Steps */}
              {ticket.stepsToReproduce && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.text.muted,
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Schritte zum Reproduzieren
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: theme.text.secondary,
                      whiteSpace: 'pre-wrap',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: theme.background.default,
                    }}
                  >
                    {ticket.stepsToReproduce}
                  </div>
                </div>
              )}

              {/* Screenshots */}
              {ticket.screenshots?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.text.muted,
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Screenshots ({ticket.screenshots.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ticket.screenshots.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          style={{
                            width: '140px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Console Errors */}
              {ticket.consoleErrors && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.status.error,
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Konsolenfehler
                  </div>
                  <pre
                    style={{
                      fontSize: '11px',
                      color: theme.text.secondary,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: theme.background.default,
                      border: `1px solid ${theme.status.error}20`,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      fontFamily: 'monospace',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {ticket.consoleErrors}
                  </pre>
                </div>
              )}

              {/* Device */}
              {ticket.device && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: theme.text.muted }}>
                  <strong>Gerät:</strong> {ticket.device.slice(0, 120)}
                </div>
              )}

              {/* Admin-interne Notizen */}
              <div style={{ marginTop: '14px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.status.warning,
                    marginBottom: '6px',
                    fontWeight: 600,
                  }}
                >
                  Interne Notizen (nur für Admins)
                </div>
                {adminNotes.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    {adminNotes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: `${theme.status.warning}08`,
                          borderLeft: `3px solid ${theme.status.warning}40`,
                        }}
                      >
                        <div
                          style={{ fontSize: '11px', fontWeight: 600, color: theme.status.warning }}
                        >
                          {n.authorName}
                          <span
                            style={{
                              color: theme.text.muted,
                              fontWeight: 400,
                              marginLeft: '8px',
                              fontSize: '10px',
                            }}
                          >
                            {new Date(n.createdAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: theme.text.secondary,
                            marginTop: '2px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {n.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && noteText.trim()) {
                        onAddAdminNote(noteText.trim());
                        setNoteText('');
                      }
                    }}
                    placeholder="Interne Notiz hinzufügen..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: theme.background.default,
                      border: `1px solid ${theme.status.warning}20`,
                      borderRadius: '8px',
                      color: theme.text.secondary,
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!noteText.trim()) return;
                      onAddAdminNote(noteText.trim());
                      setNoteText('');
                    }}
                    disabled={!noteText.trim()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: noteText.trim()
                        ? theme.status.warning
                        : `${theme.status.warning}30`,
                      color: noteText.trim() ? '#fff' : `${theme.status.warning}60`,
                      fontSize: '12px',
                      cursor: noteText.trim() ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Notiz
                  </button>
                </div>
              </div>

              {/* Comments */}
              {comments.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.text.muted,
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Kommentare ({comments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: c.isAdmin ? `${theme.primary}10` : theme.background.default,
                          borderLeft: c.isAdmin
                            ? `3px solid ${theme.primary}`
                            : '3px solid transparent',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: c.isAdmin ? theme.primary : theme.text.secondary,
                          }}
                        >
                          {c.authorName}
                          {c.isAdmin && (
                            <span
                              style={{
                                fontSize: '9px',
                                background: theme.primary,
                                color: '#fff',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                marginLeft: '5px',
                              }}
                            >
                              ADMIN
                            </span>
                          )}
                          <span
                            style={{
                              color: theme.text.muted,
                              fontWeight: 400,
                              marginLeft: '8px',
                              fontSize: '10px',
                            }}
                          >
                            {new Date(c.createdAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: theme.text.secondary,
                            marginTop: '2px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {c.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Admin Comment */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Admin-Kommentar schreiben..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: theme.background.default,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: theme.text.secondary,
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!commentText.trim() || sending}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      commentText.trim() && !sending ? theme.primary : `${theme.primary}30`,
                    color: commentText.trim() && !sending ? '#fff' : `${theme.primary}60`,
                    cursor: commentText.trim() && !sending ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Send style={{ fontSize: 14 }} /> Antworten
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
