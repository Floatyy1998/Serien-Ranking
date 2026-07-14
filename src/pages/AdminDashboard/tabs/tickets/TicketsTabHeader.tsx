import { Search } from '@mui/icons-material';
import type { TicketStatus, TicketType } from '../../../BugReport/types';
import { STATUS_CONFIG, TYPE_CONFIG } from '../../../BugReport/types';
import type { TicketTheme } from './ticketStyles';

interface TicketsTabHeaderProps {
  theme: TicketTheme;
  totalCount: number;
  counts: Record<string, number>;
  statusFilter: TicketStatus | 'all';
  setStatusFilter: (s: TicketStatus | 'all') => void;
  typeFilter: TicketType | 'all';
  setTypeFilter: (t: TicketType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function TicketsTabHeader({
  theme,
  totalCount,
  counts,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  searchQuery,
  setSearchQuery,
}: TicketsTabHeaderProps) {
  return (
    <>
      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'Gesamt', value: totalCount, color: theme.text.secondary },
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

      {/* Search */}
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

      {/* Filters */}
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
    </>
  );
}
