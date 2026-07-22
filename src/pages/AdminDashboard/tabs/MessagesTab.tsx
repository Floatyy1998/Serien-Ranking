import { Delete, NotificationsActive, Send } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { backendFetch } from '../../../services/backendApi';
import { dbRef } from '../../../services/db/ref';

interface UserMessage {
  text: string;
  displayName: string;
  createdAt: string;
}

interface UserProfile {
  displayName: string;
  username: string;
  /** Vom Client gespiegelte App-Sprache (users/$uid/language), '' = unbekannt. */
  language: string;
}

type LangFilter = 'all' | 'de' | 'en' | 'unknown';

interface MessagesTabProps {
  theme: {
    primary: string;
    text: { secondary: string; muted: string };
    background: { surface: string; default: string };
    status: { success: string; error: string };
  };
}

export function MessagesTab({ theme }: MessagesTabProps) {
  const [messages, setMessages] = useState<Record<string, UserMessage>>({});
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [selectedUid, setSelectedUid] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');

  // In-App-Notification (users/$uid/notifications) — läuft über den
  // admin-gesicherten Backend-Endpoint /admin/notify (Admin-SDK-Write).
  const [notifSearch, setNotifSearch] = useState('');
  const [notifLangFilter, setNotifLangFilter] = useState<LangFilter>('all');
  const [notifListOpen, setNotifListOpen] = useState(false);
  const [notifTargets, setNotifTargets] = useState<Record<string, string>>({});
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPush, setNotifPush] = useState(false);
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState('');

  const loadMessages = useCallback(() => {
    dbRef('admin/userMessages')
      .once('value')
      .then((snap) => setMessages(snap.val() || {}));
  }, []);

  useEffect(() => {
    loadMessages();
    dbRef('users')
      .once('value')
      .then((snap) => {
        const val = snap.val() || {};
        const profiles: Record<string, UserProfile> = {};
        Object.keys(val).forEach((uid) => {
          profiles[uid] = {
            displayName: val[uid]?.displayName || '',
            username: val[uid]?.username || '',
            language:
              val[uid]?.language === 'de' || val[uid]?.language === 'en' ? val[uid].language : '',
          };
        });
        setUsers(profiles);
      });
  }, [loadMessages]);

  const handleSend = async () => {
    if (!selectedUid || !text.trim()) return;
    const name = users[selectedUid]?.displayName || users[selectedUid]?.username || selectedUid;
    await dbRef(`admin/userMessages/${selectedUid}`).set({
      text: text.trim(),
      displayName: name,
      createdAt: new Date().toISOString(),
    });
    setText('');
    setSelectedUid('');
    loadMessages();
  };

  const handleDelete = async (uid: string) => {
    await dbRef(`admin/userMessages/${uid}`).remove();
    loadMessages();
  };

  const filteredUsers = Object.entries(users).filter(([uid, u]) => {
    const q = search.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      uid.toLowerCase().includes(q)
    );
  });

  const matchesLangFilter = (u: UserProfile): boolean =>
    notifLangFilter === 'all' ||
    (notifLangFilter === 'unknown' ? !u.language : u.language === notifLangFilter);

  const notifFilteredUsers = Object.entries(users)
    .filter(([uid, u]) => {
      if (!matchesLangFilter(u)) return false;
      const q = notifSearch.toLowerCase();
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q)
      );
    })
    .sort(([, a], [, b]) =>
      (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '', 'de')
    );

  const langCounts = Object.values(users).reduce(
    (acc, u) => {
      if (u.language === 'de') acc.de++;
      else if (u.language === 'en') acc.en++;
      else acc.unknown++;
      return acc;
    },
    { de: 0, en: 0, unknown: 0 }
  );

  const toggleNotifTarget = (uid: string, name: string) => {
    setNotifTargets((prev) => {
      const next = { ...prev };
      if (next[uid]) delete next[uid];
      else next[uid] = name;
      return next;
    });
  };

  // Wählt alle User des aktiven Sprach-Filters (Suche wird ignoriert)
  const selectAllNotifTargets = () => {
    const all: Record<string, string> = {};
    Object.entries(users).forEach(([uid, u]) => {
      if (matchesLangFilter(u)) all[uid] = u.displayName || u.username || uid;
    });
    setNotifTargets(all);
  };

  const handleSendNotification = async () => {
    const uids = Object.keys(notifTargets);
    if (!uids.length || !notifTitle.trim() || !notifMessage.trim() || notifSending) return;
    setNotifSending(true);
    setNotifResult('');
    try {
      // Backend deckelt bei 200 Empfängern pro Aufruf — in Blöcken senden
      let sent = 0;
      const failed: { uid: string; error?: string }[] = [];
      for (let i = 0; i < uids.length; i += 200) {
        const res = await backendFetch('/admin/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uids: uids.slice(i, i + 200),
            title: notifTitle.trim(),
            message: notifMessage.trim(),
            withPush: notifPush,
          }),
        });
        const data = (await res.json()) as {
          sent?: number;
          results?: { uid: string; ok: boolean; error?: string }[];
          error?: string;
        };
        if (!res.ok) {
          setNotifResult(`Fehler: ${data.error || res.status}`);
          setNotifSending(false);
          return;
        }
        sent += data.sent || 0;
        failed.push(...(data.results || []).filter((r) => !r.ok));
      }
      setNotifResult(
        failed.length
          ? `${sent} gesendet, ${failed.length} fehlgeschlagen: ${failed
              .map((f) => `${f.uid.slice(0, 8)}… (${f.error})`)
              .join(', ')}`
          : `${sent} Notification(s) gesendet ✓`
      );
      if (!failed.length) {
        setNotifTargets({});
        setNotifTitle('');
        setNotifMessage('');
        setNotifPush(false);
      }
    } catch (e) {
      setNotifResult(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setNotifSending(false);
    }
  };

  const notifReady =
    Object.keys(notifTargets).length > 0 &&
    notifTitle.trim().length > 0 &&
    notifMessage.trim().length > 0 &&
    !notifSending;

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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* In-App-Notification (+ optional Push) über /admin/notify */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.background.surface,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '14px',
            color: theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <NotificationsActive style={{ fontSize: '16px', color: theme.primary }} />
          In-App-Notification senden
        </h3>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'all', label: `Alle (${Object.keys(users).length})` },
              { id: 'de', label: `🇩🇪 Deutsch (${langCounts.de})` },
              { id: 'en', label: `🇬🇧 Englisch (${langCounts.en})` },
              { id: 'unknown', label: `? Unbekannt (${langCounts.unknown})` },
            ] as { id: LangFilter; label: string }[]
          ).map((f) => {
            const active = notifLangFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setNotifLangFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? theme.primary : 'rgba(255,255,255,0.08)'}`,
                  background: active ? `${theme.primary}20` : 'transparent',
                  color: active ? theme.primary : theme.text.muted,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={notifSearch}
            onChange={(e) => setNotifSearch(e.target.value)}
            onFocus={() => setNotifListOpen(true)}
            placeholder="Empfänger suchen (Name oder UID)..."
            style={{ ...inputStyle, flex: 1, width: 'auto', minWidth: '180px' }}
          />
          <button
            onClick={() => setNotifListOpen((v) => !v)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: theme.background.default,
              color: theme.text.secondary,
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {notifListOpen ? 'Liste ▴' : 'Liste ▾'}
          </button>
          <button
            onClick={selectAllNotifTargets}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.primary}40`,
              background: `${theme.primary}15`,
              color: theme.primary,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Alle auswählen (
            {notifLangFilter === 'all'
              ? Object.keys(users).length
              : notifLangFilter === 'unknown'
                ? langCounts.unknown
                : langCounts[notifLangFilter]}
            )
          </button>
          {Object.keys(notifTargets).length > 0 && (
            <button
              onClick={() => setNotifTargets({})}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent',
                color: theme.text.muted,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Leeren
            </button>
          )}
        </div>

        {(notifListOpen || notifSearch) && (
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              marginBottom: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {notifFilteredUsers.map(([uid, u]) => {
              const selected = !!notifTargets[uid];
              return (
                <div
                  key={uid}
                  onClick={() => toggleNotifTarget(uid, u.displayName || u.username || uid)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: selected ? `${theme.primary}20` : theme.background.default,
                    fontSize: '13px',
                    color: theme.text.secondary,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `1px solid ${selected ? theme.primary : 'rgba(255,255,255,0.2)'}`,
                      background: selected ? theme.primary : 'transparent',
                      color: theme.background.default,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <strong>{u.displayName || u.username || 'Unbekannt'}</strong>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: theme.text.muted,
                      fontSize: '10px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {u.language ? u.language.toUpperCase() : '?'}
                  </span>
                  <span style={{ color: theme.text.muted, fontSize: '11px' }}>
                    {uid.slice(0, 12)}...
                  </span>
                </div>
              );
            })}
            {notifFilteredUsers.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: '13px', color: theme.text.muted }}>
                Keine Treffer
              </div>
            )}
          </div>
        )}

        {Object.keys(notifTargets).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {Object.entries(notifTargets).map(([uid, name]) => (
              <span
                key={uid}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: `${theme.primary}15`,
                  color: theme.primary,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {name}
                <button
                  onClick={() =>
                    setNotifTargets((prev) => {
                      const next = { ...prev };
                      delete next[uid];
                      return next;
                    })
                  }
                  style={{
                    border: 'none',
                    background: 'none',
                    color: theme.primary,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '13px',
                    lineHeight: 1,
                  }}
                  aria-label={`${name} entfernen`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={notifTitle}
          onChange={(e) => setNotifTitle(e.target.value)}
          maxLength={120}
          placeholder="Titel..."
          style={{ ...inputStyle, marginBottom: '8px' }}
        />
        <textarea
          value={notifMessage}
          onChange={(e) => setNotifMessage(e.target.value)}
          maxLength={1000}
          placeholder="Nachricht..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: '8px' }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: theme.text.secondary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={notifPush}
              onChange={(e) => setNotifPush(e.target.checked)}
            />
            Auch als Push senden
          </label>
          <button
            onClick={handleSendNotification}
            disabled={!notifReady}
            style={{
              marginLeft: 'auto',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: notifReady ? theme.primary : `${theme.primary}30`,
              color: notifReady ? theme.background.default : `${theme.primary}60`,
              cursor: notifReady ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Send style={{ fontSize: '16px' }} />
            {notifSending ? 'Sendet…' : `Notification senden (${Object.keys(notifTargets).length})`}
          </button>
        </div>

        {notifResult && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: notifResult.startsWith('Fehler') ? theme.status.error : theme.status.success,
            }}
          >
            {notifResult}
          </div>
        )}
      </div>

      {/* Neue Nachricht */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.background.surface,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: theme.text.secondary }}>
          Neue Nachricht senden
        </h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="User suchen..."
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '8px',
            background: theme.background.default,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: theme.text.secondary,
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {search && (
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              marginBottom: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {filteredUsers.slice(0, 20).map(([uid, u]) => (
              <div
                key={uid}
                onClick={() => {
                  setSelectedUid(uid);
                  setSearch('');
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: selectedUid === uid ? `${theme.primary}20` : theme.background.default,
                  fontSize: '13px',
                  color: theme.text.secondary,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <strong>{u.displayName || u.username || 'Unbekannt'}</strong>
                <span style={{ color: theme.text.muted, marginLeft: '8px', fontSize: '11px' }}>
                  {uid.slice(0, 12)}...
                </span>
              </div>
            ))}
          </div>
        )}

        {selectedUid && (
          <div
            style={{
              padding: '6px 10px',
              marginBottom: '8px',
              borderRadius: '6px',
              background: `${theme.primary}15`,
              color: theme.primary,
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {users[selectedUid]?.displayName || users[selectedUid]?.username || selectedUid}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nachricht eingeben..."
            style={{
              flex: 1,
              padding: '10px 12px',
              background: theme.background.default,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: theme.text.secondary,
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!selectedUid || !text.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: selectedUid && text.trim() ? theme.primary : `${theme.primary}30`,
              color: selectedUid && text.trim() ? theme.background.default : `${theme.primary}60`,
              cursor: selectedUid && text.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Send style={{ fontSize: '16px' }} />
            Senden
          </button>
        </div>
      </div>

      {/* Aktive Nachrichten */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: theme.background.surface,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: theme.text.secondary }}>
          Aktive Nachrichten ({Object.keys(messages).length})
        </h3>

        {Object.keys(messages).length === 0 ? (
          <p style={{ color: theme.text.muted, fontSize: '13px', margin: 0 }}>
            Keine aktiven Nachrichten
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(messages).map(([uid, msg]) => (
              <div
                key={uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: theme.background.default,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: theme.primary }}>
                    {msg.displayName}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.text.secondary, marginTop: '2px' }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '4px' }}>
                    {new Date(msg.createdAt).toLocaleString('de-DE')}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(uid)}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: `${theme.status.error}15`,
                    color: theme.status.error,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Delete style={{ fontSize: '18px' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
