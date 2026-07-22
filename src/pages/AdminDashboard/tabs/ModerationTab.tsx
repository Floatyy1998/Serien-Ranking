import { Block, Delete, Done, Gavel, Translate } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { dbRef, serverIncrement } from '../../../services/db/ref';
import { backendFetch } from '../../../services/backendApi';
import { deleteDiscussionFeedEntries } from '../../../services/discussionFeedService';

interface ModerationFlag {
  id: string;
  kind: 'discussion' | 'reply' | 'ticket' | 'ticket_comment';
  path: string;
  text: string;
  title?: string;
  userId: string;
  username: string;
  reason?: string;
  flaggedAt?: number;
}

interface BanEntry {
  uid: string;
  discussionsUntil?: number;
  ticketsUntil?: number;
  username?: string;
  bannedAt?: number;
}

interface StrikeEntry {
  count?: number;
  username?: string;
  lastAt?: number;
}

const KIND_LABEL: Record<ModerationFlag['kind'], string> = {
  discussion: 'Diskussion',
  reply: 'Antwort',
  ticket: 'Ticket',
  ticket_comment: 'Ticket-Kommentar',
};

/** Scope, den ein Ban für diesen Inhaltstyp sperren soll. */
const banScopeFor = (kind: ModerationFlag['kind']): 'discussionsUntil' | 'ticketsUntil' =>
  kind === 'ticket' || kind === 'ticket_comment' ? 'ticketsUntil' : 'discussionsUntil';

// Sentinel für permanente Bans (01.01.2100)
const PERMANENT_UNTIL = 4102444800000;
const DAY_MS = 24 * 60 * 60 * 1000;

const BAN_DURATIONS: { label: string; ms: number | null }[] = [
  { label: '24 h', ms: DAY_MS },
  { label: '7 Tage', ms: 7 * DAY_MS },
  { label: '30 Tage', ms: 30 * DAY_MS },
  { label: 'Permanent', ms: null },
];

const formatUntil = (until?: number): string => {
  if (!until) return '';
  if (until >= PERMANENT_UNTIL) return 'permanent';
  if (until <= Date.now()) return 'abgelaufen';
  return `bis ${new Date(until).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`;
};

