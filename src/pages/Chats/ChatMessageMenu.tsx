import AddRounded from '@mui/icons-material/AddRounded';
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import ReplyRounded from '@mui/icons-material/ReplyRounded';
import ShortcutRounded from '@mui/icons-material/ShortcutRounded';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAndroidBack } from '../../hooks/ui/useAndroidBack';
import { t } from '../../services/i18n';
import { EMOJI_SET } from './chatEmojis';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EDGE_PX = 8;
const GAP_PX = 8;

export interface ChatMessageMenuProps {
  anchor: DOMRect;
  own: boolean;
  deleted: boolean;
  myReaction: string | null;
  starred: boolean;
  pinned: boolean;
  canReply: boolean;
  canCopy: boolean;
  canReact: boolean;
  canEdit: boolean;
  onReact: (emoji: string | null) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onForward: () => void;
  onPin: () => void;
  onStar: () => void;
  onSelect: () => void;
  onReport: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ChatMessageMenu = ({
  anchor,
  own,
  deleted,
  myReaction,
  starred,
  pinned,
  canReply,
  canCopy,
  canReact,
  canEdit,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onForward,
  onPin,
  onStar,
  onSelect,
  onReport,
  onDelete,
  onClose,
}: ChatMessageMenuProps) => {
  const { currentTheme } = useTheme();
  const boxRef = useRef<HTMLDivElement>(null);
  const sawPointerDown = useRef(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [allEmojis, setAllEmojis] = useState(false);

  useAndroidBack(true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  // Unter die Nachricht, wenn Platz ist, sonst darüber, sonst mittig.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const { width, height } = box.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top: number;
    if (anchor.bottom + GAP_PX + height <= vh - EDGE_PX) top = anchor.bottom + GAP_PX;
    else if (anchor.top - GAP_PX - height >= EDGE_PX) top = anchor.top - GAP_PX - height;
    else top = (vh - height) / 2;
    top = Math.min(Math.max(EDGE_PX, top), Math.max(EDGE_PX, vh - height - EDGE_PX));
    const preferred = own ? anchor.right - width : anchor.left;
    const left = Math.min(Math.max(EDGE_PX, preferred), vw - width - EDGE_PX);
    setPos({ top, left });
  }, [anchor, own, allEmojis]);

  const react = (emoji: string) => onReact(myReaction === emoji ? null : emoji);

  const item = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger = false
  ): React.ReactNode => (
    <button
      type="button"
      role="menuitem"
      className="ch-mm-item"
      onClick={onClick}
      style={danger ? { color: currentTheme.status.error } : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return createPortal(
    <div
      className="ch-mm-backdrop"
      // Der Klick, der auf das lange Drücken folgt, darf das Menü nicht gleich wieder schließen
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) sawPointerDown.current = true;
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !sawPointerDown.current) return;
        onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <motion.div
        ref={boxRef}
        className="ch-mm"
        role="menu"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: pos ? 1 : 0, scale: pos ? 1 : 0.96 }}
        transition={{ duration: 0.14 }}
        style={{
          top: pos?.top ?? anchor.bottom,
          left: pos?.left ?? anchor.left,
          transformOrigin: own ? 'top right' : 'top left',
          color: currentTheme.text.primary,
        }}
      >
        {canReact && (
          <div className="ch-mm-reactions">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`ch-mm-emoji${myReaction === emoji ? ' is-mine' : ''}`}
                onClick={() => react(emoji)}
                aria-label={t('Mit {emoji} reagieren', { emoji })}
              >
                {emoji}
              </button>
            ))}
            {myReaction && !QUICK_REACTIONS.includes(myReaction) ? (
              <button
                type="button"
                className="ch-mm-emoji is-mine"
                onClick={() => react(myReaction)}
                aria-label={t('Reaktion entfernen')}
              >
                {myReaction}
              </button>
            ) : (
              <button
                type="button"
                className={`ch-mm-emoji ch-mm-more${allEmojis ? ' is-open' : ''}`}
                onClick={() => setAllEmojis((v) => !v)}
                aria-label={t('Weitere Reaktionen')}
                aria-expanded={allEmojis}
              >
                <AddRounded />
              </button>
            )}
          </div>
        )}
        {canReact && allEmojis && (
          <div className="ch-mm-grid">
            {EMOJI_SET.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`ch-mm-emoji${myReaction === emoji ? ' is-mine' : ''}`}
                onClick={() => react(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="ch-mm-list">
          {!deleted && canReply && item(<ReplyRounded />, t('Antworten'), onReply)}
          {!deleted && canCopy && item(<ContentCopyRounded />, t('Kopieren'), onCopy)}
          {canEdit && item(<EditRounded />, t('Bearbeiten'), onEdit)}
          {!deleted && item(<ShortcutRounded />, t('Weiterleiten'), onForward)}
          {!deleted && item(<PushPinOutlined />, pinned ? t('Lösen') : t('Fixieren'), onPin)}
          {!deleted &&
            item(
              starred ? <StarRounded /> : <StarBorderRounded />,
              starred ? t('Stern entfernen') : t('Mit Stern markieren'),
              onStar
            )}
          {item(<CheckBoxOutlined />, t('Auswählen'), onSelect)}
          <div className="ch-mm-sep" />
          {!own && !deleted && item(<FlagOutlined />, t('Melden'), onReport)}
          {item(<DeleteOutlineRounded />, t('Löschen'), onDelete, true)}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
