import { useCallback, useEffect, useMemo, useState } from 'react';
import { AutoAwesome, PersonSearch } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { DataTable } from '../components/DataTable';

const AI_BAN_DAYS = 30;

interface SuspiciousAccount {
  email: string;
  created: number;
  lastSignIn: number;
  verified: boolean;
  providers: string;
  series: number;
  movies: number;
  manga: number;
  friends: number;
  score: number;
  reasons: string;
}

type Row = SuspiciousAccount & { uid: string };

interface Payload {
  _meta?: { generatedAt: number; scanned: number; flagged: number };
  items?: Record<string, SuspiciousAccount>;
}

interface AiUsagePayload {
  month?: string;
  generatedAt?: number;
  items?: Record<string, { used: number; email: string }>;
}

type AiRow = { uid: string; used: number; email: string };

const REASON_LABEL: Record<string, string> = {
  leer: 'Keine Inhalte',
  unbestaetigt: 'E-Mail unbestätigt',
  'nie-wieder': 'Nie wiedergekommen',
  'ohne-freunde': 'Keine Freunde',
  'registrier-welle': 'Registrier-Welle',
};

const REASON_TONE: Record<string, string> = {
  leer: '#ff5c7a',
  unbestaetigt: '#f2a648',
  'nie-wieder': '#c08cff',
  'ohne-freunde': '#7aa2ff',
  'registrier-welle': '#ff8a5c',
};

const days = (ms: number): number => (ms ? Math.floor((Date.now() - ms) / 86400000) : 0);
const isActive = (until: number): boolean => until > Date.now();
const shortDate = (ts: number): string =>
  ts
    ? new Date(ts).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    : '—';
const formatTime = (ts: number): string => (ts ? new Date(ts).toLocaleString('de-DE') : '—');

