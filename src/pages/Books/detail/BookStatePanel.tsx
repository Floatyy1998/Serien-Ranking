import {
  AutoStories,
  Block,
  Bookmark,
  CheckCircle,
  Edit,
  PauseCircle,
  Replay,
  Star,
} from '@mui/icons-material';
import React, { useState } from 'react';
import { QuickRatingSheet } from '../../../components/ui/overlay/QuickRatingSheet';
import { useTheme } from '../../../contexts/ThemeContext';
import { progressPercent, remainingHours } from '../../../lib/books/bookProgress';
import { dateLocale, t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Book, BookStatus } from '../../../types/Book';
import { formatHours, STATUS_LABELS } from '../helpers';

interface Props {
  book: Book;
  onStatus: (status: BookStatus) => void;
  onQuickAdd: (pages: number) => void;
  onOpenProgress: () => void;
  onRate: (rating: number) => void;
}

const STATUS_ICONS: Record<BookStatus, React.ReactNode> = {
  reading: <AutoStories style={{ fontSize: 20 }} />,
  planned: <Bookmark style={{ fontSize: 20 }} />,
  completed: <CheckCircle style={{ fontSize: 20 }} />,
  paused: <PauseCircle style={{ fontSize: 20 }} />,
  dropped: <Block style={{ fontSize: 20 }} />,
};

const ORDER: BookStatus[] = ['reading', 'planned', 'completed', 'paused', 'dropped'];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const BookStatePanel: React.FC<Props> = ({
  book,
  onStatus,
  onQuickAdd,
  onOpenProgress,
  onRate,
}) => {
  const { currentTheme } = useTheme();
  const [rating, setRating] = useState(false);
  const rated = (book.rating ?? 0) > 0;
  const percent = progressPercent(book);
  const hours = remainingHours(book);
  const statusColor: Record<BookStatus, string> = {
    reading: currentTheme.primary,
    planned: currentTheme.accent,
    completed: currentTheme.status.success,
    paused: currentTheme.status.warning,
    dropped: currentTheme.status.error,
  };
  const showProgress = book.status === 'reading' || book.status === 'paused';

  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        {t('Dein Stand')}
      </h2>

      <div className="bd-status-row" role="radiogroup" aria-label={t('Lesestatus')}>
        {ORDER.map((status) => {
          const active = book.status === status;
          const color = statusColor[status];
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={active}
              className="bd-status"
              onClick={() => onStatus(status)}
              style={{
                color: active ? color : currentTheme.text.muted,
                borderColor: active ? `${color}80` : undefined,
                background: active ? `${color}1f` : undefined,
              }}
            >
              {STATUS_ICONS[status]}
              {STATUS_LABELS[status]()}
            </button>
          );
        })}
      </div>

      {showProgress && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 12,
            }}
          >
            <div className="bd-page-big" style={{ color: currentTheme.text.secondary }}>
              <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
                {t('Seite')}
              </span>
              <span className="bd-page-num">{book.currentPage || 0}</span>
              {book.pageCount ? (
                <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
                  / {book.pageCount}
                </span>
              ) : null}
            </div>
            <span style={{ fontWeight: 800, color: currentTheme.primary, fontSize: 18 }}>
              {percent} %
            </span>
          </div>
          <div className="bk-progress" style={{ height: 10 }}>
            <div
              className="bk-progress-fill"
              style={{
                width: `${Math.max(percent, 1)}%`,
                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              }}
            />
          </div>
          <div className="bk-progress-meta" style={{ color: currentTheme.text.muted }}>
            <span>
              {book.startedAt ? t('Seit {date}', { date: formatDate(book.startedAt) }) : ''}
            </span>
            <span>{hours !== null && hours > 0 ? formatHours(hours) : ''}</span>
          </div>
          <div className="bk-quick-row">
            {[10, 25, 50].map((step) => (
              <button
                key={step}
                type="button"
                className="bk-chip-btn"
                style={{ color: currentTheme.text.secondary }}
                onClick={() => onQuickAdd(step)}
              >
                +{step}
              </button>
            ))}
            <button
              type="button"
              className="bk-chip-btn bk-chip-btn--primary"
              onClick={onOpenProgress}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                color: getOptimalTextColor(currentTheme.primary),
              }}
            >
              <Edit style={{ fontSize: 15 }} />
              {t('Seite eingeben')}
            </button>
          </div>
        </div>
      )}

      {book.status === 'completed' && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: currentTheme.text.secondary, fontWeight: 700, fontSize: 14 }}>
            {book.completedAt
              ? t('Gelesen am {date}', { date: formatDate(book.completedAt) })
              : t('Früher gelesen')}
            {(book.rereadCount ?? 0) > 0 && (
              <span
                className="bk-muted"
                style={{ color: currentTheme.text.muted, fontWeight: 600 }}
              >
                {' · '}
                {t('{n}× erneut gelesen', { n: book.rereadCount ?? 0 })}
              </span>
            )}
          </div>
          <button
            type="button"
            className="bk-chip-btn"
            style={{ color: currentTheme.text.secondary }}
            onClick={() => onStatus('reading')}
          >
            <Replay style={{ fontSize: 16 }} />
            {t('Nochmal lesen')}
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ color: currentTheme.text.muted, fontWeight: 700, fontSize: 13.5 }}>
          {t('Deine Bewertung')}
        </span>
        <button
          type="button"
          className="bk-rate-btn"
          onClick={() => setRating(true)}
          aria-label={
            rated ? t('{value} von 10', { value: (book.rating ?? 0).toFixed(1) }) : t('Bewerten')
          }
          style={
            rated
              ? {
                  color: currentTheme.status.warning,
                  borderColor: `${currentTheme.status.warning}40`,
                  background: `${currentTheme.status.warning}12`,
                }
              : { color: currentTheme.text.secondary }
          }
        >
          <Star style={{ fontSize: 18 }} />
          {rated ? (
            <>
              <span className="bk-rate-value">{(book.rating ?? 0).toFixed(1)}</span>
              <span className="bk-rate-max" style={{ color: currentTheme.text.muted }}>
                / 10
              </span>
            </>
          ) : (
            t('Bewerten')
          )}
        </button>
      </div>

      <QuickRatingSheet
        isOpen={rating}
        onClose={() => setRating(false)}
        seriesTitle={book.title}
        eyebrow={t('Deine Bewertung')}
        initialRating={book.rating ?? 0}
        genreStage={false}
        onRate={(value) => {
          onRate(Math.round(value * 10) / 10);
          setRating(false);
        }}
        onClear={() => {
          onRate(0);
          setRating(false);
        }}
      />
    </div>
  );
};
