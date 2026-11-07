import { ArrowBack, ContentCopy, Delete, ExpandLess, ExpandMore, Inbox } from '@mui/icons-material';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { LinkifiedText } from '../../../../components/ui/display/LinkifiedText';
import { storageUrlOrNull } from '../../../../lib/url/safeUrl';
import { copyTextToClipboard } from '../../../../utils/clipboard';
import {
  formatAgoLabel,
  formatDateTimeLabel,
  formatExactDateTime,
} from '../../../../utils/timeLabels';
import type { BugTicket, TicketPriority, TicketStatus } from '../../../BugReport/types';
import {
  normalizeStatus,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TICKET_STATUSES,
} from '../../../BugReport/types';
import { buildThread } from './ticketQueue';
import { TicketContextSection } from './TicketContextSection';
import { TicketThread } from './TicketThread';
import type { TicketsData } from './useTicketsData';

function exportJson(ticket: BugTicket): string {
  const thread = buildThread(ticket);
  const data = {
    id: ticket.id,
    type: ticket.ticketType || 'bug',
    title: ticket.title,
    status: normalizeStatus(ticket.status),
    priority: ticket.priority,
    createdBy: ticket.createdByName,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    description: ticket.description,
    stepsToReproduce: ticket.stepsToReproduce || undefined,
    consoleErrors: ticket.consoleErrors || undefined,
    device: ticket.device || undefined,
    context: ticket.context || undefined,
    screenshots: ticket.screenshots?.length ? ticket.screenshots : undefined,
    thread: thread.length
      ? thread.map((e) => ({
          kind: e.kind,
          author: e.authorName,
          isAdmin: e.isAdmin,
          text: e.text,
          date: e.createdAt,
        }))
      : undefined,
  };
  return JSON.stringify(JSON.parse(JSON.stringify(data)), null, 2);
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="tk-block">
      <h4 className="tk-block__title">{title}</h4>
      {children}
    </section>
  );
}

interface TicketDetailProps {
  data: TicketsData;
  now: number;
}

