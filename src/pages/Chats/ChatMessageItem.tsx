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
  onRevealSpoiler: (id: string) => void;
  onToggleHeart: (id: string) => void;
  onReply: (m: ChatMessage) => void;
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
    onRevealSpoiler,
    onToggleHeart,
    onReply,
    onJump,
    onLink,
    onOpenImage,
  }: ChatMessageItemProps) => {
    const { currentTheme } = useTheme();
    const own = m.senderId === myUid;
    const quoted = m.replyTo;
    const media = !!(m.stickerId || m.imageUrl);

    const bubbleStyle = ((): React.CSSProperties | undefined => {
      if (media) return undefined;
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

    return (
      <div
        data-msg-id={m.id}
        className={`ch-bubble-wrap${own ? ' ch-bubble-wrap--own' : ''}${flash ? ' ch-bubble-wrap--flash' : ''}`}
      >
        <ChatSwipeRow cont={m.cont} onReply={() => onReply(m)}>
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`ch-bubble ${own ? 'ch-bubble--own' : 'ch-bubble--other'}${m.cont ? ' ch-bubble--cont' : ''}${media ? ' ch-bubble--media' : ''}`}
            onDoubleClick={() => onToggleHeart(m.id)}
            style={bubbleStyle}
          >
            {quoted && (
              <ChatReplyQuote
                reply={quoted}
                author={quoted.senderId === myUid ? t('Du') : partnerName}
                mine={quoted.senderId === myUid}
                original={quotedOriginal}
                onJump={() => onJump(quoted.id)}
              />
            )}
            {m.episode ? (
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
            <span className="ch-bubble-time">
              {new Date(m.timestamp).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </motion.div>
        </ChatSwipeRow>
        {reactions.length > 0 && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ch-reactions"
            onClick={() => onToggleHeart(m.id)}
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
