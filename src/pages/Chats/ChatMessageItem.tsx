import BlockRounded from '@mui/icons-material/BlockRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import DoneRounded from '@mui/icons-material/DoneRounded';
import ShortcutRounded from '@mui/icons-material/ShortcutRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChatBubbleStyle } from '../../services/chat/chatAppearance';
import type { ChatMessage } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { bubbleTextColor, RADIUS_PX } from './chatWallpapers';
import { ChatMessageText } from './ChatMessageText';
import { ChatReplyQuote } from './ChatReply';
import { ChatSwipeRow } from './ChatSwipeRow';
import { EpisodeShareCard } from './EpisodeShareCard';
import { StickerCanvas } from './StickerCanvas';
import { isValidStickerId } from './stickers';

interface ChatMessageItemProps {
  message: ChatMessage & { cont: boolean };
  myUid: string;
  partnerName: string;
  myStyle: ChatBubbleStyle | null;
  reactions: string[];
  spoilerRevealed: boolean;
  flash: boolean;
  quotedOriginal?: ChatMessage;
  canReply: boolean;
  starred: boolean;
  receipt: 'sent' | 'read' | null;
  selecting: boolean;
  selected: boolean;
  highlighted: boolean;
  onRevealSpoiler: (id: string) => void;
  onToggleHeart: (id: string) => void;
  onReply: (m: ChatMessage) => void;
  onMenu: (m: ChatMessage) => void;
  onToggleSelect: (id: string) => void;
  onJump: (id: string) => void;
  onLink: (href: string) => void;
  onOpenImage: (url: string) => void;
}

export const ChatMessageItem = memo(
  ({
    message: m,
    myUid,
    partnerName,
    myStyle,
    reactions,
    spoilerRevealed,
    flash,
    quotedOriginal,
    canReply,
    starred,
    receipt,
    selecting,
    selected,
    highlighted,
    onRevealSpoiler,
    onToggleHeart,
    onReply,
    onMenu,
    onToggleSelect,
    onJump,
    onLink,
    onOpenImage,
  }: ChatMessageItemProps) => {
    const { currentTheme } = useTheme();
    const own = m.senderId === myUid;
    const quoted = m.deleted ? undefined : m.replyTo;
    const media = !m.deleted && !!(m.stickerId || m.imageUrl);

    const bubbleStyle = ((): React.CSSProperties | undefined => {
      if (media) return undefined;
      if (m.deleted) return { color: currentTheme.text.muted };
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
    })();

    const spoilerCover = (extraClass = '') => (
      <button className={`ch-spoiler-cover${extraClass}`} onClick={() => onRevealSpoiler(m.id)}>
        <VisibilityOffOutlined style={{ fontSize: 16 }} />
        {t('Spoiler — tippen zum Lesen')}
      </button>
    );

    const meta = (
      <span className="ch-bubble-time">
        {starred && <StarRounded className="ch-meta-icon" aria-label={t('Markiert')} />}
        {m.editedAt && !m.deleted && <span className="ch-edited">{t('Bearbeitet')}</span>}
        {new Date(m.timestamp).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        })}
        {receipt &&
          (receipt === 'read' ? (
            <DoneAllRounded className="ch-receipt ch-receipt--read" aria-label={t('Gelesen')} />
          ) : (
            <DoneRounded className="ch-receipt" aria-label={t('Gesendet')} />
          ))}
      </span>
    );

    return (
      <div
        data-msg-id={m.id}
        className={`ch-bubble-wrap${own ? ' ch-bubble-wrap--own' : ''}${flash ? ' ch-bubble-wrap--flash' : ''}${selecting ? ' ch-bubble-wrap--selecting' : ''}${selected || highlighted ? ' ch-bubble-wrap--selected' : ''}`}
        onClickCapture={(e) => {
          if (!selecting) return;
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect(m.id);
        }}
      >
        {selecting && (
          <span className={`ch-select-dot${selected ? ' is-on' : ''}`} aria-hidden>
            {selected && <CheckRounded />}
          </span>
        )}
        <ChatSwipeRow
          cont={m.cont}
          canReply={canReply && !m.deleted && !selecting}
          onReply={() => onReply(m)}
          onMenu={() => (selecting ? onToggleSelect(m.id) : onMenu(m))}
        >
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`ch-bubble ${own ? 'ch-bubble--own' : 'ch-bubble--other'}${m.cont ? ' ch-bubble--cont' : ''}${media ? ' ch-bubble--media' : ''}${m.deleted ? ' ch-bubble--deleted' : ''}`}
            onDoubleClick={() => !m.deleted && !selecting && onToggleHeart(m.id)}
            style={bubbleStyle}
          >
            {m.forwarded && !m.deleted && (
              <span className="ch-forwarded">
                <ShortcutRounded />
                {t('Weitergeleitet')}
              </span>
            )}
            {quoted && (
              <ChatReplyQuote
                reply={quoted}
                author={quoted.senderId === myUid ? t('Du') : partnerName}
                mine={quoted.senderId === myUid}
                original={quotedOriginal}
                onJump={() => onJump(quoted.id)}
              />
            )}
            {m.deleted ? (
              <span className="ch-deleted">
                <BlockRounded />
                {own
                  ? t('Du hast diese Nachricht gelöscht.')
                  : t('Diese Nachricht wurde gelöscht.')}
              </span>
            ) : m.episode ? (
              <>
                <EpisodeShareCard episode={m.episode} own={own} />
                {m.text &&
                  (m.isSpoiler && !own && !spoilerRevealed ? (
                    spoilerCover(' ch-episode-note')
                  ) : (
                    <div className="ch-episode-note">
                      <ChatMessageText text={m.text} onLink={onLink} />
                    </div>
                  ))}
              </>
            ) : m.imageUrl ? (
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
                  onClick={() => m.imageUrl && onOpenImage(m.imageUrl)}
                />
                {m.text && (
                  <div className="ch-image-caption" style={{ color: currentTheme.text.primary }}>
                    <ChatMessageText text={m.text} onLink={onLink} />
                  </div>
                )}
              </>
            ) : m.stickerId && isValidStickerId(m.stickerId) ? (
              <StickerCanvas stickerId={m.stickerId} size={150} />
            ) : m.isSpoiler && !own && !spoilerRevealed ? (
              spoilerCover()
            ) : m.isSpoiler ? (
              <>
                <span className="ch-spoiler-own">
                  <VisibilityOffOutlined style={{ fontSize: 12 }} />
                  {t('Als Spoiler gesendet')}
                </span>
                <ChatMessageText text={m.text} onLink={onLink} />
              </>
            ) : (
              <ChatMessageText text={m.text} onLink={onLink} />
            )}
            {meta}
          </motion.div>
        </ChatSwipeRow>
        {reactions.length > 0 && !m.deleted && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ch-reactions"
            onClick={() => onMenu(m)}
            aria-label={t('Reaktion')}
          >
            {[...new Set(reactions)].join('')}
            {reactions.length > 1 ? ` ${reactions.length}` : ''}
          </motion.button>
        )}
      </div>
    );
  }
);
ChatMessageItem.displayName = 'ChatMessageItem';
