import { InsertEmoticonOutlined, Send, VisibilityOffOutlined } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { Dialog } from '../../components/ui';
import {
  OptimizedFriendsContext,
  useOptimizedFriends,
} from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { linkHost } from '../../lib/text/linkify';
import {
  replyFromMessage,
  type ChatMessage,
  type ChatReply,
  type SharedEpisode,
} from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import type { Friend } from '../../types/Friend';
import '../Chats/ChatPages.css';
import { ChatMessageItem } from '../Chats/ChatMessageItem';
import { ChatMessageMenu } from '../Chats/ChatMessageMenu';
import { ChatPinnedBar } from '../Chats/ChatPinnedBar';
import { ChatReplyDraft } from '../Chats/ChatReply';
import { EpisodeShareCard } from '../Chats/EpisodeShareCard';
import { ShareEpisodeSheet } from '../EpisodeDiscussion/ShareEpisodeSheet';

const EPISODE: SharedEpisode = {
  seriesId: 209867,
  season: 1,
  episode: 5,
  seriesTitle: 'Frieren – Nach dem Ende der Reise',
  episodeTitle: 'Phantome der Toten',
  poster: '/dqZENchTd7lp5zht7BdlqM7RBhD.jpg',
};

const FRIENDS: Friend[] = ['Florian', 'BeLLe', 'catcatcat', 'Jonas', 'Mira'].map((name, i) => ({
  uid: `f${i}`,
  email: `${name.toLowerCase()}@example.com`,
  username: name,
  displayName: name,
  friendsSince: 0,
}));

export const EpisodeSharePreview = () => {
  const { currentTheme } = useTheme();
  const base = useOptimizedFriends();
  const friendsCtx = useMemo(() => ({ ...base, friends: FRIENDS, loading: false }), [base]);

  return (
    <OptimizedFriendsContext.Provider value={friendsCtx}>
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="ch-bubble-wrap ch-bubble-wrap--own">
          <div
            className="ch-bubble ch-bubble--own"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            }}
          >
            <EpisodeShareCard episode={EPISODE} own />
            <div className="ch-episode-note">Die Szene am Ende, boah!</div>
          </div>
        </div>
        <div className="ch-bubble-wrap">
          <div className="ch-bubble ch-bubble--other" style={{ color: currentTheme.text.primary }}>
            <EpisodeShareCard episode={EPISODE} own={false} />
            <button className="ch-spoiler-cover ch-episode-note">
              <VisibilityOffOutlined style={{ fontSize: 16 }} />
              {t('Spoiler — tippen zum Lesen')}
            </button>
          </div>
        </div>
      </div>
      <ShareEpisodeSheet
        episode={EPISODE}
        isOpen={new URLSearchParams(window.location.search).get('sheet') !== '0'}
        onClose={() => {}}
      />
    </OptimizedFriendsContext.Provider>
  );
};

const ME = 'me';
const FRIEND = 'f0';
const at = (minute: number) => new Date().setHours(18, minute, 0, 0);