export function TicketDetail({ data, now }: TicketDetailProps) {
  const ticket = data.selected;
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!ticket) {
    return (
      <section className="tk-pane tk-detail tk-detail--empty">
        <Inbox style={{ fontSize: 40 }} />
        <div className="adm-empty__t">Ticket auswählen</div>
        <div className="adm-empty__s">J / K springt durch die Liste.</div>
      </section>
    );
  }

  const index = data.items.findIndex((item) => item.ticket.id === ticket.id);
  const prevId = index > 0 ? data.items[index - 1].ticket.id : null;
  const nextId =
    index >= 0 && index < data.items.length - 1 ? data.items[index + 1].ticket.id : null;
  const status = normalizeStatus(ticket.status);
  const isFeature = ticket.ticketType === 'feature';
  const screenshots = (ticket.screenshots || []).filter(storageUrlOrNull);
  const setStatus = (next: TicketStatus) => {
    if (next !== status) void data.updateTicket(ticket.id, { status: next });
  };
  const setPriority = (next: TicketPriority) => {
    if (next !== ticket.priority) void data.updateTicket(ticket.id, { priority: next });
  };

  return (
    <section
      className="tk-pane tk-detail"
      style={{ '--adm-tone': STATUS_CONFIG[status].color } as CSSProperties}
    >
      <header className="tk-detail__head">
        <div className="tk-detail__top">
          <button
            type="button"
            className="adm-btn adm-btn--ghost tk-back"
            onClick={() => data.setSelectedId(null)}
          >
            <ArrowBack style={{ fontSize: 16 }} /> Liste
          </button>
          <span className={`adm-tag tk-type ${isFeature ? 'tk-type--feature' : ''}`}>
            {isFeature ? 'Feature' : 'Bug'}
          </span>
          <button
            type="button"
            className="adm-pill tk-id"
            title="ID kopieren"
            onClick={() => void copyTextToClipboard(ticket.id)}
          >
            #{ticket.id.slice(-6)}
          </button>
          <div className="tk-detail__acts">
            <div className="tk-stepper">
              <button
                type="button"
                className="adm-icon-btn"
                title="Vorheriges Ticket (K)"
                aria-label="Vorheriges Ticket"
                disabled={!prevId}
                onClick={() => prevId && data.setSelectedId(prevId)}
              >
                <ExpandLess style={{ fontSize: 18 }} />
              </button>
              <button
                type="button"
                className="adm-icon-btn"
                title="Nächstes Ticket (J)"
                aria-label="Nächstes Ticket"
                disabled={!nextId}
                onClick={() => nextId && data.setSelectedId(nextId)}
              >
                <ExpandMore style={{ fontSize: 18 }} />
              </button>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              title="Ticket als JSON kopieren"
              onClick={() => {
                void copyTextToClipboard(exportJson(ticket));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <ContentCopy style={{ fontSize: 14 }} />{' '}
              <span className="tk-wide-only">{copied ? 'Kopiert' : 'JSON'}</span>
            </button>
            {confirmDelete === ticket.id ? (
              <>
                <button
                  type="button"
                  className="adm-btn adm-btn--danger"
                  onClick={() => {
                    setConfirmDelete(null);
                    void data.deleteTicket(ticket.id);
                  }}
                >
                  Endgültig löschen
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--ghost"
                  onClick={() => setConfirmDelete(null)}
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <button
                type="button"
                className="adm-icon-btn"
                title="Ticket löschen"
                onClick={() => setConfirmDelete(ticket.id)}
              >
                <Delete style={{ fontSize: 16 }} />
              </button>
            )}
          </div>
        </div>

        <h2 className="tk-detail__title">{ticket.title}</h2>
        <div className="tk-detail__meta">
          <b>{ticket.createdByName}</b>
          <span title={formatExactDateTime(ticket.createdAt)}>
            erstellt {formatDateTimeLabel(ticket.createdAt, now)}
          </span>
          <span title={formatExactDateTime(ticket.updatedAt)}>
            zuletzt {formatAgoLabel(ticket.updatedAt, now)}
          </span>
          {ticket.closedByUser || ticket.status === 'closed' ? (
            <span className="tk-detail__flag">vom Nutzer selbst geschlossen</span>
          ) : null}
        </div>

        <div className="tk-controls">
          <div className="tk-seg" role="radiogroup" aria-label="Status">
            {TICKET_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                className={status === s ? 'is-on' : ''}
                style={{ '--adm-tone': STATUS_CONFIG[s].color } as CSSProperties}
                onClick={() => setStatus(s)}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="tk-seg" role="radiogroup" aria-label="Priorität">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={ticket.priority === p}
                className={ticket.priority === p ? 'is-on' : ''}
                style={{ '--adm-tone': PRIORITY_CONFIG[p].color } as CSSProperties}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="tk-detail__body">
        <div className="tk-info">
          <Block title="Beschreibung">
            <div className="tk-text">
              <LinkifiedText text={ticket.description} />
            </div>
          </Block>

          {ticket.stepsToReproduce && (
            <Block title={isFeature ? 'Ablauf' : 'Schritte zum Reproduzieren'}>
              <div className="tk-text">{ticket.stepsToReproduce}</div>
            </Block>
          )}

          {screenshots.length > 0 && (
            <Block title={`Screenshots · ${screenshots.length}`}>
              <div className="tk-shots">
                {screenshots.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Screenshot ${i + 1}`} loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
            </Block>
          )}

          {ticket.context && (
            <Block title="Seitenkontext">
              <TicketContextSection context={ticket.context} />
            </Block>
          )}

          {ticket.consoleErrors && (
            <Block title="Konsolenfehler (vom Nutzer eingefügt)">
              <pre className="adm-code tk-errors">{ticket.consoleErrors}</pre>
            </Block>
          )}

          {ticket.device && !ticket.context && (
            <Block title="Gerät">
              <div className="tk-text tk-text--muted">{ticket.device}</div>
            </Block>
          )}
        </div>

        <TicketThread
          key={ticket.id}
          ticket={ticket}
          now={now}
          onReply={(text) => data.addAdminComment(ticket.id, text)}
          onNote={(text) => data.addAdminNote(ticket.id, text)}
          onReplyAndResolve={async (text) => {
            await data.addAdminComment(ticket.id, text);
            await data.updateTicket(ticket.id, { status: 'done' });
          }}
        />
      </div>
    </section>
  );
}
