import SearchIcon from '@mui/icons-material/Search';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BackButton } from '../../components/ui';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';
import {
  otherUidFromPairId,
  subscribeChatIndex,
  subscribeChatState,
  subscribeSummary,
  type ChatSummary,
} from '../../services/chat/chatService';
import type { Friend } from '../../types/Friend';
import { ChatAvatar } from './ChatAvatar';

function formatListTime(ts: number | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t('Gestern');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

const ChatRow = ({
  pairId,
  myUid,
  friend,
  lastReadAt,
  active,
  onOpen,
}: {
  pairId: string;
  myUid: string;
  friend: Friend | undefined;
  lastReadAt: number;
  active: boolean;
  onOpen: (friendUid: string) => void;
}) => {
  const { currentTheme } = useTheme();
  const [summary, setSummary] = useState<ChatSummary>({});
  const otherUid = otherUidFromPairId(pairId, myUid);

  useEffect(() => subscribeSummary(pairId, setSummary), [pairId]);

  if (!otherUid) return null;
  const name = friend?.displayName || friend?.username || t('Unbekannt');
  const unread =
    !!summary.lastMessageAt && summary.lastSender !== myUid && summary.lastMessageAt > lastReadAt;

  return (
    <motion.button
      whileTap={tapScaleSmall}
      className={`ch-row${active ? ' is-active' : ''}`}
      onClick={() => onOpen(otherUid)}
    >
      <ChatAvatar name={name} photoURL={friend?.photoURL} ring={unread} online={friend?.isOnline} />
      <div className="ch-row-body">
        <div className="ch-row-name" style={{ color: currentTheme.text.primary }}>
          {name}
        </div>
        <div
          className="ch-row-preview"
          style={{
            color: unread ? currentTheme.text.primary : currentTheme.text.muted,
            fontWeight: unread ? 650 : 400,
          }}
        >
          {summary.lastSender === myUid && summary.lastMessage ? `${t('Du')}: ` : ''}
          {summary.lastMessage || t('Sag hallo!')}
        </div>
      </div>
      <div className="ch-row-side">
        <span
          className="ch-row-time"
          style={{ color: unread ? currentTheme.primary : currentTheme.text.muted }}
        >
          {formatListTime(summary.lastMessageAt)}
        </span>
        {unread && <span className="ch-unread-dot" aria-label={t('Ungelesen')} />}
      </div>
    </motion.button>
  );
};

const FriendRow = ({ friend, onOpen }: { friend: Friend; onOpen: (uid: string) => void }) => {
  const { currentTheme } = useTheme();
  const name = friend.displayName || friend.username;
  return (
    <motion.button whileTap={tapScaleSmall} className="ch-row" onClick={() => onOpen(friend.uid)}>
      <ChatAvatar name={name} photoURL={friend.photoURL} online={friend.isOnline} />
      <div className="ch-row-body">
        <div className="ch-row-name" style={{ color: currentTheme.text.primary }}>
          {name}
        </div>
        <div className="ch-row-preview" style={{ color: currentTheme.text.muted }}>
          {friend.isOnline ? t('Gerade online') : t('Neuen Chat starten')}
        </div>
      </div>
    </motion.button>
  );
};

export const ChatListPane = ({
  myUid,
  activeFriendId,
  onOpen,
}: {
  myUid: string;
  activeFriendId?: string;
  onOpen: (friendUid: string) => void;
}) => {
  const { currentTheme } = useTheme();
  const { friends } = useOptimizedFriends();
  const [index, setIndex] = useState<Array<{ pairId: string; lastMessageAt: number }>>([]);
  const [chatState, setChatState] = useState<Record<string, { lastReadAt?: number }>>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    const offIndex = subscribeChatIndex(myUid, setIndex);
    const offState = subscribeChatState(myUid, setChatState);
    return () => {
      offIndex();
      offState();
    };
  }, [myUid]);

  const friendByUid = useMemo(() => new Map(friends.map((f) => [f.uid, f])), [friends]);
  const q = query.trim().toLowerCase();

  const visibleChats = useMemo(() => {
    if (!q) return index;
    return index.filter((e) => {
      const other = otherUidFromPairId(e.pairId, myUid);
      const f = other ? friendByUid.get(other) : undefined;
      const name = (f?.displayName || f?.username || '').toLowerCase();
      return name.includes(q);
    });
  }, [index, q, myUid, friendByUid]);

  // Freunde ohne bestehenden Chat — sortiert: online zuerst, dann alphabetisch.
  const friendsWithoutChat = useMemo(() => {
    const chatUids = new Set(index.map((e) => otherUidFromPairId(e.pairId, myUid)));
    return friends
      .filter((f) => !chatUids.has(f.uid))
      .filter((f) => !q || (f.displayName || f.username || '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (!!a.isOnline !== !!b.isOnline) return a.isOnline ? -1 : 1;
        return (a.displayName || a.username).localeCompare(b.displayName || b.username);
      });
  }, [friends, index, myUid, q]);

  return (
    <div className="ch-pane-list">
      <div className="ch-list-header">
        <BackButton />
        <h1
          style={{
            background: `linear-gradient(90deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {t('Chats')}
        </h1>
      </div>

      <div className="ch-search">
        <SearchIcon style={{ fontSize: 20, color: currentTheme.text.muted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Freunde durchsuchen …')}
          style={{ color: currentTheme.text.primary }}
        />
      </div>

      <div className="ch-scroll">
        {visibleChats.map((entry) => {
          const other = otherUidFromPairId(entry.pairId, myUid);
          return (
            <ChatRow
              key={entry.pairId}
              pairId={entry.pairId}
              myUid={myUid}
              friend={other ? friendByUid.get(other) : undefined}
              lastReadAt={chatState[entry.pairId]?.lastReadAt || 0}
              active={!!other && other === activeFriendId}
              onOpen={onOpen}
            />
          );
        })}

        {friendsWithoutChat.length > 0 && (
          <>
            <div className="ch-section-label" style={{ color: currentTheme.text.muted }}>
              {t('Freunde')}
            </div>
            {friendsWithoutChat.map((f) => (
              <FriendRow key={f.uid} friend={f} onOpen={onOpen} />
            ))}
          </>
        )}

        {index.length === 0 && friends.length === 0 && (
          <div className="ch-empty" style={{ color: currentTheme.text.muted }}>
            <ForumOutlined style={{ fontSize: 44, color: currentTheme.primary }} />
            <h3 style={{ color: currentTheme.text.primary }}>{t('Noch keine Chats')}</h3>
            <p>
              {t(
                'Füge zuerst Freunde hinzu — danach kannst du hier private Unterhaltungen starten.'
              )}
            </p>
          </div>
        )}

        {q &&
          visibleChats.length === 0 &&
          friendsWithoutChat.length === 0 &&
          friends.length > 0 && (
            <div className="ch-empty" style={{ color: currentTheme.text.muted }}>
              <p>{t('Keine Treffer für „{query}“', { query })}</p>
            </div>
          )}
      </div>
    </div>
  );
};
