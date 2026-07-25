import ArrowBack from '@mui/icons-material/ArrowBack';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import InsertEmoticonOutlined from '@mui/icons-material/InsertEmoticonOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import Send from '@mui/icons-material/Send';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../../components/ui';
import { NameBadges } from '../../components/ui/NameBadges';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { t } from '../../services/i18n';
import {
  chatPairId,
  deleteChat,
  ensureChat,
  markChatRead,
  MAX_MESSAGE_LENGTH,
  reportChat,
  sendImageMessage,
  sendMessage,
  setChatBlocked,
  setReaction,
  setTyping,
  subscribeBlocked,
  subscribeMessages,
  subscribeReactions,
  subscribeTyping,
  type ChatMessage,
} from '../../services/chat/chatService';
import {
  saveBubbleStyle,
  setChatWallpaper,
  subscribeBubbleStyle,
  subscribeChatWallpaper,
  type ChatBubbleStyle,
} from '../../services/chat/chatAppearance';
import { clearDeliveredChatPushes } from '../../services/pushNotifications';
import { MAX_IMAGE_BYTES } from '../../lib/imageCompress';
import { bubbleTextColor, RADIUS_PX, resolveWallpaper } from './chatWallpapers';
import { ChatAvatar } from './ChatAvatar';
import { ChatComposerPicker } from './ChatComposerPicker';
import { ChatDesignSheet } from './ChatDesignSheet';
import { StickerCanvas } from './StickerCanvas';
import { isValidStickerId } from './stickers';
import { useChatPartner } from './useChatPartner';

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t('Heute');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t('Gestern');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TYPING_VISIBLE_MS = 6000;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export const ChatThreadPane = ({ friendId, showBack }: { friendId: string; showBack: boolean }) => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const partner = useChatPartner(friendId);

  const myUid = user?.uid;
  const pairId = myUid ? chatPairId(myUid, friendId) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, Record<string, string>>>({});
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [otherTypingAt, setOtherTypingAt] = useState<number | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<'report' | 'delete' | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [myStyle, setMyStyle] = useState<ChatBubbleStyle | null>(null);
  const [wallpaperId, setWallpaperId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    url: string;
    isGif: boolean;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFrame = useRef(0);
  const lastTypingSentRef = useRef(0);

  // Chat beim Öffnen anlegen — Listener auf einen nicht existierenden Chat
  // werden von Firebase bei permission_denied dauerhaft gecancelt.
  useEffect(() => {
    if (!myUid) return;
    let alive = true;
    setChatReady(false);
    ensureChat(myUid, friendId)
      .then(() => {
        if (alive) setChatReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [myUid, friendId]);

  useEffect(() => {
    if (!pairId || !myUid || !chatReady) return;
    setMessages([]);
    setDraft('');
    setEmojiOpen(false);
    const offMessages = subscribeMessages(pairId, setMessages);
    const offReactions = subscribeReactions(pairId, setReactions);
    const offBlocked = subscribeBlocked(pairId, setBlockedBy);
    const offTyping = subscribeTyping(pairId, myUid, setOtherTypingAt);
    return () => {
      offMessages();
      offReactions();
      offBlocked();
      offTyping();
      void setTyping(myUid, pairId, false);
    };
  }, [pairId, myUid, chatReady]);

  useEffect(() => {
    if (!myUid) return;
    return subscribeBubbleStyle(myUid, setMyStyle);
  }, [myUid]);

  useEffect(() => {
    if (!myUid || !pairId) return;
    return subscribeChatWallpaper(myUid, pairId, setWallpaperId);
  }, [myUid, pairId]);

  // Tipp-Anzeige lebt nur kurz — regelmäßig neu bewerten, bis sie erlischt.
  useEffect(() => {
    const evaluate = () =>
      setOtherTyping(!!otherTypingAt && Date.now() - otherTypingAt < TYPING_VISIBLE_MS);
    evaluate();
    if (!otherTypingAt) return;
    const id = setInterval(evaluate, 2000);
    return () => clearInterval(id);
  }, [otherTypingAt]);

  useEffect(() => {
    if (!pairId || !myUid || messages.length === 0) return;
    if (document.visibilityState === 'visible') {
      void markChatRead(myUid, pairId);
      // Gelesen = zugestellte Pushes dieses Chats vom Sperrbildschirm räumen
      void clearDeliveredChatPushes(friendId);
    }
  }, [pairId, myUid, messages.length, friendId]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    // Erst synchron, dann im nächsten Frame erneut: Layout (Bild-Seitenverhältnis,
    // Schrift, Zeilenumbruch, Safe-Area) ist vor dem Paint noch nicht final, sonst
    // landet der Sprung ein Stück über dem echten Ende.
    scrollToBottom();
    const r1 = requestAnimationFrame(() => {
      scrollToBottom();
      const r2 = requestAnimationFrame(scrollToBottom);
      pendingFrame.current = r2;
    });
    pendingFrame.current = r1;
    return () => cancelAnimationFrame(pendingFrame.current);
  }, [messages.length, otherTyping, scrollToBottom]);

  const iBlocked = !!myUid && blockedBy.includes(myUid);
  const chatFrozen = blockedBy.length > 0;
  const myName = user?.displayName || t('Ich');

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      const el = inputRef.current;
      if (el) {
        el.style.height = 'auto';
        // +2 = Rahmen (border-box), sonst bleibt 1 Zeile scrollbar
        el.style.height = `${Math.min(el.scrollHeight + 2, 120)}px`;
      }
      if (!myUid || !pairId || !chatReady) return;
      const now = Date.now();
      if (value.trim() && now - lastTypingSentRef.current > 2500) {
        lastTypingSentRef.current = now;
        void setTyping(myUid, pairId, true);
      }
      if (!value.trim()) void setTyping(myUid, pairId, false);
    },
    [myUid, pairId, chatReady]
  );

  const handleSend = useCallback(async () => {
    if (!myUid || sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(myUid, friendId, { kind: 'text', text }, myName);
      setDraft('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      void setTyping(myUid, chatPairId(myUid, friendId), false);
      inputRef.current?.focus();
    } catch {
      showToast(t('Nachricht konnte nicht gesendet werden.'), 4000, 'error');
    } finally {
      setSending(false);
    }
  }, [myUid, friendId, draft, myName, sending]);

  // WhatsApp-Flow: erst Vorschau mit optionaler Bildunterschrift, dann senden.
  const openImagePreview = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_IMAGE_BYTES) {
      showToast(t('Bild ist zu groß (max. 8 MB).'), 4000, 'error');
      return;
    }
    setCaption('');
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file), isGif: file.type === 'image/gif' };
    });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  // Kopierte GIFs landen als Standbild in der Zwischenablage — die echte
  // GIF-URL steckt im mitkopierten HTML. Erst das Original versuchen.
  const handlePastedImage = useCallback(
    async (file: File | null, gifUrl: string | null) => {
      if (gifUrl) {
        try {
          const res = await fetch(gifUrl.replace(/&amp;/g, '&'));
          const blob = await res.blob();
          if (blob.type === 'image/gif' && blob.size <= MAX_IMAGE_BYTES) {
            openImagePreview(new File([blob], 'clipboard.gif', { type: 'image/gif' }));
            return;
          }
        } catch {
          /* CORS o. ä. — dann eben das Standbild */
        }
      }
      if (file) openImagePreview(file);
    },
    [openImagePreview]
  );

  const confirmSendImage = useCallback(async () => {
    if (!myUid || !pendingImage || uploadingImage) return;
    setUploadingImage(true);
    try {
      await sendImageMessage(myUid, friendId, pendingImage.file, myName, caption);
      closeImagePreview();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      showToast(
        code === 'too-large'
          ? t('Bild ist zu groß (max. 8 MB).')
          : t('Bild konnte nicht gesendet werden.'),
        4000,
        'error'
      );
    } finally {
      setUploadingImage(false);
    }
  }, [myUid, friendId, myName, pendingImage, caption, uploadingImage, closeImagePreview]);

  const sendSticker = useCallback(
    async (stickerId: string) => {
      if (!myUid) return;
      setEmojiOpen(false);
      try {
        await sendMessage(myUid, friendId, { kind: 'sticker', stickerId }, myName);
      } catch {
        showToast(t('Nachricht konnte nicht gesendet werden.'), 4000, 'error');
      }
    },
    [myUid, friendId, myName]
  );

  const handleReport = useCallback(async () => {
    if (!myUid || !partner) return;
    setConfirm(null);
    try {
      await reportChat(
        { uid: myUid, name: myName },
        friendId,
        partner.name,
        chatPairId(myUid, friendId),
        messages
      );
      showToast(t('Meldung gesendet — wir schauen uns das an.'), 4000);
    } catch {
      showToast(t('Meldung konnte nicht gesendet werden.'), 4000, 'error');
    }
  }, [myUid, friendId, partner, myName, messages]);

  const handleDelete = useCallback(async () => {
    if (!myUid || !pairId) return;
    setConfirm(null);
    try {
      await deleteChat(myUid, pairId);
      showToast(t('Chat gelöscht.'), 3000);
      navigate('/chats', { replace: true });
    } catch {
      showToast(t('Chat konnte nicht gelöscht werden.'), 4000, 'error');
    }
  }, [myUid, pairId, navigate]);

  const toggleBlock = useCallback(async () => {
    if (!myUid || !pairId) return;
    setMenuOpen(false);
    try {
      await setChatBlocked(myUid, pairId, !iBlocked);
      showToast(iBlocked ? t('Chat entsperrt.') : t('Chat blockiert.'), 3000);
    } catch {
      showToast(t('Das hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
    }
  }, [myUid, pairId, iBlocked]);

  // Instagram-Geste: Doppeltipp auf eine Nachricht togglet die Herz-Reaktion.
  const toggleHeart = useCallback(
    (msgId: string) => {
      if (!myUid || !pairId) return;
      const mine = reactions[msgId]?.[myUid];
      hapticTap();
      void setReaction(myUid, pairId, msgId, mine ? null : '❤️').catch(() => {});
    },
    [myUid, pairId, reactions]
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = inputRef.current;
      const start = el?.selectionStart ?? draft.length;
      const end = el?.selectionEnd ?? draft.length;
      handleDraftChange(draft.slice(0, start) + emoji + draft.slice(end));
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    },
    [draft, handleDraftChange]
  );

  // Tages-Gruppen + Bubble-Gruppierung (gleicher Absender, < 5 Minuten Abstand)
  const grouped = useMemo(() => {
    const days: Array<{
      day: string;
      items: Array<ChatMessage & { cont: boolean; last: boolean }>;
    }> = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const day = dayLabel(m.timestamp);
      const cont =
        !!prev &&
        prev.senderId === m.senderId &&
        m.timestamp - prev.timestamp < GROUP_WINDOW_MS &&
        dayLabel(prev.timestamp) === day;
      const last =
        !next ||
        next.senderId !== m.senderId ||
        next.timestamp - m.timestamp >= GROUP_WINDOW_MS ||
        dayLabel(next.timestamp) !== day;
      const bucket = days[days.length - 1];
      if (bucket && bucket.day === day) bucket.items.push({ ...m, cont, last });
      else days.push({ day, items: [{ ...m, cont, last }] });
    }
    return days;
  }, [messages]);

  if (!myUid || !partner) return null;
  const canChat = partner.isFriend;

  return (
    <div className="ch-pane-thread" style={{ background: currentTheme.background.default }}>
      {wallpaperId && resolveWallpaper(wallpaperId) && (
        <div
          className="ch-wallpaper"
          style={{ background: resolveWallpaper(wallpaperId)?.css }}
          aria-hidden
        />
      )}
      <div className="ch-thread-bg" aria-hidden />
      <div className="ch-thread-header">
        {showBack && (
          <button
            className="ch-icon-btn"
            onClick={() => {
              hapticTap();
              // Dahin zurück, wo man herkam (Liste, Profil, Activity) —
              // ohne Vorseite (z. B. Push-Deep-Link) in die Chat-Liste.
              const idx =
                typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0;
              if (idx > 0) navigate(-1);
              else navigate('/chats', { replace: true });
            }}
            aria-label={t('Zurück')}
            style={{ color: currentTheme.text.primary }}
          >
            <ArrowBack />
          </button>
        )}
        <ChatAvatar
          name={partner.name}
          photoURL={partner.photoURL}
          small
          online={partner.isOnline}
        />
        <button
          className="ch-thread-title"
          onClick={() => canChat && navigate(`/profile/${friendId}`)}
        >
          <strong style={{ color: currentTheme.text.primary }}>
            {partner.name}
            <NameBadges uid={friendId} />
          </strong>
          <span style={{ color: partner.isOnline ? '#22c55e' : currentTheme.text.muted }}>
            {otherTyping
              ? t('schreibt …')
              : partner.isOnline
                ? t('Online')
                : canChat
                  ? t('Zum Profil')
                  : t('Kein Freund mehr')}
          </span>
        </button>
        <button
          className="ch-icon-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t('Chat-Optionen')}
          aria-expanded={menuOpen}
          style={{ color: currentTheme.text.primary }}
        >
          <MoreVert />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="ch-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ color: currentTheme.text.primary }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setDesignOpen(true);
                }}
              >
                {t('Design & Hintergrund')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm('report');
                }}
              >
                {t('Nachrichten melden')}
              </button>
              <button onClick={toggleBlock}>
                {iBlocked ? t('Chat entsperren') : t('Chat blockieren')}
              </button>
              <button
                style={{ color: currentTheme.status.error }}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm('delete');
                }}
              >
                {t('Chat löschen')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ch-messages" ref={listRef} onClick={() => setMenuOpen(false)}>
        {messages.length === 0 && (
          <div className="ch-empty" style={{ color: currentTheme.text.muted }}>
            <h3 style={{ color: currentTheme.text.primary }}>
              {t('Sag hallo zu {name}!', { name: partner.name })}
            </h3>
            <p>
              {t(
                'Nachrichten sind nur für euch beide sichtbar. Sei freundlich — Meldungen prüfen wir ernsthaft.'
              )}
            </p>
          </div>
        )}
        {grouped.map((group) => (
          <div key={group.day} style={{ display: 'contents' }}>
            <span className="ch-day" style={{ color: currentTheme.text.muted }}>
              {group.day}
            </span>
            {group.items.map((m) => {
              const own = m.senderId === myUid;
              const msgReactions = Object.values(reactions[m.id] || {});
              return (
                <div key={m.id} className={`ch-bubble-wrap${own ? ' ch-bubble-wrap--own' : ''}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`ch-bubble ${own ? 'ch-bubble--own' : 'ch-bubble--other'}${m.cont ? ' ch-bubble--cont' : ''}${m.stickerId || m.imageUrl ? ' ch-bubble--media' : ''}`}
                    onDoubleClick={() => toggleHeart(m.id)}
                    style={(() => {
                      if (m.stickerId || m.imageUrl) return undefined;
                      const s = own ? myStyle : null;
                      if (s) {
                        return {
                          background: `linear-gradient(135deg, ${s.c1}, ${s.c2})`,
                          color: bubbleTextColor(s.c1, s.c2),
                          '--bub-r': `${RADIUS_PX[s.r]}px`,
                        } as React.CSSProperties;
                      }
                      return own
                        ? {
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                          }
                        : { color: currentTheme.text.primary };
                    })()}
                  >
                    {m.imageUrl ? (
                      <>
                        <img
                          className="ch-image"
                          src={m.imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={
                            m.imageWidth && m.imageHeight
                              ? { aspectRatio: `${m.imageWidth} / ${m.imageHeight}` }
                              : undefined
                          }
                          onLoad={() => {
                            // Bild ohne bekannte Maße wächst beim Laden — nachführen,
                            // aber nur wenn man ohnehin (fast) unten ist, sonst reißt
                            // es den Lese-Scroll weg.
                            const el = listRef.current;
                            if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
                              el.scrollTop = el.scrollHeight;
                            }
                          }}
                          onClick={() => setLightboxUrl(m.imageUrl || null)}
                        />
                        {m.text && (
                          <div
                            className="ch-image-caption"
                            style={{ color: currentTheme.text.primary }}
                          >
                            {m.text}
                          </div>
                        )}
                      </>
                    ) : m.stickerId && isValidStickerId(m.stickerId) ? (
                      <StickerCanvas stickerId={m.stickerId} size={150} />
                    ) : (
                      m.text
                    )}
                    <span className="ch-bubble-time">
                      {new Date(m.timestamp).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </motion.div>
                  {msgReactions.length > 0 && (
                    <motion.button
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="ch-reactions"
                      onClick={() => toggleHeart(m.id)}
                      aria-label={t('Reaktion')}
                    >
                      {[...new Set(msgReactions)].join('')}
                      {msgReactions.length > 1 ? ` ${msgReactions.length}` : ''}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {otherTyping && (
          <div className="ch-typing" style={{ color: currentTheme.text.primary }} aria-hidden>
            <i />
            <i />
            <i />
          </div>
        )}
      </div>

      {chatFrozen ? (
        <div className="ch-blocked-banner" style={{ color: currentTheme.text.muted }}>
          <span>
            {iBlocked ? t('Du hast diesen Chat blockiert.') : t('Dieser Chat wurde blockiert.')}
          </span>
          {iBlocked && (
            <button
              onClick={toggleBlock}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              }}
            >
              {t('Entsperren')}
            </button>
          )}
        </div>
      ) : canChat ? (
        <div className="ch-input-bar">
          <AnimatePresence>
            {emojiOpen && <ChatComposerPicker onEmoji={insertEmoji} onSticker={sendSticker} />}
          </AnimatePresence>
          <button
            className="ch-icon-btn"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label={t('Emojis')}
            aria-expanded={emojiOpen}
            style={{ color: emojiOpen ? currentTheme.primary : currentTheme.text.muted }}
          >
            <InsertEmoticonOutlined />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) openImagePreview(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <button
            className="ch-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            aria-label={t('Bild senden')}
            style={{
              color: uploadingImage ? currentTheme.primary : currentTheme.text.muted,
              opacity: uploadingImage ? 0.6 : 1,
            }}
          >
            <ImageOutlined className={uploadingImage ? 'ch-upload-pulse' : undefined} />
          </button>
          <textarea
            ref={inputRef}
            className="ch-input"
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            placeholder={t('Nachricht an {name} …', { name: partner.name })}
            onChange={(e) => handleDraftChange(e.target.value)}
            onPaste={(e) => {
              const files = e.clipboardData?.files;
              const html = e.clipboardData?.getData('text/html') || '';
              const gifUrl = /<img[^>]+src="([^"]+\.gif[^"]*)"/i.exec(html)?.[1] || null;
              const file =
                files && files.length > 0
                  ? Array.from(files).find((f) => f.type.startsWith('image/')) || null
                  : null;
              if (file || gifUrl) {
                e.preventDefault();
                void handlePastedImage(file, gifUrl);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                e.preventDefault();
                void handleSend();
              }
            }}
            style={{ color: currentTheme.text.primary }}
          />
          <button
            className="ch-send-btn"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
            aria-label={t('Senden')}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            }}
          >
            <Send style={{ fontSize: 20, transform: 'translateX(1px)' }} />
          </button>
        </div>
      ) : (
        <div className="ch-blocked-banner" style={{ color: currentTheme.text.muted }}>
          <span>{t('Ihr müsst Freunde sein, um zu chatten.')}</span>
        </div>
      )}

      <AnimatePresence>
        {pendingImage && (
          <motion.div
            className="ch-imgpreview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label={t('Bild senden')}
          >
            <button
              className="ch-icon-btn ch-imgpreview-close"
              onClick={closeImagePreview}
              aria-label={t('Schließen')}
              style={{ color: '#fff' }}
            >
              <ArrowBack />
            </button>
            <div className="ch-imgpreview-stage">
              <img src={pendingImage.url} alt="" />
            </div>
            <div className="ch-imgpreview-bar">
              <input
                type="text"
                value={caption}
                maxLength={500}
                placeholder={t('Bildunterschrift hinzufügen …')}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void confirmSendImage();
                  }
                }}
                autoFocus={!('ontouchstart' in window)}
              />
              <button
                className="ch-send-btn"
                onClick={() => void confirmSendImage()}
                disabled={uploadingImage}
                aria-label={t('Senden')}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  opacity: uploadingImage ? 0.6 : 1,
                }}
              >
                <Send
                  className={uploadingImage ? 'ch-upload-pulse' : undefined}
                  style={{ fontSize: 20, transform: 'translateX(1px)' }}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            className="ch-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            role="dialog"
            aria-label={t('Bild')}
          >
            <img src={lightboxUrl} alt="" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {designOpen && (
          <ChatDesignSheet
            myUid={myUid}
            myStyle={myStyle}
            wallpaperId={wallpaperId}
            onClose={() => setDesignOpen(false)}
            onSaveStyle={(style) => {
              if (!myUid) return;
              void saveBubbleStyle(myUid, style).catch(() => {});
            }}
            onSelectWallpaper={(id) => {
              if (!myUid || !pairId) return;
              setWallpaperId(id);
              void setChatWallpaper(myUid, pairId, id).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      <Dialog
        open={confirm === 'report'}
        onClose={() => setConfirm(null)}
        title={t('Nachrichten melden')}
        message={t(
          'Die letzten Nachrichten dieses Chats werden zur Prüfung an die Moderation übermittelt. Fortfahren?'
        )}
        type="warning"
        actions={[
          { label: t('Abbrechen'), onClick: () => setConfirm(null), variant: 'secondary' },
          { label: t('Melden'), onClick: () => void handleReport(), variant: 'primary' },
        ]}
      />
      <Dialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title={t('Chat löschen')}
        message={t(
          'Der komplette Verlauf wird für beide Seiten endgültig gelöscht. Das kann nicht rückgängig gemacht werden.'
        )}
        type="warning"
        actions={[
          { label: t('Abbrechen'), onClick: () => setConfirm(null), variant: 'secondary' },
          { label: t('Endgültig löschen'), onClick: () => void handleDelete(), variant: 'primary' },
        ]}
      />
    </div>
  );
};
