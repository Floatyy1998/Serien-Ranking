import Close from '@mui/icons-material/Close';
import PushPinRounded from '@mui/icons-material/PushPinRounded';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChatReply } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { ReplySnippet } from './ChatReply';

export const ChatPinnedBar = ({
  pinned,
  onJump,
  onUnpin,
}: {
  pinned: ChatReply;
  onJump: () => void;
  onUnpin: () => void;
}) => {
  const { currentTheme } = useTheme();
  return (
    <motion.div
      className="ch-pinned"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <button type="button" className="ch-pinned-main" onClick={onJump}>
        <PushPinRounded style={{ color: currentTheme.primary }} />
        <span className="ch-pinned-text">
          <small style={{ color: currentTheme.primary }}>{t('Fixierte Nachricht')}</small>
          <span className="ch-pinned-snippet" style={{ color: currentTheme.text.primary }}>
            <ReplySnippet reply={pinned} />
          </span>
        </span>
      </button>
      <button
        type="button"
        className="ch-icon-btn"
        onClick={onUnpin}
        aria-label={t('Lösen')}
        title={t('Lösen')}
        style={{ color: currentTheme.text.muted }}
      >
        <Close style={{ fontSize: 18 }} />
      </button>
    </motion.div>
  );
};
