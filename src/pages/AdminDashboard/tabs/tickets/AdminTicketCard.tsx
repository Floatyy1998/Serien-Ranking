import { ChatBubbleOutline, ContentCopy, Delete, ExpandMore, Send } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { BugTicket, TicketPriority, TicketStatus } from '../../../BugReport/types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../../../BugReport/types';
import { Badge, Section } from './ticketHelpers';
import {
  actionBtnStyle,
  autoResize,
  contentBox,
  inputStyle,
  selectStyle,
  sendBtnStyle,
  type TicketTheme,
} from './ticketStyles';

interface AdminTicketCardProps {
  ticket: BugTicket;
  theme: TicketTheme;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onUpdatePriority: (priority: TicketPriority) => void;
  onAddAdminNote: (text: string) => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
  onDelete: () => void;
}

export function AdminTicketCard({
  ticket,
  theme,
  expanded,
  onToggle,
  onUpdateStatus,
  onUpdatePriority,
  onAddAdminNote,
  onAddComment,
  onDelete,
}: AdminTicketCardProps) {
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

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Actions Bar */}
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

              {/* Details */}
              <div
                style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <Section title="Beschreibung" theme={theme}>
                  <div style={contentBox(theme)}>{ticket.description}</div>
                </Section>

                {ticket.stepsToReproduce && (
                  <Section title="Schritte zum Reproduzieren" theme={theme}>
                    <div style={contentBox(theme)}>{ticket.stepsToReproduce}</div>
                  </Section>
                )}

                {ticket.screenshots?.length > 0 && (
                  <Section title={`Screenshots (${ticket.screenshots.length})`} theme={theme}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ticket.screenshots.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Screenshot ${i + 1}`}
                            loading="lazy"
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

                {ticket.device && (
                  <div style={{ fontSize: '13px', color: theme.text.muted, padding: '4px 0' }}>
                    Device: {ticket.device.slice(0, 120)}
                  </div>
                )}
              </div>

              {/* Kommentare */}
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

              {/* Interne Notizen */}
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