const THREAD: ChatMessage[] = [
  { id: 'a1', senderId: FRIEND, text: 'Hast du schon mit Frieren angefangen?', timestamp: at(0) },
  {
    id: 'a2',
    senderId: ME,
    text: 'Ja! Gestern Folge 5 geschaut, die Szene am Ende 😭',
    timestamp: at(2),
  },
  {
    id: 'a3',
    senderId: FRIEND,
    text: 'Warte bis Folge 10, da wird es noch besser',
    timestamp: at(3),
    replyTo: { id: 'a2', senderId: ME, text: 'Ja! Gestern Folge 5 geschaut, die Szene am Ende 😭' },
  },
  {
    id: 'a4',
    senderId: FRIEND,
    text: 'Trailer zur zweiten Staffel: https://www.youtube.com/watch?v=qgQbP8ZfNcA',
    timestamp: at(3),
  },
  {
    id: 'a5',
    senderId: ME,
    text: 'Danke! Kennst du schon www.crunchyroll.com/de? Da läuft sie auch',
    timestamp: at(5),
    replyTo: {
      id: 'a4',
      senderId: FRIEND,
      text: 'Trailer zur zweiten Staffel: https://www.youtube.com/watch?v=qgQbP8ZfNcA',
    },
  },
  { id: 'a6', senderId: FRIEND, text: '', stickerId: 'fox-60', timestamp: at(7) },
  {
    id: 'a7',
    senderId: ME,
    text: 'haha der ist so süß',
    timestamp: at(8),
    replyTo: { id: 'a6', senderId: FRIEND, kind: 'st', stickerId: 'fox-60' },
  },
  {
    id: 'a8',
    senderId: FRIEND,
    text: 'In Folge 18 taucht der Dämonenkönig auf',
    isSpoiler: true,
    timestamp: at(9),
  },
  {
    id: 'a9',
    senderId: ME,
    text: 'NICHT SPOILERN',
    timestamp: at(10),
    replyTo: { id: 'a8', senderId: FRIEND, kind: 'sp' },
  },
  { id: 'b1', senderId: FRIEND, text: 'Die Folge!!', episode: EPISODE, timestamp: at(12) },
  {
    id: 'b2',
    senderId: ME,
    text: 'Ok',
    timestamp: at(13),
    replyTo: {
      id: 'b1',
      senderId: FRIEND,
      kind: 'ep',
      text: 'Frieren – Nach dem Ende der Reise S1·E5 – Die Folge!!',
    },
  },
  {
    id: 'b3',
    senderId: FRIEND,
    text: 'Schau mal, was mir Lena geschickt hat: Staffel 2 kommt im Januar',
    timestamp: at(14),
    forwarded: true,
  },
  { id: 'b4', senderId: ME, text: '', timestamp: at(15), deleted: true },
  { id: 'b5', senderId: ME, text: 'Endlich!!', timestamp: at(15) },
];

const ITEMS = THREAD.map((m, i) => ({
  ...m,
  cont:
    i > 0 &&
    THREAD[i - 1].senderId === m.senderId &&
    m.timestamp - THREAD[i - 1].timestamp < 300000,
}));

