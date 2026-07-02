import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';

const MAX_MESSAGE_LENGTH = 240;

interface RecommendMessageInputProps {
  message: string;
  onMessageChange: (value: string) => void;
}

/** Optionales Nachricht-Feld mit Zeichenzähler (max. 240 Zeichen). */
export const RecommendMessageInput: React.FC<RecommendMessageInputProps> = ({
  message,
  onMessageChange,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  const [messageFocused, setMessageFocused] = useState(false);

  return (
    <div style={{ marginTop: isMobile ? 26 : 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 4,
            height: 16,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${currentTheme.accent}, ${currentTheme.primary})`,
          }}
        />
        <div
          style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: currentTheme.text.primary,
          }}
        >
          Nachricht{' '}
          <span
            style={{
              opacity: 0.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}
          >
            · optional
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          borderRadius: 18,
          background: `${currentTheme.background.surface}cc`,
          border: messageFocused
            ? `1px solid ${currentTheme.primary}55`
            : `1px solid ${currentTheme.border.default}`,
          padding: '14px 16px 10px',
          backdropFilter: 'var(--blur-sm)',
          WebkitBackdropFilter: 'var(--blur-sm)',
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
      >
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onFocus={() => setMessageFocused(true)}
          onBlur={() => setMessageFocused(false)}
          placeholder="Sag was dazu…"
          rows={isMobile ? 2 : 3}
          style={{
            width: '100%',
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: currentTheme.text.primary,
            fontSize: 14,
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 11,
            color:
              message.length > MAX_MESSAGE_LENGTH - 30
                ? currentTheme.status?.warning || '#f59e0b'
                : currentTheme.text.muted,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {message.length}/{MAX_MESSAGE_LENGTH}
        </div>
      </div>
    </div>
  );
};
