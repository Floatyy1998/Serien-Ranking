import {
  Add,
  AttachFile,
  ChatBubbleOutline,
  Close,
  ExpandMore,
  Feedback,
  PhotoCamera,
  Send,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useRef, useState } from 'react';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { BugTicket, TicketType } from './types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG } from './types';
import { useBugReportData } from './useBugReportData';

export const BugReportPage = memo(() => {
  const { currentTheme } = useTheme();
  const { tickets, loading, uploadScreenshot, createTicket, addComment } = useBugReportData();
  const [showForm, setShowForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  return (
    <PageLayout>
      <PageHeader
        title="Feedback & Bugs"
        gradientFrom={currentTheme.primary}
        subtitle="Bugs melden oder Features vorschlagen"
        icon={<Feedback />}
        sticky
      />

      <div style={{ padding: '16px', paddingBottom: '100px' }}>
        {/* New Ticket Button */}
        {!showForm && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: `2px dashed ${currentTheme.primary}40`,
              background: `${currentTheme.primary}08`,
              color: currentTheme.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <Add style={{ fontSize: 20 }} />
            Neues Ticket erstellen
          </motion.button>
        )}

        {/* New Ticket Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <NewTicketForm
                theme={currentTheme}
                onSubmit={async (data) => {
                  const success = await createTicket(data);
                  if (success) setShowForm(false);
                  return success;
                }}
                onCancel={() => setShowForm(false)}
                onUpload={uploadScreenshot}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket List */}
        <h3
          style={{
            fontSize: '14px',
            color: currentTheme.text.secondary,
            margin: '0 0 12px',
            fontWeight: 600,
          }}
        >
          Meine Tickets ({tickets.length})
        </h3>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: currentTheme.text.muted }}>
            Laden...
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
              fontSize: '14px',
            }}
          >
            Du hast noch keine Tickets erstellt.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                theme={currentTheme}
                expanded={expandedTicket === ticket.id}
                onToggle={() =>
                  setExpandedTicket((prev) => (prev === ticket.id ? null : ticket.id))
                }
                onAddComment={(text) => addComment(ticket.id, text)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
});

BugReportPage.displayName = 'BugReportPage';

/* ── New Ticket Form ── */

function NewTicketForm({
  theme,
  onSubmit,
  onCancel,
  onUpload,
}: {
  theme: ReturnType<typeof useTheme>['currentTheme'];
  onSubmit: (data: {
    ticketType: TicketType;
    title: string;
    description: string;
    stepsToReproduce: string;
    screenshots: string[];
    consoleErrors?: string;
  }) => Promise<boolean>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [ticketType, setTicketType] = useState<TicketType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consoleErrors, setConsoleErrors] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      setUploading(true);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const url = await onUpload(file);
        if (url) setScreenshots((prev) => [...prev, url]);
      }
      setUploading(false);
      e.target.value = '';
    },
    [onUpload]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        setUploading(true);
        const url = await onUpload(file);
        if (url) setScreenshots((prev) => [...prev, url]);
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const success = await onSubmit({
      ticketType,
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: steps.trim(),
      screenshots,
      consoleErrors: consoleErrors.trim() || undefined,
    });
    if (!success) setSubmitting(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: theme.background.default,
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: theme.text.secondary,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div
      onPaste={handlePaste}
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: theme.background.surface,
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px', color: theme.text.secondary, fontWeight: 600 }}>
          Neues Ticket
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: theme.text.muted,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          <Close style={{ fontSize: 20 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Ticket Type */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['bug', 'feature'] as const).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const active = ticketType === t;
            return (
              <button
                key={t}
                onClick={() => setTicketType(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: active ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: active ? `${cfg.color}15` : theme.background.default,
                  color: active ? cfg.color : theme.text.muted,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? 'Kurze Beschreibung des Problems'
                : 'Kurze Beschreibung des Features'
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Beschreibung *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? 'Was genau ist passiert? Was hast du erwartet?'
                : 'Was soll das Feature können? Warum wäre es nützlich?'
            }
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            {ticketType === 'bug' ? 'Schritte zum Reproduzieren' : 'Beschreibung des Ablaufs'}
          </label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? '1. Gehe zu ...\n2. Klicke auf ...\n3. Der Fehler tritt auf ...'
                : '1. User öffnet ...\n2. User klickt auf ...\n3. Es passiert ...'
            }
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Screenshots */}
        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Screenshots
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {screenshots.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: `1px solid rgba(255,255,255,0.08)`,
                  }}
                />
                <button
                  onClick={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: theme.status.error,
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                border: `2px dashed ${theme.primary}30`,
                background: `${theme.primary}08`,
                color: uploading ? theme.text.muted : theme.primary,
                cursor: uploading ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '10px',
              }}
            >
              {uploading ? (
                '...'
              ) : (
                <>
                  <PhotoCamera style={{ fontSize: 20 }} />
                  Bild
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Console Errors (optional) */}
        {ticketType === 'bug' && (
          <div>
            <label
              style={{
                fontSize: '12px',
                color: theme.text.muted,
                marginBottom: '4px',
                display: 'block',
              }}
            >
              Fehlermeldungen aus der Konsole (optional)
            </label>
            <textarea
              value={consoleErrors}
              onChange={(e) => setConsoleErrors(e.target.value)}
              placeholder="Falls vorhanden: Fehlermeldungen aus der Browser-Konsole (F12) hier einfügen"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            />
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: theme.text.muted,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || submitting}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background:
                title.trim() && description.trim() && !submitting
                  ? theme.primary
                  : `${theme.primary}30`,
              color:
                title.trim() && description.trim() && !submitting ? '#fff' : `${theme.primary}60`,
              fontSize: '13px',
              fontWeight: 600,
              cursor: title.trim() && description.trim() && !submitting ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AttachFile style={{ fontSize: 16 }} />
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ── Ticket Card ── */

function TicketCard({
  ticket,
  theme,
  expanded,
  onToggle,
  onAddComment,
}: {
  ticket: BugTicket;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  expanded: boolean;
  onToggle: () => void;
  onAddComment: (text: string) => Promise<boolean>;
}) {
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const statusCfg = STATUS_CONFIG[ticket.status];
  const priorityCfg = PRIORITY_CONFIG[ticket.priority];
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
      {/* Header */}
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

      {/* Expanded Content */}
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
              {/* Description */}
              <div style={{ marginTop: '12px' }}>
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
                  style={{ fontSize: '13px', color: theme.text.secondary, whiteSpace: 'pre-wrap' }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Steps */}
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

              {/* Screenshots */}
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
                          style={{
                            width: '120px',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: `1px solid rgba(255,255,255,0.08)`,
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
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

              {/* Add Comment (only for open/in-progress tickets) */}
              {(ticket.status === 'open' || ticket.status === 'in-progress') && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                    placeholder="Kommentar schreiben..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: theme.background.default,
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: theme.text.secondary,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
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