/** Antworten wie bei WhatsApp: Zitate in Blasen, Antwort-Leiste, Wischen + Hover-Knopf, Links. */
export const ChatReplyPreview = () => {
  const { currentTheme } = useTheme();
  const byId = useMemo(() => new Map(THREAD.map((m) => [m.id, m])), []);
  const [replyTo, setReplyTo] = useState<ChatReply | null>(() =>
    new URLSearchParams(window.location.search).get('draft') === '0'
      ? null
      : replyFromMessage(THREAD[2])
  );
  const [flashId, setFlashId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const onReply = useCallback((m: ChatMessage) => setReplyTo(replyFromMessage(m)), []);
  const onJump = useCallback((id: string) => {
    document.querySelector(`[data-msg-id="${id}"]`)?.scrollIntoView({ block: 'center' });
    setFlashId(id);
  }, []);
  const onLink = useCallback((href: string) => {
    setLink(href);
    setLinkOpen(true);
  }, []);
  const noop = useCallback(() => {}, []);
  const params = new URLSearchParams(window.location.search);
  const [menu, setMenu] = useState<{ id: string; anchor: DOMRect } | null>(null);
  const [selection, setSelection] = useState<Set<string> | null>(() =>
    params.get('select') === '1' ? new Set(['a4', 'b3']) : null
  );
  const openMenu = useCallback((m: ChatMessage) => {
    const el = document.querySelector(`[data-msg-id="${m.id}"] .ch-bubble`);
    if (el) setMenu({ id: m.id, anchor: el.getBoundingClientRect() });
  }, []);
  const toggleSelect = useCallback(
    (id: string) =>
      setSelection((prev) => {
        const next = new Set(prev ?? []);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next.size ? next : null;
      }),
    []
  );
  const autoMenu = params.get('menu');
  const autoMenuRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !autoMenu) return;
      requestAnimationFrame(() => {
        const target = THREAD.find((m) => m.id === autoMenu);
        document.querySelector(`[data-msg-id="${autoMenu}"]`)?.scrollIntoView({ block: 'center' });
        if (target) requestAnimationFrame(() => openMenu(target));
      });
    },
    [autoMenu, openMenu]
  );
  const menuMsg = menu ? THREAD.find((m) => m.id === menu.id) : undefined;
  const lastOwn = [...THREAD].reverse().find((m) => m.senderId === ME)?.id;

  return (
    <div className="ch-shell" style={{ height: '100vh' }}>
      <div className="ch-pane-thread" style={{ background: currentTheme.background.default }}>
        <div className="ch-thread-bg" aria-hidden />
        <ChatPinnedBar
          pinned={replyFromMessage(THREAD[3])}
          onJump={() => onJump('a4')}
          onUnpin={noop}
        />
        <div className="ch-messages" ref={autoMenuRef}>
          <div className="ch-messages-inner">
            {ITEMS.map((m) => (
              <ChatMessageItem
                key={m.id}
                message={m}
                myUid={ME}
                partnerName="Florian"
                myStyle={null}
                reactions={m.id === 'a3' ? ['❤️'] : []}
                spoilerRevealed={false}
                flash={flashId === m.id}
                quotedOriginal={m.replyTo ? byId.get(m.replyTo.id) : undefined}
                canReply
                starred={m.id === 'a4'}
                receipt={
                  m.senderId === ME && !m.deleted ? (m.id === lastOwn ? 'sent' : 'read') : null
                }
                selecting={!!selection}
                selected={!!selection?.has(m.id)}
                highlighted={menu?.id === m.id}
                onRevealSpoiler={noop}
                onToggleHeart={noop}
                onReply={onReply}
                onMenu={openMenu}
                onToggleSelect={toggleSelect}
                onJump={onJump}
                onLink={onLink}
                onOpenImage={noop}
              />
            ))}
          </div>
        </div>
        {menu && menuMsg && (
          <ChatMessageMenu
            anchor={menu.anchor}
            own={menuMsg.senderId === ME}
            deleted={!!menuMsg.deleted}
            myReaction={menuMsg.id === 'a3' ? '❤️' : null}
            starred={menuMsg.id === 'a4'}
            pinned={menuMsg.id === 'a4'}
            canReply
            canCopy={!!menuMsg.text}
            canReact={!menuMsg.deleted}
            canEdit={menuMsg.senderId === ME && !menuMsg.deleted}
            onEdit={() => setMenu(null)}
            onReact={() => setMenu(null)}
            onReply={() => setMenu(null)}
            onCopy={() => setMenu(null)}
            onForward={() => setMenu(null)}
            onPin={() => setMenu(null)}
            onStar={() => setMenu(null)}
            onSelect={() => {
              setSelection(new Set([menuMsg.id]));
              setMenu(null);
            }}
            onReport={() => setMenu(null)}
            onDelete={() => setMenu(null)}
            onClose={() => setMenu(null)}
          />
        )}
        <div className="ch-input-bar">
          <AnimatePresence>
            {replyTo && (
              <ChatReplyDraft
                reply={replyTo}
                author={replyTo.senderId === ME ? t('Du') : 'Florian'}
                mine={replyTo.senderId === ME}
                original={byId.get(replyTo.id)}
                color={currentTheme.text.primary}
                mutedColor={currentTheme.text.muted}
                onCancel={() => setReplyTo(null)}
              />
            )}
          </AnimatePresence>
          <button className="ch-icon-btn" style={{ color: currentTheme.text.muted }}>
            <InsertEmoticonOutlined />
          </button>
          <textarea
            className="ch-input"
            rows={1}
            placeholder={t('Nachricht an {name} …', { name: 'Florian' })}
            style={{ color: currentTheme.text.primary }}
          />
          <button
            className="ch-send-btn"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            }}
          >
            <Send style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title={t('Du verlässt TV-Rank')}
        message={t(
          'Der Link öffnet {host} in einem neuen Tab. Öffne nur Links von Leuten, denen du vertraust.',
          { host: linkHost(link) }
        )}
        type="warning"
        actions={[
          { label: t('Abbrechen'), onClick: () => {}, variant: 'secondary' },
          { label: t('Link öffnen'), onClick: () => {}, variant: 'primary' },
        ]}
      />
    </div>
  );
};
