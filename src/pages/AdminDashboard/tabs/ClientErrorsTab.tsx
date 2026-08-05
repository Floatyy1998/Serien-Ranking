import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ContentCopy, Delete, Warning } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { groupReports, type ErrorGroup } from '../../../lib/errorReport/group';
import type { ErrorKind, ErrorReport } from '../../../types/ErrorReport';

interface TabTheme {
  primary: string;
  text: { primary: string; muted: string };
  background: { paper: string };
}

const KIND_LABEL: Record<ErrorKind, string> = {
  render: 'Render',
  error: 'Laufzeit',
  promise: 'Promise',
  resource: 'Ressource',
};

const KIND_COLOR: Record<ErrorKind, string> = {
  render: '#ff4d6d',
  error: '#ff9f1c',
  promise: '#8338ec',
  resource: '#3a86ff',
};

const formatTime = (ts: number): string =>
  ts ? new Date(ts).toLocaleString('de-DE') : 'unbekannt';

const relative = (ts: number): string => {
  if (!ts) return '';
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} h`;
  return `vor ${Math.round(hours / 24)} d`;
};

function groupToText(group: ErrorGroup): string {
  const r = group.latest;
  const env = Object.entries(r.env || {})
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');
  const crumbs = (r.breadcrumbs || [])
    .map((b) => `  +${b.t}ms [${b.type}] ${b.label}${b.detail ? ` (${b.detail})` : ''}`)
    .join('\n');
  return [
    `${r.name}: ${r.message}`,
    `Fingerprint ${group.fingerprint} · ${group.occurrences} Auftreten · ${group.users} Nutzer`,
    `Zuletzt ${formatTime(group.lastTs)}`,
    r.source ? `Quelle: ${r.source}` : '',
    '',
    'Umgebung:',
    env,
    '',
    'Verlauf:',
    crumbs,
    '',
    'Stack:',
    r.stack || '(keiner)',
    r.componentStack ? `\nComponent-Stack:\n${r.componentStack}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function ClientErrorsTab({ theme }: { theme: TabTheme }) {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [kind, setKind] = useState<ErrorKind | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const ref = dbRef('clientErrors').orderByChild('ts').limitToLast(300);
    const handler = ref.on('value', (snap) => {
      const val = snap.val() as Record<string, ErrorReport> | null;
      setReports(val ? Object.values(val) : []);
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  const groups = useMemo(() => {
    const filtered = reports.filter((r) => !kind || r.kind === kind);
    return groupReports(filtered).filter((g) => !openOnly || g.openCount > 0);
  }, [reports, kind, openOnly]);

  const totals = useMemo(() => {
    const users = new Set(reports.map((r) => r.uid).filter(Boolean));
    return {
      groups: groupReports(reports).length,
      open: reports.filter((r) => r.status !== 'resolved').length,
      users: users.size,
      occurrences: reports.reduce((sum, r) => sum + 1 + (r.suppressed || 0), 0),
    };
  }, [reports]);

  const idsOf = (fingerprint: string) =>
    reports.filter((r) => r.fingerprint === fingerprint).map((r) => r.id);

  const resolveGroup = async (fingerprint: string) => {
    const updates: Record<string, unknown> = {};
    for (const id of idsOf(fingerprint)) updates[`clientErrors/${id}/status`] = 'resolved';
    if (Object.keys(updates).length) await dbRef().update(updates);
  };

  const deleteGroup = async (fingerprint: string) => {
    const updates: Record<string, unknown> = {};
    for (const id of idsOf(fingerprint)) updates[`clientErrors/${id}`] = null;
    if (Object.keys(updates).length) await dbRef().update(updates);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  const cardStyle = {
    background: theme.background.paper,
    borderRadius: 12,
    padding: 14,
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...cardStyle, display: 'flex', gap: 16, alignItems: 'center' }}>
        {[
          { value: totals.groups, label: 'Fehlergruppen' },
          { value: totals.open, label: 'offen' },
          { value: totals.occurrences, label: 'Auftreten' },
          { value: totals.users, label: 'betroffene Nutzer' },
        ].map((stat) => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: totals.open > 0 ? '#ff4d6d' : '#06d6a0',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: theme.text.muted }}>{stat.label}</div>
          </div>
        ))}
        {totals.open === 0 && <CheckCircle style={{ fontSize: 26, color: '#06d6a0' }} />}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setOpenOnly((v) => !v)}
          style={{
            padding: '5px 12px',
            borderRadius: 999,
            cursor: 'pointer',
            border: `1px solid ${openOnly ? theme.primary : 'transparent'}`,
            background: theme.background.paper,
            color: openOnly ? theme.primary : theme.text.muted,
            fontSize: 12,
          }}
        >
          nur offene
        </button>
        {(Object.keys(KIND_LABEL) as ErrorKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind((cur) => (cur === k ? null : k))}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              border: `1px solid ${kind === k ? KIND_COLOR[k] : 'transparent'}`,
              background: theme.background.paper,
              color: kind === k ? KIND_COLOR[k] : theme.text.muted,
              fontSize: 12,
            }}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: theme.text.muted }}>
          Keine Fehler im gewählten Filter.
        </div>
      )}

      {groups.map((group) => {
        const latest = group.latest;
        const isOpen = expanded === group.fingerprint;
        return (
          <div key={group.fingerprint} style={cardStyle}>
            <div
              onClick={() => setExpanded(isOpen ? null : group.fingerprint)}
              style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <Warning style={{ fontSize: 20, color: KIND_COLOR[latest.kind] || '#ff4d6d' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: theme.text.primary, fontWeight: 600, fontSize: 14 }}>
                  {latest.name}: {latest.message}
                </div>
                <div style={{ color: theme.text.muted, fontSize: 12, marginTop: 4 }}>
                  {KIND_LABEL[latest.kind] || latest.kind} · {group.occurrences} Auftreten ·{' '}
                  {group.users} Nutzer · {latest.env?.route || '?'} · Build {latest.env?.build} ·{' '}
                  {relative(group.lastTs)}
                  {group.openCount === 0 && ' · erledigt'}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void copyTextToClipboard(groupToText(group));
                }}
                title="Details kopieren"
                style={{ background: 'none', border: 'none', color: theme.text.muted }}
              >
                <ContentCopy style={{ fontSize: 16 }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void resolveGroup(group.fingerprint);
                }}
                title="Als erledigt markieren"
                style={{ background: 'none', border: 'none', color: theme.text.muted }}
              >
                <CheckCircle style={{ fontSize: 16 }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteGroup(group.fingerprint);
                }}
                title="Gruppe löschen"
                style={{ background: 'none', border: 'none', color: theme.text.muted }}
              >
                <Delete style={{ fontSize: 16 }} />
              </button>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: theme.text.muted }}>
                  Erstmals {formatTime(group.firstTs)} · zuletzt {formatTime(group.lastTs)} ·
                  Fingerprint {group.fingerprint}
                  {latest.source ? ` · ${latest.source}` : ''}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  {Object.entries(latest.env || {}).map(([key, value]) => (
                    <div key={key} style={{ color: theme.text.muted }}>
                      <span style={{ opacity: 0.7 }}>{key}:</span>{' '}
                      <span style={{ color: theme.text.primary }}>{String(value)}</span>
                    </div>
                  ))}
                </div>

                {latest.breadcrumbs?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: theme.text.muted, marginBottom: 4 }}>
                      Verlauf vor dem Fehler
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {latest.breadcrumbs.map((crumb, i) => (
                        <div
                          key={`${crumb.t}-${i}`}
                          style={{ fontSize: 11, color: theme.text.muted, fontFamily: 'monospace' }}
                        >
                          +{crumb.t}ms [{crumb.type}] {crumb.label}
                          {crumb.detail ? ` (${crumb.detail})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {latest.stack && (
                  <pre
                    style={{
                      fontSize: 11,
                      color: theme.text.muted,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      overflowX: 'auto',
                    }}
                  >
                    {latest.stack}
                  </pre>
                )}

                {latest.componentStack && (
                  <pre
                    style={{
                      fontSize: 11,
                      color: theme.text.muted,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      overflowX: 'auto',
                    }}
                  >
                    {latest.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
