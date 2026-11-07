import { ChatBubbleOutlined, Refresh, Search } from '@mui/icons-material';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { normalizeStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '../../../BugReport/types';
import { formatAgoLabel } from '../../../../utils/timeLabels';
import { needsReply, type TicketQueue, type TicketSort } from './ticketQueue';
import type { TicketsData } from './useTicketsData';

const QUEUES: { id: TicketQueue; label: string; tone?: string }[] = [
  { id: 'inbox', label: 'Eingang' },
  { id: 'waiting', label: 'Wartet auf dich', tone: 'var(--adm-warn)' },
  { id: 'done', label: 'Erledigt', tone: STATUS_CONFIG.done.color },
  { id: 'rejected', label: 'Abgelehnt', tone: STATUS_CONFIG.rejected.color },
  { id: 'obsolete', label: 'Hinfällig', tone: STATUS_CONFIG.obsolete.color },
  { id: 'all', label: 'Alle' },
];

const SORTS: { id: TicketSort; label: string }[] = [
  { id: 'newest', label: 'Neueste' },
  { id: 'oldest', label: 'Älteste' },
  { id: 'activity', label: 'Aktivität' },
];

export function TicketList({ data, now }: { data: TicketsData; now: number }) {
  const listRef = useRef<HTMLDivElement>(null);
  const { items, selectedId } = data;

  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-ticket="${selectedId}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section className="tk-pane tk-list" aria-label="Ticketliste">
      <div className="tk-list__head">
        <label className="adm-search tk-search">
          <Search style={{ fontSize: 18 }} />
          <input
            value={data.searchQuery}
            onChange={(e) => data.setSearchQuery(e.target.value)}
            placeholder="Titel, Text, Nutzer oder ID"
          />
        </label>

        <div className="tk-queues" role="tablist">
          {QUEUES.map((q) => (
            <button
              key={q.id}
              type="button"
              role="tab"
              aria-selected={data.queue === q.id}
              className={`tk-queue ${data.queue === q.id ? 'tk-queue--on' : ''}`}
              style={q.tone ? ({ '--adm-tone': q.tone } as CSSProperties) : undefined}
              onClick={() => data.setQueue(q.id)}
            >
              {q.label}
              <span className="tk-queue__n">{data.counts[q.id]}</span>
            </button>
          ))}
        </div>

        <div className="tk-list__tools">
          <div className="tk-seg tk-seg--sm">
            {(['all', 'bug', 'feature'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={data.typeFilter === type ? 'is-on' : ''}
                onClick={() => data.setTypeFilter(type)}
              >
                {type === 'all' ? 'Alle' : type === 'bug' ? 'Bugs' : 'Features'}
              </button>
            ))}
          </div>
          <div className="tk-seg tk-seg--sm">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={data.sort === s.id ? 'is-on' : ''}
                onClick={() => data.setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.pending > 0 && (
        <button type="button" className="tk-refresh" onClick={data.refresh}>
          <Refresh style={{ fontSize: 16 }} />
          {data.pending === 1 ? '1 Änderung' : `${data.pending} Änderungen`} · Liste neu sortieren
        </button>
      )}

      <div className="tk-list__body" ref={listRef}>
        {items.length === 0 && (
          <div className="adm-empty">
            <div className="adm-empty__t">Keine Tickets gefunden.</div>
            <div className="adm-empty__s">
              {data.queue === 'inbox' ? 'Eingang ist leer.' : 'Filter oder Suche anpassen.'}
            </div>
          </div>
        )}
        {items.map(({ ticket, stale }) => {
          const status = STATUS_CONFIG[normalizeStatus(ticket.status)];
          const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
          const commentCount = Object.keys(ticket.comments || {}).length;
          const waiting = needsReply(ticket);
          const isFeature = ticket.ticketType === 'feature';
          return (
            <button
              key={ticket.id}
              type="button"
              data-ticket={ticket.id}
              className={[
                'tk-item',
                selectedId === ticket.id ? 'tk-item--on' : '',
                stale ? 'tk-item--stale' : '',
              ].join(' ')}
              style={{ '--adm-tone': status.color } as CSSProperties}
              onClick={() => data.setSelectedId(ticket.id)}
            >
              <span className="tk-item__bar" />
              <span className="tk-item__main">
                <span className="tk-item__title">
                  <span
                    className={`tk-kind ${isFeature ? 'tk-kind--feature' : 'tk-kind--bug'}`}
                    aria-label={isFeature ? 'Feature' : 'Bug'}
                  />
                  {ticket.title}
                </span>
                <span className="tk-item__meta">
                  <span>{ticket.createdByName}</span>
                  <span>{formatAgoLabel(ticket.createdAt, now)}</span>
                  {commentCount > 0 && (
                    <span className="tk-item__count">
                      <ChatBubbleOutlined style={{ fontSize: 12 }} /> {commentCount}
                    </span>
                  )}
                  {ticket.priority !== 'low' && (
                    <span style={{ color: priority.color, fontWeight: 700 }}>{priority.label}</span>
                  )}
                </span>
              </span>
              <span className="tk-item__side">
                <span className="tk-status">{status.label}</span>
                {waiting && <span className="tk-waiting">Antwort offen</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
