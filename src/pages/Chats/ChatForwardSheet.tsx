import CheckRounded from '@mui/icons-material/CheckRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, SearchInput } from '../../components/ui';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { otherUidFromPairId, subscribeChatIndex } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import type { Friend } from '../../types/Friend';
import { ChatAvatar } from './ChatAvatar';

const SEARCH_FROM = 7;

const nameOf = (f: Friend) => f.displayName || f.username || f.email;

/** Freunde auswählen, an die Nachrichten weitergeleitet werden (zuletzt angeschriebene oben). */
export const ChatForwardSheet = ({
  myUid,
  count,
  isOpen,
  sending,
  onClose,
  onSend,
}: {
  myUid: string;
  count: number;
  isOpen: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (friendUids: string[]) => void;
}) => {
  const { currentTheme } = useTheme();
  const { friends } = useOptimizedFriends();
  const [recent, setRecent] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    return subscribeChatIndex(myUid, (entries) => {
      const map = new Map<string, number>();
      for (const entry of entries) {
        const other = otherUidFromPairId(entry.pairId, myUid);
        if (other) map.set(other, entry.lastMessageAt);
      }
      setRecent(map);
    });
  }, [isOpen, myUid]);

  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setPicked(new Set());
  }, [isOpen]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends
      .filter((f) => !q || nameOf(f).toLowerCase().includes(q))
      .sort(
        (a, b) =>
          (recent.get(b.uid) ?? 0) - (recent.get(a.uid) ?? 0) || nameOf(a).localeCompare(nameOf(b))
      );
  }, [friends, query, recent]);

  const toggle = (uid: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Weiterleiten an …')}>
      <div className="ch-fw">
        <div className="ch-fw-head">
          <strong style={{ color: currentTheme.text.primary }}>{t('Weiterleiten an …')}</strong>
          <span style={{ color: currentTheme.text.muted }}>
            {count === 1 ? t('1 Nachricht') : t('{count} Nachrichten', { count })}
          </span>
        </div>
        {friends.length >= SEARCH_FROM && (
          <SearchInput value={query} onChange={setQuery} placeholder={t('Freund suchen...')} />
        )}
        <div className="ch-fw-list">
          {list.map((friend) => {
            const on = picked.has(friend.uid);
            return (
              <button
                key={friend.uid}
                type="button"
                className="ch-fw-row"
                onClick={() => toggle(friend.uid)}
                aria-pressed={on}
              >
                <ChatAvatar name={nameOf(friend)} photoURL={friend.photoURL} small />
                <span className="ch-fw-name" style={{ color: currentTheme.text.secondary }}>
                  {nameOf(friend)}
                </span>
                <span
                  className={`ch-select-dot${on ? ' is-on' : ''}`}
                  style={on ? { background: currentTheme.primary } : undefined}
                  aria-hidden
                >
                  {on && <CheckRounded />}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="ch-fw-send"
          disabled={picked.size === 0 || sending}
          onClick={() => onSend([...picked])}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
          }}
        >
          <SendRounded style={{ fontSize: 18 }} />
          {sending
            ? t('Sendet…')
            : picked.size > 1
              ? t('An {count} senden', { count: picked.size })
              : t('Senden')}
        </button>
      </div>
    </BottomSheet>
  );
};
