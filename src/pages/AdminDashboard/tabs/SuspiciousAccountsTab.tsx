import { useCallback, useEffect, useMemo, useState } from 'react';
import { AutoAwesome, PersonSearch } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';

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

interface Payload {
  _meta?: { generatedAt: number; scanned: number; flagged: number };
  items?: Record<string, SuspiciousAccount>;
}

interface AiUsagePayload {
  month?: string;
  generatedAt?: number;
  items?: Record<string, { used: number; email: string }>;
}

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
      const active = isActive(aiBans[uid] || 0);
      try {
        if (active) {
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

  const aiRows = useMemo(
    () =>
      Object.entries(aiUsage.items || {})
        .map(([uid, entry]) => ({ uid, ...entry }))
        .sort((a, b) => b.used - a.used),
    [aiUsage]
  );

  const rows = useMemo(() => {
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

  if (loading) return <div className="adm-empty">Lade Verdachtsliste…</div>;
  if (error) return <div className="adm-empty">Fehler: {error}</div>;

  const meta = payload?._meta;

  return (
    <div className="adm-stack">
      <div className="adm-card">
        <div className="adm-card__head">
          <div className="adm-card__title">
            <PersonSearch style={{ fontSize: 18 }} /> Verdächtige Konten
          </div>
          <div className="adm-card__meta">
            Stand: {meta ? formatTime(meta.generatedAt) : 'unbekannt'}
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
          <div className="adm-stat">
            <div className="adm-stat__value">{rows.length}</div>
            <div className="adm-stat__label">Angezeigt</div>
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
          <div className="adm-card__meta">
            {aiRows.length} aktive Konten · Sperre gilt sofort für alle /ai-Endpunkte
          </div>
        </div>
        {aiRows.length === 0 ? (
          <div className="adm-empty">Diesen Monat hat noch niemand die KI genutzt.</div>
        ) : (
          <div className="adm-table__wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Konto</th>
                  <th>Anfragen</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {aiRows.map((row) => {
                  const until = aiBans[row.uid] || 0;
                  const banned = isActive(until);
                  return (
                    <tr key={row.uid}>
                      <td>{row.email || row.uid}</td>
                      <td>{row.used}</td>
                      <td>
                        {banned ? (
                          <span className="adm-tag" style={{ ['--adm-tone' as string]: '#ff5c7a' }}>
                            gesperrt bis {new Date(until).toLocaleDateString('de-DE')}
                          </span>
                        ) : (
                          <span className="adm-pill">frei</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="adm-chip"
                          disabled={busyUid === row.uid}
                          onClick={() => toggleAiBan(row.uid, row.email)}
                        >
                          {banned ? 'Entsperren' : `${AI_BAN_DAYS} Tage sperren`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="adm-empty">Keine Treffer.</div>
      ) : (
        rows.map((row) => (
          <div key={row.uid} className="adm-row">
            <div
              className="adm-row__head"
              style={{ ['--adm-tone' as string]: row.score >= 4 ? '#ff5c7a' : '#f2a648' }}
            >
              <div className="adm-row__bar" />
              <div className="adm-tag">Score {row.score}</div>
              <div style={{ minWidth: 0 }}>
                <div className="adm-row__title">{row.email || '(ohne E-Mail)'}</div>
                <div className="adm-row__meta">{row.uid}</div>
              </div>
            </div>
            <div className="adm-row__body">
              <div className="adm-kv">
                <div className="adm-kv__item">
                  <div className="adm-kv__k">Registriert</div>
                  <div className="adm-kv__v">
                    {formatTime(row.created)} ({days(row.created)} d)
                  </div>
                </div>
                <div className="adm-kv__item">
                  <div className="adm-kv__k">Letzter Login</div>
                  <div className="adm-kv__v">{formatTime(row.lastSignIn)}</div>
                </div>
                <div className="adm-kv__item">
                  <div className="adm-kv__k">Anmeldung</div>
                  <div className="adm-kv__v">
                    {row.providers} · {row.verified ? 'bestätigt' : 'unbestätigt'}
                  </div>
                </div>
                <div className="adm-kv__item">
                  <div className="adm-kv__k">Inhalte</div>
                  <div className="adm-kv__v">
                    {row.series} Serien · {row.movies} Filme · {row.manga} Manga · {row.friends}{' '}
                    Freunde
                  </div>
                </div>
              </div>
              <div className="adm-chips">
                {row.reasons.split(',').map((reason) => (
                  <span
                    key={reason}
                    className="adm-tag"
                    style={{ ['--adm-tone' as string]: REASON_TONE[reason] }}
                  >
                    {REASON_LABEL[reason] || reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
