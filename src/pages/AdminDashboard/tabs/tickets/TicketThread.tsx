import { CheckCircleOutlined, ContentCopy, Send } from '@mui/icons-material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LinkifiedText } from '../../../../components/ui/display/LinkifiedText';
import { copyTextToClipboard } from '../../../../utils/clipboard';
import { formatAgoLabel, formatExactDateTime } from '../../../../utils/timeLabels';
import type { BugTicket } from '../../../BugReport/types';
import { isArchivedStatus } from '../../../BugReport/types';
import { buildThread, type ThreadEntry } from './ticketQueue';

const VISIBLE_TAIL = 5;

type Mode = 'reply' | 'note';

/** Entwürfe je Ticket, damit beim Wechseln zwischen Tickets nichts verloren geht. */
const drafts = new Map<string, { mode: Mode; text: string }>();

interface TicketThreadProps {
  ticket: BugTicket;
  now: number;
  onReply: (text: string) => Promise<void>;
  onNote: (text: string) => Promise<void>;
  onReplyAndResolve: (text: string) => Promise<void>;
}

function Message({ entry, now }: { entry: ThreadEntry; now: number }) {
  const [copied, setCopied] = useState(false);
  const variant = entry.kind === 'note' ? 'note' : entry.isAdmin ? 'admin' : 'user';
  return (
    <div className={`tk-msg tk-msg--${variant}`}>
      <div className="tk-msg__head">
        <span className="tk-msg__who">
          {variant === 'note' ? 'Interne Notiz' : entry.authorName}
        </span>
        <span title={formatExactDateTime(entry.createdAt)}>
          {formatAgoLabel(entry.createdAt, now)}
        </span>
        <button
          type="button"
          className="tk-msg__copy"
          title="Text kopieren"
          onClick={() => {
            void copyTextToClipboard(entry.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Kopiert' : <ContentCopy style={{ fontSize: 13 }} />}
        </button>
      </div>
      <div className="tk-msg__text">
        <LinkifiedText text={entry.text} />
      </div>
    </div>
  );
}

export function TicketThread({
  ticket,
  now,
  onReply,
  onNote,
  onReplyAndResolve,
}: TicketThreadProps) {
  const thread = buildThread(ticket);
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<Mode>(() => drafts.get(ticket.id)?.mode || 'reply');
  const [text, setText] = useState(() => drafts.get(ticket.id)?.text || '');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const archived = isArchivedStatus(ticket.status);

  useEffect(() => {
    if (text.trim()) drafts.set(ticket.id, { mode, text });
    else drafts.delete(ticket.id);
  }, [ticket.id, mode, text]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const hidden = showAll ? 0 : Math.max(0, thread.length - VISIBLE_TAIL);
  const visible = thread.slice(hidden);

  const submit = async (resolve = false) => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      if (mode === 'note') await onNote(value);
      else if (resolve) await onReplyAndResolve(value);
      else await onReply(value);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="tk-thread">
      <div className="tk-thread__head">
        <span>Verlauf</span>
        <span className="tk-thread__count">{thread.length}</span>
      </div>

      <div className="tk-thread__scroll" ref={scrollRef}>
        {thread.length === 0 && (
          <div className="tk-thread__empty">Noch keine Antwort. Schreib die erste unten.</div>
        )}
        {hidden > 0 && (
          <button type="button" className="tk-thread__more" onClick={() => setShowAll(true)}>
            {hidden === 1 ? '1 ältere Nachricht' : `${hidden} ältere Nachrichten`} anzeigen
          </button>
        )}
        {visible.map((entry) => (
          <Message key={`${entry.kind}-${entry.id}`} entry={entry} now={now} />
        ))}
      </div>

      <div className={`tk-composer tk-composer--${mode}`}>
        <div className="tk-seg tk-seg--sm">
          <button
            type="button"
            className={mode === 'reply' ? 'is-on' : ''}
            onClick={() => setMode('reply')}
          >
            Antwort an {ticket.createdByName || 'Nutzer'}
          </button>
          <button
            type="button"
            className={mode === 'note' ? 'is-on' : ''}
            onClick={() => setMode('note')}
          >
            Interne Notiz
          </button>
        </div>
        <textarea
          ref={inputRef}
          className="adm-textarea tk-composer__input"
          rows={2}
          value={text}
          placeholder={
            mode === 'note'
              ? 'Nur für dich sichtbar …'
              : 'Antwort schreiben, der Nutzer bekommt eine Push …'
          }
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit(e.ctrlKey || e.metaKey);
            }
          }}
        />
        <div className="tk-composer__foot">
          <span className="tk-composer__hint">
            Enter senden · Shift+Enter neue Zeile
            {mode === 'reply' && !archived ? ' · Strg+Enter senden & erledigt' : ''}
          </span>
          {mode === 'reply' && !archived && (
            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              disabled={!text.trim() || sending}
              onClick={() => void submit(true)}
            >
              <CheckCircleOutlined style={{ fontSize: 16 }} /> Senden & erledigt
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            disabled={!text.trim() || sending}
            onClick={() => void submit()}
          >
            <Send style={{ fontSize: 15 }} /> {mode === 'note' ? 'Notiz speichern' : 'Senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