export const SuspiciousAccountsTab = () => {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsagePayload>({});
  const [aiBans, setAiBans] = useState<Record<string, number>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    dbRef('adminPrivate/suspiciousAccounts')
      .once('value')
      .then((snap) => setPayload((snap.val() as Payload) || {}))
      .catch((e) => setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen'))
      .finally(() => setLoading(false));

    dbRef('adminPrivate/aiUsage')
      .once('value')
      .then((snap) => setAiUsage((snap.val() as AiUsagePayload) || {}))
      .catch(() => setAiUsage({}));

    const bansRef = dbRef('moderation/bans');
    const listener = bansRef.on('value', (snap) => {
      const val = (snap.val() as Record<string, { aiUntil?: number }> | null) || {};
      const map: Record<string, number> = {};
      for (const [uid, entry] of Object.entries(val)) {
        if (entry?.aiUntil) map[uid] = entry.aiUntil;
      }
      setAiBans(map);
    });
    return () => bansRef.off('value', listener);
  }, []);

  const toggleAiBan = useCallback(
    async (uid: string, email: string) => {
      setBusyUid(uid);
      try {
        if (isActive(aiBans[uid] || 0)) {
          await dbRef(`moderation/bans/${uid}/aiUntil`).remove();
        } else {
          await dbRef(`moderation/bans/${uid}`).update({
            aiUntil: Date.now() + AI_BAN_DAYS * 86400000,
            username: email,
            bannedAt: Date.now(),
          });
        }
      } finally {
        setBusyUid(null);
      }
    },
    [aiBans]
  );

  const aiRows = useMemo<AiRow[]>(
    () =>
      Object.entries(aiUsage.items || {})
        .map(([uid, entry]) => ({ uid, ...entry }))
        .sort((a, b) => b.used - a.used),
    [aiUsage]
  );

  const rows = useMemo<Row[]>(() => {
    const items = payload?.items || {};
    return Object.entries(items)
      .map(([uid, account]) => ({ uid, ...account }))
      .filter((r) => !reasonFilter || r.reasons.split(',').includes(reasonFilter))
      .sort((a, b) => b.score - a.score || a.created - b.created);
  }, [payload, reasonFilter]);

  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const account of Object.values(payload?.items || {})) {
      for (const reason of account.reasons.split(',')) {
        counts[reason] = (counts[reason] || 0) + 1;
      }
    }
    return counts;
  }, [payload]);

  const columns = useMemo(
    () => [
      {
        key: 'account',
        label: 'Konto',
        width: '2.4fr',
        sortValue: (r: Row) => r.email,
        render: (r: Row) => (
          <div style={{ minWidth: 0 }}>
            <div className="adm-row__title">{r.email || '(ohne E-Mail)'}</div>
            <div className="adm-row__meta">{r.uid}</div>
          </div>
        ),
      },
      {
        key: 'score',
        label: 'Score',
        width: '0.5fr',
        sortValue: (r: Row) => r.score,
        render: (r: Row) => (
          <span
            className="adm-tag"
            style={{ ['--adm-tone' as string]: r.score >= 4 ? '#ff5c7a' : '#f2a648' }}
          >
            {r.score}
          </span>
        ),
      },
      {
        key: 'created',
        label: 'Registriert',
        width: '0.9fr',
        sortValue: (r: Row) => r.created,
        render: (r: Row) => (
          <>
            {shortDate(r.created)} <span className="adm-row__meta">({days(r.created)} d)</span>
          </>
        ),
      },
      {
        key: 'lastSignIn',
        label: 'Letzter Login',
        width: '0.8fr',
        sortValue: (r: Row) => r.lastSignIn,
        render: (r: Row) => shortDate(r.lastSignIn),
      },
      {
        key: 'auth',
        label: 'Anmeldung',
        width: '1fr',
        sortValue: (r: Row) => r.providers,
        render: (r: Row) => (
          <>
            {r.providers.replace('.com', '')}
            {!r.verified && (
              <span className="adm-tag" style={{ ['--adm-tone' as string]: '#f2a648' }}>
                unbestätigt
              </span>
            )}
          </>
        ),
      },
      {
        key: 'content',
        label: 'S / F / M / Fr',
        width: '0.8fr',
        sortValue: (r: Row) => r.series + r.movies + r.manga,
        render: (r: Row) => `${r.series} / ${r.movies} / ${r.manga} / ${r.friends}`,
      },
      {
        key: 'reasons',
        label: 'Gründe',
        width: '1.6fr',
        render: (r: Row) => (
          <div className="adm-chips">
            {r.reasons.split(',').map((reason) => (
              <span
                key={reason}
                className="adm-tag"
                style={{ ['--adm-tone' as string]: REASON_TONE[reason] }}
              >
                {REASON_LABEL[reason] || reason}
              </span>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  const aiColumns = useMemo(
    () => [
      {
        key: 'account',
        label: 'Konto',
        width: '2fr',
        sortValue: (r: AiRow) => r.email,
        render: (r: AiRow) => r.email || r.uid,
      },
      {
        key: 'used',
        label: 'Anfragen',
        width: '0.6fr',
        sortValue: (r: AiRow) => r.used,
        render: (r: AiRow) => r.used,
      },
      {
        key: 'status',
        label: 'Status',
        width: '1fr',
        render: (r: AiRow) =>
          isActive(aiBans[r.uid] || 0) ? (
            <span className="adm-tag" style={{ ['--adm-tone' as string]: '#ff5c7a' }}>
              gesperrt bis {shortDate(aiBans[r.uid])}
            </span>
          ) : (
            <span className="adm-pill">frei</span>
          ),
      },
      {
        key: 'action',
        label: '',
        width: '0.9fr',
        render: (r: AiRow) => (
          <button
            type="button"
            className="adm-chip"
            disabled={busyUid === r.uid}
            onClick={() => toggleAiBan(r.uid, r.email)}
          >
            {isActive(aiBans[r.uid] || 0) ? 'Entsperren' : `${AI_BAN_DAYS} Tage sperren`}
          </button>
        ),
      },
    ],
    [aiBans, busyUid, toggleAiBan]
  );

  if (loading) return <div className="adm-empty">Lade Verdachtsliste…</div>;
  if (error) return <div className="adm-empty">Fehler: {error}</div>;

  const meta = payload?._meta;

  return (
    <div className="adm-stack">
      <div className="adm-grid adm-grid--wide">
        <div className="adm-card">
          <div className="adm-card__head">
            <div className="adm-card__title">
              <PersonSearch style={{ fontSize: 18 }} /> Verdächtige Konten
            </div>
            <div className="adm-card__meta">
              {meta ? formatTime(meta.generatedAt) : 'unbekannt'}
            </div>
          </div>
          <div className="adm-stats">
            <div className="adm-stat">
              <div className="adm-stat__value">{meta?.scanned ?? 0}</div>
              <div className="adm-stat__label">Geprüft</div>
            </div>
            <div className="adm-stat adm-tone-warn">
              <div className="adm-stat__value">{meta?.flagged ?? 0}</div>
              <div className="adm-stat__label">Markiert</div>
            </div>
          </div>
          <div className="adm-chips">
            <button
              type="button"
              className={`adm-chip${reasonFilter === null ? ' adm-chip--on' : ''}`}
              onClick={() => setReasonFilter(null)}
            >
              Alle
            </button>
            {Object.entries(reasonCounts).map(([reason, count]) => (
              <button
                key={reason}
                type="button"
                className={`adm-chip${reasonFilter === reason ? ' adm-chip--on' : ''}`}
                style={{ ['--adm-tone' as string]: REASON_TONE[reason] }}
                onClick={() => setReasonFilter(reasonFilter === reason ? null : reason)}
              >
                {REASON_LABEL[reason] || reason}
                <span className="adm-chip__count">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <div className="adm-card__title">
              <AutoAwesome style={{ fontSize: 18 }} /> KI-Verbrauch {aiUsage.month || ''}
            </div>
            <div className="adm-card__meta">{aiRows.length} aktive Konten</div>
          </div>
          {aiRows.length === 0 ? (
            <div className="adm-empty">Diesen Monat hat noch niemand die KI genutzt.</div>
          ) : (
            <DataTable data={aiRows} columns={aiColumns} maxRows={10} />
          )}
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card__head">
          <div className="adm-card__title">Konten ({rows.length})</div>
          <div className="adm-card__meta">Sortierbar, Spaltenkopf anklicken</div>
        </div>
        {rows.length === 0 ? (
          <div className="adm-empty">Keine Treffer.</div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            searchKeys={(r) => `${r.email} ${r.uid}`}
            maxRows={50}
          />
        )}
      </div>
    </div>
  );
};
