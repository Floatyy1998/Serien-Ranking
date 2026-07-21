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
}

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

  const notifFilteredUsers = Object.entries(users).filter(([uid, u]) => {
    const q = notifSearch.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      uid.toLowerCase().includes(q)
    );
  });

  const handleSendNotification = async () => {
    const uids = Object.keys(notifTargets);
    if (!uids.length || !notifTitle.trim() || !notifMessage.trim() || notifSending) return;
    setNotifSending(true);
    setNotifResult('');
    try {
      const res = await backendFetch('/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uids,
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
      } else {
        const failed = (data.results || []).filter((r) => !r.ok);
        setNotifResult(
          failed.length
            ? `${data.sent} gesendet, ${failed.length} fehlgeschlagen: ${failed
                .map((f) => `${f.uid.slice(0, 8)}… (${f.error})`)
                .join(', ')}`
            : `${data.sent} Notification(s) gesendet ✓`
        );
        if (!failed.length) {
          setNotifTargets({});
          setNotifTitle('');
          setNotifMessage('');
          setNotifPush(false);
        }
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

        <input
          type="text"
          value={notifSearch}
          onChange={(e) => setNotifSearch(e.target.value)}
          placeholder="Empfänger suchen (Name oder UID)..."
          style={{ ...inputStyle, marginBottom: '8px' }}
        />

        {notifSearch && (
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              marginBottom: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {notifFilteredUsers.slice(0, 20).map(([uid, u]) => (
              <div
                key={uid}
                onClick={() => {
                  setNotifTargets((prev) => ({
                    ...prev,
                    [uid]: u.displayName || u.username || uid,
                  }));
                  setNotifSearch('');
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: notifTargets[uid] ? `${theme.primary}20` : theme.background.default,
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
            {notifSending ? 'Sendet…' : 'Notification senden'}
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
