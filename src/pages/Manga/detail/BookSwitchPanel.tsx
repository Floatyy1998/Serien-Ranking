import { LibraryBooks, SwapHoriz } from '@mui/icons-material';
import { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { mangaStandLabel } from '../../../lib/manga/progress';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Manga } from '../../../types/Manga';
import { ManageConfirm } from './ManageConfirm';
import { Section } from './Section';

interface BookSwitchPanelProps {
  manga: Manga;
  currentTheme: ThemeContextType['currentTheme'];
  busy: boolean;
  /** Buchseite wird gesucht (Band 1). */
  opening: boolean;
  onMoveToBooks: () => void;
  onOpenBook: () => void;
}

/** Gegenstück zu „Das ist ein Manga" auf der Buchseite: Print-Manga zurück zu den Büchern. */
export const BookSwitchPanel = ({
  manga,
  currentTheme,
  busy,
  opening,
  onMoveToBooks,
  onOpenBook,
}: BookSwitchPanelProps) => {
  const [confirming, setConfirming] = useState(false);
  const bookCount = Object.keys(manga.fromBooks ?? {}).length;
  const subline =
    bookCount === 1
      ? t('1 Band aus deinen Büchern')
      : bookCount > 1
        ? t('{n} Bände aus deinen Büchern', { n: bookCount })
        : mangaStandLabel(manga, true);

  return (
    <Section
      delay={0.06}
      order={1}
      className="md-book-switch"
      style={{
        borderColor: `${currentTheme.primary}55`,
        background: `linear-gradient(150deg, ${currentTheme.primary}1f, var(--glass-light) 60%)`,
      }}
    >
      <h2 className="md-book-switch-title" style={{ color: currentTheme.text.secondary }}>
        <LibraryBooks style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Gedruckte Bände')}
      </h2>
      <div className="md-book-switch-main">
        <div className="md-book-switch-body">
          {manga.poster ? <img src={manga.poster} alt="" /> : null}
          <div style={{ minWidth: 0 }}>
            <div className="md-book-switch-name" style={{ color: currentTheme.text.secondary }}>
              {manga.title}
            </div>
            {subline ? (
              <div className="md-book-switch-sub" style={{ color: currentTheme.primary }}>
                {subline}
              </div>
            ) : null}
            <div className="md-book-switch-text" style={{ color: currentTheme.text.muted }}>
              {t('Bei deinen Büchern führst du jeden Band einzeln, mit Seiten und Lesedatum.')}
            </div>
          </div>
        </div>
        <div className="md-book-switch-actions">
          {confirming ? (
            <ManageConfirm
              question={t(
                'Zurück zu den Büchern? Der Manga verschwindet mit Lesestand und Bewertung.'
              )}
              tone={currentTheme.primary}
              onConfirm={() => {
                setConfirming(false);
                onMoveToBooks();
              }}
              onCancel={() => setConfirming(false)}
            />
          ) : (
            <div className="md-book-switch-buttons">
              <button
                type="button"
                className="md-book-switch-cta"
                disabled={busy}
                onClick={() => setConfirming(true)}
                style={{
                  color: getOptimalTextColor(currentTheme.primary),
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <SwapHoriz style={{ fontSize: 18 }} />
                {t('Als Buch führen')}
              </button>
              <button
                type="button"
                className="md-book-switch-cta md-book-switch-cta--ghost"
                disabled={opening}
                onClick={onOpenBook}
                style={{ color: currentTheme.text.secondary, opacity: opening ? 0.6 : 1 }}
              >
                {t('Zum Buch')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};
