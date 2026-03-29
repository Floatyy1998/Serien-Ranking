import { Delete, Send } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';

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

  const loadMessages = useCallback(() => {
    firebase
      .database()
      .ref('admin/userMessages')
      .once('value')
      .then((snap) => setMessages(snap.val() || {}));
  }, []);

  useEffect(() => {
    loadMessages();
    firebase
      .database()
      .ref('users')
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
    await firebase.database().ref(`admin/userMessages/${selectedUid}`).set({
      text: text.trim(),
      displayName: name,
      createdAt: new Date().toISOString(),
    });
    setText('');
    setSelectedUid('');
    loadMessages();
  };

  const handleDelete = async (uid: string) => {
    await firebase.database().ref(`admin/userMessages/${uid}`).remove();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
