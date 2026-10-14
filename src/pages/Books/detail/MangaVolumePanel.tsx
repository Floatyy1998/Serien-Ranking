import { Add, AutoStories, ChevronRight, SwapHoriz } from '@mui/icons-material';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { MangaLink } from '../../../lib/books/mangaVolume';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface Props {
  link: MangaLink;
  /** Der Band liegt schon als Buch in der Sammlung. */
  savedAsBook: boolean;
  busy: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onMove: () => void;
}

/** Ersetzt „In deine Bücher", wenn das Buch ein Manga-Band ist — führt zur Reihe bei den Manga. */
export const MangaVolumePanel: React.FC<Props> = ({
  link,
  savedAsBook,
  busy,
  onOpen,
  onAdd,
  onMove,
}) => {
  const { currentTheme } = useTheme();
  const title = link.manga.title.english || link.manga.title.romaji;
  const primary = savedAsBook
    ? { label: t('Als Manga führen'), icon: <SwapHoriz style={{ fontSize: 18 }} />, run: onMove }
    : link.owned
      ? { label: t('Zum Manga'), icon: <ChevronRight style={{ fontSize: 18 }} />, run: onOpen }
      : {
          label: t('Zu deinen Manga hinzufügen'),
          icon: <Add style={{ fontSize: 18 }} />,
          run: onAdd,
        };

  return (
    <div
      className="bd-panel"
      style={{
        borderColor: `${currentTheme.primary}55`,
        background: `linear-gradient(150deg, ${currentTheme.primary}1f, var(--glass-light) 60%)`,
      }}
    >
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        <AutoStories style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Das ist ein Manga')}
      </h2>
      <div className="bd-manga-link">
        <img src={link.manga.coverImage.medium || link.manga.coverImage.large} alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="bd-manga-link-title" style={{ color: currentTheme.text.secondary }}>
            {title}
          </div>
          {link.volume ? (
            <div className="bd-manga-link-volume" style={{ color: currentTheme.primary }}>
              {t('Manga · Band {n}', { n: link.volume })}
            </div>
          ) : null}
          <div className="bk-muted" style={{ color: currentTheme.text.muted }}>
            {savedAsBook
              ? t(
                  'Gerade als Buch gespeichert. Bei deinen Manga führst du die ganze Reihe mit Kapitelstand.'
                )
              : link.owned
                ? t('Steht schon bei deinen Manga')
                : t('Bei deinen Manga führst du die ganze Reihe mit Kapitelstand.')}
          </div>
        </div>
      </div>
      <div className="bd-manga-link-actions">
        <button
          type="button"
          className="bk-cta"
          disabled={busy}
          onClick={primary.run}
          style={{
            color: getOptimalTextColor(currentTheme.primary),
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {primary.icon}
          {primary.label}
        </button>
        {primary.run !== onOpen && (
          <button
            type="button"
            className="bk-cta bk-cta--ghost"
            onClick={onOpen}
            style={{ color: currentTheme.text.secondary }}
          >
            {t('Zum Manga')}
          </button>
        )}
      </div>
    </div>
  );
};
