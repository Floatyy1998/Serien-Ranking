import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { CheckCircle, ContentCopy, Delete } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { buildEnvRows, formatDuration } from '../../../lib/errorReport/envRows';
import { groupReports, type ErrorGroup } from '../../../lib/errorReport/group';
import type { BreadcrumbType, ErrorKind, ErrorReport } from '../../../types/ErrorReport';

const KIND_LABEL: Record<ErrorKind, string> = {
  render: 'Render',
  error: 'Laufzeit',
  promise: 'Promise',
  resource: 'Ressource',
};

const KIND_TONE: Record<ErrorKind, string> = {
  render: '#ff5c7a',
  error: '#f2a648',
  promise: '#c08cff',
  resource: '#7aa2ff',
};

const CRUMB_LABEL: Record<BreadcrumbType, string> = {
  route: 'Route',
  click: 'Klick',
  fetch: 'Anfrage',
  console: 'Konsole',
  visibility: 'Sichtbarkeit',
  error: 'Fehler',
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
  const env = buildEnvRows(r.env)
    .map((row) => `  ${row.label}: ${row.value}`)
    .join('\n');
  const crumbs = (r.breadcrumbs || [])
    .map(
      (b) =>
        `  ${formatDuration(b.t)} [${CRUMB_LABEL[b.type] || b.type}] ${b.label}` +
        (b.detail ? ` (${b.detail})` : '')
    )
    .join('\n');
  return [
    `${r.name}: ${r.message}`,
    `Fingerprint ${group.fingerprint} · ${group.occurrences} Auftreten · ${group.users} Nutzer`,
    `Erstmals ${formatTime(group.firstTs)} · zuletzt ${formatTime(group.lastTs)}`,
    r.source ? `Quelle: ${r.source}` : '',
    '',
    `Umgebung:\n${env}`,
    '',
    `Verlauf:\n${crumbs}`,
    '',
    `Stack:\n${r.stack || '(keiner)'}`,
    r.componentStack ? `\nComponent-Stack:\n${r.componentStack}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function ClientErrorsTab() {
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
    const all = groupReports(reports);
    return {
      groups: all.length,
      open: all.filter((g) => g.openCount > 0).length,
      occurrences: reports.reduce((sum, r) => sum + 1 + (r.suppressed || 0), 0),
      users: new Set(reports.map((r) => r.uid).filter(Boolean)).size,
      resolved: all.filter((g) => g.openCount === 0).length,
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
    return <div className="adm-empty">Laden...</div>;
  }

  const stats = [
    { value: totals.groups, label: 'Fehlergruppen', tone: 'adm-tone-info' },
    { value: totals.open, label: 'offen', tone: totals.open ? 'adm-tone-bad' : 'adm-tone-ok' },
    { value: totals.occurrences, label: 'Auftreten', tone: '' },
    { value: totals.users, label: 'betroffene Nutzer', tone: '' },
    { value: totals.resolved, label: 'erledigt', tone: 'adm-tone-ok' },
  ];

  return (
    <div className="adm-stack">
      <div className="adm-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`adm-stat ${stat.tone}`}>
            <div className="adm-stat__value">{stat.value}</div>
            <div className="adm-stat__label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="adm-chips">
        <button
          className={`adm-chip ${openOnly ? 'adm-chip--on' : ''}`}
          onClick={() => setOpenOnly((v) => !v)}
        >
          nur offene
        </button>
        <span className="adm-chips__sep" />
        {(Object.keys(KIND_LABEL) as ErrorKind[]).map((k) => (
          <button
            key={k}
            className={`adm-chip ${kind === k ? 'adm-chip--on' : ''}`}
            style={{ '--adm-tone': KIND_TONE[k] } as CSSProperties}
            onClick={() => setKind((cur) => (cur === k ? null : k))}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty__t">Keine Fehler im gewählten Filter</div>
            <div className="adm-empty__s">
              Berichte erscheinen automatisch, sobald bei einem Nutzer etwas schiefgeht.
            </div>
          </div>
        </div>
      )}

      {groups.map((group) => {
        const latest = group.latest;
        const isOpen = expanded === group.fingerprint;
        const envRows = buildEnvRows(latest.env);
        return (
          <div
            key={group.fingerprint}
            className="adm-row"
            style={{ '--adm-tone': KIND_TONE[latest.kind] || '#ff5c7a' } as CSSProperties}
          >
            <div
              className="adm-row__head"
              onClick={() => setExpanded(isOpen ? null : group.fingerprint)}
            >
              <div className="adm-row__bar" />
              <div className="adm-tag">{KIND_LABEL[latest.kind] || latest.kind}</div>
              <div style={{ minWidth: 0 }}>
                <div className="adm-row__title">
                  {latest.name}: {latest.message}
                </div>
                <div className="adm-row__meta">
                  <span>
                    <b>{group.occurrences}</b> Auftreten
                  </span>
                  <span>
                    <b>{group.users}</b> Nutzer
                  </span>
                  <span>{latest.env?.route || '?'}</span>
                  <span>Build {latest.env?.build}</span>
                  <span>{relative(group.lastTs)}</span>
                  {group.openCount === 0 && <span>erledigt</span>}
                </div>
              </div>
              <div className="adm-row__acts">
                <button
                  className="adm-icon-btn"
                  title="Details kopieren"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyTextToClipboard(groupToText(group));
                  }}
                >
                  <ContentCopy style={{ fontSize: 16 }} />
                </button>
                <button
                  className="adm-icon-btn"
                  title="Als erledigt markieren"
                  onClick={(e) => {
                    e.stopPropagation();
                    void resolveGroup(group.fingerprint);
                  }}
                >
                  <CheckCircle style={{ fontSize: 16 }} />
                </button>
                <button
                  className="adm-icon-btn"
                  title="Gruppe löschen"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteGroup(group.fingerprint);
                  }}
                >
                  <Delete style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="adm-row__body">
                <div className="adm-detail">
                  <div>
                    <div className="adm-sec">
                      <h4 className="adm-sec__title">Umgebung</h4>
                      <div className="adm-sec__rule" />
                    </div>
                    <div className="adm-kv">
                      {envRows.map((row) => (
                        <div
                          key={row.label}
                          className={`adm-kv__item ${row.wide ? 'adm-kv__item--wide' : ''}`}
                        >
                          <div className="adm-kv__k">{row.label}</div>
                          <div className="adm-kv__v">{row.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--adm-faint)' }}>
                      Erstmals {formatTime(group.firstTs)} · zuletzt {formatTime(group.lastTs)} ·
                      Fingerprint {group.fingerprint}
                      {latest.source ? ` · ${latest.source}` : ''}
                    </div>
                  </div>

                  <div>
                    <div className="adm-sec">
                      <h4 className="adm-sec__title">Verlauf vor dem Fehler</h4>
                      <div className="adm-sec__rule" />
                    </div>
                    {latest.breadcrumbs?.length ? (
                      <div className="adm-time adm-panel">
                        {latest.breadcrumbs.map((crumb, i) => (
                          <div
                            key={`${crumb.t}-${i}`}
                            className="adm-time__i"
                            style={
                              crumb.type === 'error' || crumb.detail
                                ? ({ '--adm-tone': '#ff5c7a' } as CSSProperties)
                                : undefined
                            }
                          >
                            <div className="adm-time__t">{formatDuration(crumb.t)}</div>
                            <div className="adm-time__dot" />
                            <div className="adm-time__l">
                              <span>{CRUMB_LABEL[crumb.type] || crumb.type}</span> {crumb.label}
                              {crumb.detail ? <span> · {crumb.detail}</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="adm-panel"
                        style={{ color: 'var(--adm-faint)', fontSize: 12 }}
                      >
                        Kein Verlauf aufgezeichnet.
                      </div>
                    )}
                  </div>

                  {(latest.stack || latest.componentStack) && (
                    <div className="adm-detail__full">
                      <div className="adm-sec">
                        <h4 className="adm-sec__title">Stack</h4>
                        <div className="adm-sec__rule" />
                      </div>
                      {latest.stack && <pre className="adm-code">{latest.stack}</pre>}
                      {latest.componentStack && (
                        <pre className="adm-code" style={{ marginTop: 8 }}>
                          {latest.componentStack}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