export function ModerationTab({ theme }: { theme: ThemeContextType['currentTheme'] }) {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [strikes, setStrikes] = useState<Record<string, StrikeEntry>>({});
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [translations, setTranslations] = useState<
    Record<string, { title?: string; text: string; visible: boolean }>
  >({});
  const [translating, setTranslating] = useState<string | null>(null);

  useEffect(() => {
    const flagsRef = dbRef('moderation/flags');
    const flagListener = flagsRef.on('value', (snap) => {
      const val = snap.val() as Record<string, Omit<ModerationFlag, 'id'>> | null;
      const list = val ? Object.entries(val).map(([id, f]) => ({ ...f, id })) : [];
      list.sort((a, b) => (b.flaggedAt || 0) - (a.flaggedAt || 0));
      setFlags(list);
    });
    const bansRef = dbRef('moderation/bans');
    const banListener = bansRef.on('value', (snap) => {
      const val = snap.val() as Record<string, Omit<BanEntry, 'uid'>> | null;
      setBans(val ? Object.entries(val).map(([uid, b]) => ({ ...b, uid })) : []);
    });
    const strikesRef = dbRef('moderation/strikes');
    const strikeListener = strikesRef.on('value', (snap) => {
      setStrikes((snap.val() as Record<string, StrikeEntry> | null) || {});
    });
    return () => {
      flagsRef.off('value', flagListener);
      bansRef.off('value', banListener);
      strikesRef.off('value', strikeListener);
    };
  }, []);

  const dismissFlag = useCallback(async (flag: ModerationFlag) => {
    await dbRef(`moderation/flags/${flag.id}`)
      .remove()
      .catch(() => {});
    setConfirmAction(null);
  }, []);

  const deleteContent = useCallback(
    async (flag: ModerationFlag) => {
      try {
        await dbRef(flag.path).remove();
        if (flag.kind === 'discussion') {
          const discussionId = flag.path.split('/').pop();
          if (discussionId) {
            await dbRef(`discussionReplies/${discussionId}`)
              .remove()
              .catch(() => {});
            deleteDiscussionFeedEntries(discussionId);
          }
        }
        // Strike-Zähler: wie oft musste bei diesem User schon gelöscht werden?
        await dbRef(`moderation/strikes/${flag.userId}`).update({
          count: serverIncrement(1),
          username: flag.username,
          lastAt: Date.now(),
        });
      } catch (err) {
        console.error('[moderation] delete failed', err);
      }
      await dismissFlag(flag);
    },
    [dismissFlag]
  );

  const banUser = useCallback(
    async (flag: ModerationFlag, durationMs: number | null) => {
      const scope = banScopeFor(flag.kind);
      const until = durationMs === null ? PERMANENT_UNTIL : Date.now() + durationMs;
      try {
        await dbRef(`moderation/bans/${flag.userId}`).update({
          [scope]: until,
          username: flag.username,
          bannedAt: Date.now(),
        });
      } catch (err) {
        console.error('[moderation] ban failed', err);
      }
      await deleteContent(flag);
    },
    [deleteContent]
  );

  const unbanUser = useCallback(async (uid: string) => {
    await dbRef(`moderation/bans/${uid}`)
      .remove()
      .catch(() => {});
  }, []);

  const translateFlag = useCallback(
    async (flag: ModerationFlag) => {
      const existing = translations[flag.id];
      if (existing) {
        setTranslations((prev) => ({
          ...prev,
          [flag.id]: { ...existing, visible: !existing.visible },
        }));
        return;
      }
      setTranslating(flag.id);
      try {
        const texts = flag.title ? [flag.title, flag.text] : [flag.text];
        const res = await backendFetch('/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, targetLang: 'de' }),
        });
        const data = (await res.json()) as { translations?: string[] };
        if (res.ok && Array.isArray(data.translations)) {
          setTranslations((prev) => ({
            ...prev,
            [flag.id]: flag.title
              ? { title: data.translations![0], text: data.translations![1], visible: true }
              : { text: data.translations![0], visible: true },
          }));
        }
      } catch (err) {
        console.error('[moderation] translate failed', err);
      }
      setTranslating(null);
    },
    [translations]
  );

  const card: React.CSSProperties = {
    background: theme.background.surface,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  };

  const actionBtn = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${color}50`,
    background: `${color}15`,
    color,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div>
      <h3 style={{ color: theme.text.primary, fontSize: 16, margin: '0 0 12px' }}>
        <Gavel style={{ fontSize: 18, verticalAlign: 'text-bottom' }} /> KI-Moderation — offene
        Fälle ({flags.length})
      </h3>

      {flags.length === 0 && (
        <div style={{ ...card, color: theme.text.muted, fontSize: 14, textAlign: 'center' }}>
          Keine offenen Moderations-Fälle. 🎉
        </div>
      )}

      {flags.map((flag) => {
        const strikeCount = strikes[flag.userId]?.count || 0;
        const translation = translations[flag.id];
        const showTranslated = !!translation?.visible;
        return (
          <div key={flag.id} style={card}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: 12,
              }}
            >
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: `${theme.status.warning}20`,
                  color: theme.status.warning,
                  fontWeight: 700,
                }}
              >
                {KIND_LABEL[flag.kind] || flag.kind}
              </span>
              <span style={{ color: theme.text.primary, fontWeight: 700 }}>{flag.username}</span>
              {strikeCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `${theme.status.error}20`,
                    color: theme.status.error,
                    fontWeight: 700,
                  }}
                >
                  🗑️ schon {strikeCount}× gelöscht
                </span>
              )}
              <span style={{ color: theme.text.muted }}>
                {flag.flaggedAt ? new Date(flag.flaggedAt).toLocaleString('de-DE') : ''}
              </span>
            </div>

            {(showTranslated ? translation?.title : flag.title) && (
              <div
                style={{ color: theme.text.primary, fontWeight: 600, fontSize: 14, marginTop: 10 }}
              >
                {showTranslated ? translation?.title : flag.title}
              </div>
            )}
            <div
              style={{
                color: theme.text.secondary,
                fontSize: 13,
                marginTop: 6,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {showTranslated ? translation?.text : flag.text}
            </div>
            {flag.reason && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: `${theme.status.error}10`,
                  borderLeft: `3px solid ${theme.status.error}`,
                  color: theme.text.secondary,
                  fontSize: 12,
                }}
              >
                🤖 {flag.reason}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {confirmAction === `ban-${flag.id}` ? (
                <>
                  <span style={{ color: theme.status.error, fontSize: 12, alignSelf: 'center' }}>
                    {flag.username} bannen (
                    {banScopeFor(flag.kind) === 'ticketsUntil' ? 'Tickets' : 'Diskussionen'}) +
                    Inhalt löschen:
                  </span>
                  {BAN_DURATIONS.map((d) => (
                    <button
                      key={d.label}
                      onClick={() => banUser(flag, d.ms)}
                      style={actionBtn(theme.status.error)}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirmAction(null)}
                    style={actionBtn(theme.text.muted)}
                  >
                    Abbrechen
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => dismissFlag(flag)} style={actionBtn(theme.status.success)}>
                    <Done style={{ fontSize: 14 }} /> Ist okay
                  </button>
                  <button
                    onClick={() => deleteContent(flag)}
                    style={actionBtn(theme.status.warning)}
                  >
                    <Delete style={{ fontSize: 14 }} /> Inhalt löschen
                  </button>
                  <button
                    onClick={() => setConfirmAction(`ban-${flag.id}`)}
                    style={actionBtn(theme.status.error)}
                  >
                    <Block style={{ fontSize: 14 }} /> Bannen
                  </button>
                  <button
                    onClick={() => translateFlag(flag)}
                    disabled={translating === flag.id}
                    style={actionBtn(theme.status.info.main)}
                  >
                    <Translate style={{ fontSize: 14 }} />
                    {translating === flag.id
                      ? 'Übersetze…'
                      : showTranslated
                        ? 'Original'
                        : 'Übersetzen'}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      <h3 style={{ color: theme.text.primary, fontSize: 16, margin: '24px 0 12px' }}>
        Gebannte User ({bans.length})
      </h3>
      {bans.length === 0 && (
        <div style={{ ...card, color: theme.text.muted, fontSize: 14, textAlign: 'center' }}>
          Niemand gebannt.
        </div>
      )}
      {bans.map((ban) => (
        <div
          key={ban.uid}
          style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
        >
          <span style={{ color: theme.text.primary, fontWeight: 700, fontSize: 14 }}>
            {ban.username || ban.uid}
          </span>
          <span style={{ color: theme.text.muted, fontSize: 12 }}>
            {[
              ban.discussionsUntil && `Diskussionen ${formatUntil(ban.discussionsUntil)}`,
              ban.ticketsUntil && `Tickets ${formatUntil(ban.ticketsUntil)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <button
            onClick={() => unbanUser(ban.uid)}
            style={{ ...actionBtn(theme.status.success), marginLeft: 'auto' }}
          >
            Entbannen
          </button>
        </div>
      ))}
    </div>
  );
}
