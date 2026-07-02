import { ChatBubbleOutline, ExpandMore, Send } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import type { BugTicket } from '../types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from '../types';
import { tapScale } from '../../../lib/motion';

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

interface TicketCardProps {
  ticket: BugTicket;
  theme: ThemeContextType['currentTheme'];
  expanded: boolean;
  onToggle: () => void;
  onAddComment: (text: string) => Promise<boolean>;
  onUpdate: (updates: { title?: string; description?: string }) => Promise<boolean>;
}

export function TicketCard({
  ticket,
  theme,
  expanded,
  onToggle,
  onAddComment,
  onUpdate,
}: TicketCardProps) {
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const [editDesc, setEditDesc] = useState(ticket.description);
  const isClosed =
    ticket.status === 'done' || ticket.status === 'rejected' || ticket.status === 'obsolete';
  const canEdit = ticket.status === 'open' || ticket.status === 'in-progress';
  const [reopenMode, setReopenMode] = useState(false);
  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.done;
  const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const typeCfg = TYPE_CONFIG[ticket.ticketType || 'bug'];
  const comments = ticket.comments ? Object.values(ticket.comments) : [];
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    const success = await onAddComment(commentText.trim());
    if (success) setCommentText('');
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: '12px',
        background: theme.background.surface,
        border: `1px solid rgba(255,255,255,0.06)`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 16px',
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
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
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
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${statusCfg.color}20`,
                color: statusCfg.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
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
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary }}>
            {ticket.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{new Date(ticket.createdAt).toLocaleDateString('de-DE')}</span>
            {comments.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ChatBubbleOutline style={{ fontSize: 12 }} />
                {comments.length}
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
            marginTop: '2px',
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
            <div
              style={{
                padding: '0 16px 16px',
                borderTop: `1px solid rgba(255,255,255,0.04)`,
              }}
            >
              {editing ? (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.text.muted,
                        marginBottom: '4px',
                        display: 'block',
                        fontWeight: 600,
                      }}
                    >
                      Titel
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: theme.background.default,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: theme.text.secondary,
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '11px',
                        color: theme.text.muted,
                        marginBottom: '4px',
                        display: 'block',
                        fontWeight: 600,
                      }}
                    >
                      Beschreibung
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: theme.background.default,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: theme.text.secondary,
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditTitle(ticket.title);
                        setEditDesc(ticket.description);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'transparent',
                        color: theme.text.muted,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={async () => {
                        const success = await onUpdate({
                          title: editTitle.trim(),
                          description: editDesc.trim(),
                        });
                        if (success) setEditing(false);
                      }}
                      disabled={!editTitle.trim() || !editDesc.trim()}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        background:
                          editTitle.trim() && editDesc.trim()
                            ? theme.primary
                            : `${theme.primary}30`,
                        color: editTitle.trim() && editDesc.trim() ? '#fff' : `${theme.primary}60`,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: editTitle.trim() && editDesc.trim() ? 'pointer' : 'default',
                      }}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: theme.text.muted, fontWeight: 600 }}>
                      Beschreibung
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setEditing(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: theme.primary,
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Bearbeiten
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: theme.text.secondary,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ticket.description}
                  </div>
                </div>
              )}

              {ticket.stepsToReproduce && (
                <div style={{ marginTop: '12px' }}>
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
                    }}
                  >
                    {ticket.stepsToReproduce}
                  </div>
                </div>
              )}

              {ticket.screenshots?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.text.muted,
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Screenshots
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ticket.screenshots.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          loading="lazy"
                          style={{
                            width: '120px',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `1px solid rgba(255,255,255,0.08)`,
                          }}
                          decoding="async"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {comments.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.text.muted,
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}
                  >
                    Kommentare
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: c.isAdmin ? `${theme.primary}10` : theme.background.default,
                          borderLeft: c.isAdmin ? `3px solid ${theme.primary}` : 'none',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: c.isAdmin ? theme.primary : theme.text.secondary,
                            marginBottom: '3px',
                          }}
                        >
                          {c.authorName}
                          {c.isAdmin && (
                            <span
                              style={{
                                fontSize: '9px',
                                background: theme.primary,
                                color: '#fff',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                marginLeft: '6px',
                                fontWeight: 700,
                              }}
                            >
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: theme.text.secondary,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {c.text}
                        </div>
                        <div
                          style={{ fontSize: '10px', color: theme.text.muted, marginTop: '4px' }}
                        >
                          {new Date(c.createdAt).toLocaleString('de-DE')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isClosed ? (
                <div style={{ marginTop: '12px' }}>
                  {!reopenMode ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setReopenMode(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.border.default}`,
                        background: theme.background.default,
                        color: theme.text.secondary,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Wiedereroeffnung beantragen
                    </motion.button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: theme.text.muted }}>
                        Begruendung fuer die Wiedereroeffnung:
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          setCommentText(e.target.value);
                          autoResize(e.target);
                        }}
                        placeholder="Warum soll das Ticket wieder geoeffnet werden?"
                        rows={2}
                        style={{
                          padding: '8px 12px',
                          background: theme.background.default,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: '8px',
                          color: theme.text.secondary,
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'none',
                          fontFamily: 'inherit',
                          overflow: 'hidden',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button
                          whileTap={tapScale}
                          onClick={() => {
                            setReopenMode(false);
                            setCommentText('');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.border.default}`,
                            background: 'transparent',
                            color: theme.text.secondary,
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Abbrechen
                        </motion.button>
                        <motion.button
                          whileTap={tapScale}
                          onClick={async () => {
                            if (!commentText.trim()) return;
                            setSending(true);
                            const success = await onAddComment(
                              `[Antrag auf Wiedereroeffnung] ${commentText.trim()}`
                            );
                            if (success) {
                              setCommentText('');
                              setReopenMode(false);
                            }
                            setSending(false);
                          }}
                          disabled={!commentText.trim() || sending}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background:
                              commentText.trim() && !sending ? '#f59e0b' : `${theme.primary}30`,
                            color: commentText.trim() && !sending ? '#000' : `${theme.primary}60`,
                            cursor: commentText.trim() && !sending ? 'pointer' : 'default',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                          }}
                        >
                          Antrag senden
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <textarea
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      autoResize(e.target);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                        const ta = e.target as HTMLTextAreaElement;
                        ta.style.height = 'auto';
                      }
                    }}
                    placeholder="Kommentar schreiben..."
                    rows={1}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: theme.background.default,
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: theme.text.secondary,
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      overflow: 'hidden',
                    }}
                  />
                  <motion.button
                    whileTap={tapScale}
                    onClick={handleSendComment}
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
                    }}
                  >
                    <Send style={{ fontSize: 16 }} />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
