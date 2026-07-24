import CloseRounded from '@mui/icons-material/CloseRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { BubbleRadius, ChatBubbleStyle } from '../../services/chat/chatAppearance';
import { BUBBLE_PRESETS, bubbleTextColor, CHAT_WALLPAPERS, RADIUS_PX } from './chatWallpapers';

const RADIUS_OPTIONS: Array<{ id: BubbleRadius; label: string }> = [
  { id: 'round', label: t('Rund') },
  { id: 'soft', label: t('Weich') },
  { id: 'sharp', label: t('Kantig') },
];

export const ChatDesignSheet = ({
  myStyle,
  wallpaperId,
  onSaveStyle,
  onSelectWallpaper,
  onClose,
}: {
  myStyle: ChatBubbleStyle | null;
  wallpaperId: string | null;
  onSaveStyle: (style: ChatBubbleStyle | null) => void;
  onSelectWallpaper: (id: string | null) => void;
  onClose: () => void;
}) => {
  const { currentTheme } = useTheme();
  const themeDefault: ChatBubbleStyle = {
    c1: currentTheme.primary,
    c2: currentTheme.secondary,
    r: 'round',
  };
  const [draft, setDraft] = useState<ChatBubbleStyle>(myStyle || themeDefault);
  const isCustom = !!myStyle;

  useEffect(() => {
    if (myStyle) setDraft(myStyle);
  }, [myStyle]);

  const apply = (next: ChatBubbleStyle) => {
    setDraft(next);
    onSaveStyle(next);
  };

  const previewText = bubbleTextColor(draft.c1, draft.c2);

  return (
    <div className="ch-design-overlay" onClick={onClose}>
      <motion.div
        className="ch-design-sheet"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        style={{ color: currentTheme.text.primary }}
      >
        <div className="ch-design-head">
          <h2>{t('Chat-Design')}</h2>
          <button className="ch-icon-btn" onClick={onClose} aria-label={t('Schließen')}>
            <CloseRounded style={{ fontSize: 22, color: currentTheme.text.muted }} />
          </button>
        </div>

        <div className="ch-design-scroll">
          <h3 style={{ color: currentTheme.text.muted }}>{t('Deine Bubbles')}</h3>
          <p className="ch-design-hint" style={{ color: currentTheme.text.muted }}>
            {t('Dein Design sehen auch deine Freunde — es ist Teil deines Stils.')}
          </p>

          <div className="ch-design-preview">
            <span
              style={{
                background: `linear-gradient(135deg, ${draft.c1}, ${draft.c2})`,
                color: previewText,
                borderRadius: RADIUS_PX[draft.r],
              }}
            >
              {t('So sehen deine Nachrichten aus')}
            </span>
          </div>

          <div className="ch-design-swatches">
            <button
              className={`ch-design-swatch ch-design-swatch--reset${!isCustom ? ' is-active' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${themeDefault.c1}, ${themeDefault.c2})`,
              }}
              onClick={() => {
                setDraft(themeDefault);
                onSaveStyle(null);
              }}
              title={t('Theme-Standard')}
              aria-label={t('Theme-Standard')}
            />
            {BUBBLE_PRESETS.map((p) => (
              <button
                key={p.c1}
                className={`ch-design-swatch${isCustom && draft.c1 === p.c1 && draft.c2 === p.c2 ? ' is-active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                onClick={() => apply({ ...draft, c1: p.c1, c2: p.c2 })}
                aria-label={`${p.c1} ${p.c2}`}
              />
            ))}
          </div>

          <div className="ch-design-row">
            <label>
              {t('Eigene Farben')}
              <span className="ch-design-colors">
                <input
                  type="color"
                  value={draft.c1}
                  onChange={(e) => apply({ ...draft, c1: e.target.value })}
                  aria-label={t('Farbe 1')}
                />
                <input
                  type="color"
                  value={draft.c2}
                  onChange={(e) => apply({ ...draft, c2: e.target.value })}
                  aria-label={t('Farbe 2')}
                />
              </span>
            </label>
            <div className="ch-design-radius">
              {RADIUS_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  className={draft.r === o.id ? 'is-active' : ''}
                  style={
                    draft.r === o.id
                      ? { color: currentTheme.primary, borderColor: currentTheme.primary }
                      : { color: currentTheme.text.muted }
                  }
                  onClick={() => apply({ ...draft, r: o.id })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <h3 style={{ color: currentTheme.text.muted }}>{t('Chat-Hintergrund')}</h3>
          <p className="ch-design-hint" style={{ color: currentTheme.text.muted }}>
            {t('Nur du siehst den Hintergrund — pro Chat wählbar.')}
          </p>

          <div className="ch-design-walls">
            <button
              className={`ch-design-wall${!wallpaperId ? ' is-active' : ''}`}
              style={{ background: currentTheme.background.default }}
              onClick={() => onSelectWallpaper(null)}
            >
              <span style={{ color: currentTheme.text.muted }}>{t('Standard')}</span>
            </button>
            {CHAT_WALLPAPERS.map((w) => (
              <button
                key={w.id}
                className={`ch-design-wall${wallpaperId === w.id ? ' is-active' : ''}`}
                style={{ background: w.css }}
                onClick={() => onSelectWallpaper(w.id)}
                title={w.name}
                aria-label={w.name}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
