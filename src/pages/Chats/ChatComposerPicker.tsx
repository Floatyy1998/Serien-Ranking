import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { StickerCanvas } from './StickerCanvas';
import { STICKER_IDS } from './stickers';

// Kuratiertes Set für den Emoji-Tab — Tastatur-Emojis gehen natürlich auch.
const EMOJI_SET = [
  '😂',
  '🤣',
  '😊',
  '😍',
  '🥰',
  '😎',
  '🤩',
  '😅',
  '😉',
  '🙃',
  '😭',
  '🥺',
  '😤',
  '😱',
  '🤯',
  '🥳',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '💔',
  '❤️‍🔥',
  '✨',
  '⭐',
  '🔥',
  '💯',
  '🎉',
  '👀',
  '💀',
  '👍',
  '👎',
  '👏',
  '🙌',
  '🤝',
  '💪',
  '🙏',
  '🤞',
  '✌️',
  '🫶',
  '😴',
  '🤔',
  '🍿',
  '🎬',
  '📺',
  '🎧',
];

type Tab = 'emoji' | 'sticker';

export const ChatComposerPicker = ({
  onEmoji,
  onSticker,
}: {
  onEmoji: (emoji: string) => void;
  onSticker: (stickerId: string) => void;
}) => {
  const { currentTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('emoji');

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'emoji', label: t('Emojis') },
    { id: 'sticker', label: t('Sticker') },
  ];

  return (
    <motion.div
      className="ch-picker"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      <div className="ch-picker-tabs">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={tab === x.id ? 'is-active' : ''}
            style={
              tab === x.id
                ? { color: currentTheme.primary, borderColor: currentTheme.primary }
                : { color: currentTheme.text.muted }
            }
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'emoji' && (
        <div className="ch-emoji-grid">
          {EMOJI_SET.map((emoji) => (
            <button key={emoji} onClick={() => onEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {tab === 'sticker' && (
        <div className="ch-sticker-grid">
          {STICKER_IDS.map((id) => (
            <button key={id} onClick={() => onSticker(id)}>
              <StickerCanvas stickerId={id} size={64} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
