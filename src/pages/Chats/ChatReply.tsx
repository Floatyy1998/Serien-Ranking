import Close from '@mui/icons-material/Close';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import LiveTv from '@mui/icons-material/LiveTv';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { motion } from 'framer-motion';
import type { ChatMessage, ChatReply } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { StickerCanvas } from './StickerCanvas';
import { isValidStickerId } from './stickers';

interface ReplyProps {
  reply: ChatReply;
  author: string;
  /** Die zitierte Nachricht stammt von mir — bestimmt die Akzentfarbe. */
  mine: boolean;
  original?: ChatMessage;
}

export const ReplySnippet = ({ reply }: { reply: ChatReply }) => {
  switch (reply.kind) {
    case 'sp':
      return (
        <>
          <VisibilityOffOutlined className="ch-reply-glyph" />
          {t('Spoiler')}
        </>
      );
    case 'img':
      return (
        <>
          <ImageOutlined className="ch-reply-glyph" />
          {reply.text || t('Bild')}
        </>
      );
    case 'st':
      return <>{t('Pet-Sticker')}</>;
    case 'ep':
      return (
        <>
          <LiveTv className="ch-reply-glyph" />
          {reply.text}
        </>
      );
    default:
      return <>{reply.text}</>;
  }
};

const ReplyThumb = ({ reply, original }: Pick<ReplyProps, 'reply' | 'original'>) => {
  if (reply.kind === 'img' && original?.imageUrl) {
    return (
      <img
        className="ch-reply-thumb"
        src={original.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }
  if (reply.kind === 'st' && reply.stickerId && isValidStickerId(reply.stickerId)) {
    return (
      <span className="ch-reply-thumb ch-reply-thumb--sticker">
        <StickerCanvas stickerId={reply.stickerId} size={40} />
      </span>
    );
  }
  return null;
};

const ReplyBody = ({ reply, author, original }: ReplyProps) => (
  <>
    <span className="ch-reply-body">
      <span className="ch-reply-author">{author}</span>
      <span className="ch-reply-text">
        <ReplySnippet reply={reply} />
      </span>
    </span>
    <ReplyThumb reply={reply} original={original} />
  </>
);

export const ChatReplyQuote = ({ onJump, ...props }: ReplyProps & { onJump: () => void }) => (
  <button
    type="button"
    className={`ch-reply-quote${props.mine ? ' ch-reply-quote--mine' : ''}`}
    onClick={(e) => {
      e.stopPropagation();
      onJump();
    }}
    onDoubleClick={(e) => e.stopPropagation()}
  >
    <ReplyBody {...props} />
  </button>
);

export const ChatReplyDraft = ({
  onCancel,
  color,
  mutedColor,
  cancelLabel,
  ...props
}: ReplyProps & {
  onCancel: () => void;
  color: string;
  mutedColor: string;
  cancelLabel?: string;
}) => (
  <motion.div
    className="ch-reply-draft"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.15 }}
  >
    <div
      className={`ch-reply-quote ch-reply-quote--draft${props.mine ? ' ch-reply-quote--mine' : ''}`}
      style={{ color }}
    >
      <ReplyBody {...props} />
    </div>
    <button
      type="button"
      className="ch-reply-cancel"
      onClick={onCancel}
      aria-label={cancelLabel ?? t('Antwort abbrechen')}
      style={{ color: mutedColor }}
    >
      <Close style={{ fontSize: 20 }} />
    </button>
  </motion.div>
);
