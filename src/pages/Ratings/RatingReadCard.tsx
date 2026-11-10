import { Album, Star } from '@mui/icons-material';
import React, { useRef } from 'react';
import { SelectCheck } from '../../components/ui/selection/SelectionBar';
import type { useTheme } from '../../contexts/ThemeContext';
import { useDrawInProgress } from '../../hooks/ui/useDrawInProgress';
import type { useLongPress } from '../../hooks/ui/useLongPress';
import type { LibraryItem, LibraryKind } from '../../lib/reading/library';
import { t } from '../../services/i18n';
import { BookCover } from '../Books/components/BookCover';
import { STATUS_LABELS } from '../Books/helpers';

type Theme = ReturnType<typeof useTheme>['currentTheme'];
type PressProps = ReturnType<ReturnType<typeof useLongPress<string>>>;

const KIND_LABEL: Record<LibraryKind, string> = {
  book: '',
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
};

interface RatingReadCardProps {
  item: LibraryItem;
  theme: Theme;
  onOpen: () => void;
  /** Gesetzt, solange die Mehrfachauswahl läuft. */
  selected?: boolean;
  pressProps?: PressProps;
}

/** Buch oder Manga im Bewertungs-Look (Fortschrittsring, Wertung, Status). */
export const RatingReadCard = React.memo<RatingReadCardProps>(
  ({ item, theme, onOpen, selected, pressProps }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const done = item.status === 'completed';
    const ring = done ? 100 : item.status === 'reading' ? item.progress : 0;
    useDrawInProgress(cardRef, ring);
    const meta = item.book ? item.author : KIND_LABEL[item.kind];
    const statusText =
      item.status === 'reading' && ring > 0 ? `${ring}%` : STATUS_LABELS[item.status]?.();
    const selecting = selected !== undefined;

    return (
      <div
        {...pressProps}
        className={`ratings-grid-item${selected ? ' sel-picked' : ''}`}
        role={selecting ? 'checkbox' : 'button'}
        aria-checked={selected}
        tabIndex={0}
        aria-label={item.title}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        style={{ '--sel-color': theme.primary } as React.CSSProperties}
      >
        <div
          ref={cardRef}
          className={`ratings-card${
            ring > 0 ? ` ratings-card--ring${ring === 100 ? ' ratings-card--ring-done' : ''}` : ''
          }`}
          style={
            {
              '--ring-color': ring === 100 ? theme.status.success : theme.primary,
            } as React.CSSProperties
          }
        >
          {selecting && <SelectCheck on={!!selected} />}
          {item.book ? (
            <BookCover book={item.book} size="L" className="ratings-book-cover" />
          ) : (
            <img
              src={item.manga?.poster}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="ratings-book-cover"
            />
          )}
          <div className="ratings-card-overlay">
            <div className="ratings-card-top">
              <div className="ratings-card-top-left" />
              <div className="ratings-card-top-right">
                {item.owned && !selecting && (
                  <div
                    className="ratings-card-watchlist-badge"
                    title={t('Im Besitz')}
                    style={{ background: `${theme.status.success}dd` }}
                  >
                    <Album style={{ fontSize: '13px', color: '#fff' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="ratings-card-bottom">
              <h2 className="ratings-card-title">{item.title}</h2>
              <div className="ratings-card-meta">
                {item.rating > 0 && (
                  <span className="ratings-card-rating" style={{ color: theme.status.warning }}>
                    <Star className="ratings-card-meta-icon" />
                    {item.rating.toFixed(1)}
                  </span>
                )}
                {item.rating > 0 && meta && <span className="ratings-card-dot">&bull;</span>}
                {meta && <span className="ratings-card-genres">{meta}</span>}
              </div>
              {statusText && (
                <div className="ratings-card-progress">
                  <span
                    className="ratings-card-progress-text"
                    style={{
                      color: done
                        ? theme.status.success
                        : ring > 0
                          ? theme.primary
                          : theme.text.muted,
                    }}
                  >
                    {statusText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RatingReadCard.displayName = 'RatingReadCard';
