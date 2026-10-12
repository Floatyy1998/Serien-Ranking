import { CheckCircle } from '@mui/icons-material';
import React, { useState } from 'react';
import { BottomSheet } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { clampPage, progressPercent } from '../../../lib/books/bookProgress';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Book } from '../../../types/Book';
import { BookCover } from './BookCover';
import './books.css';

interface ProgressSheetProps {
  book: Book | null;
  onClose: () => void;
  onSave: (page: number, pageCount?: number) => void;
  onFinish: () => void;
}

const STEPS = [5, 10, 25, 50];

const ProgressBody: React.FC<Omit<ProgressSheetProps, 'book' | 'onClose'> & { book: Book }> = ({
  book,
  onSave,
  onFinish,
}) => {
  const { currentTheme } = useTheme();
  const [page, setPage] = useState(book.currentPage || 0);
  const [pageCount, setPageCount] = useState<number | ''>(book.pageCount ?? '');

  const total = typeof pageCount === 'number' && pageCount > 0 ? pageCount : undefined;
  const safePage = clampPage(page, total);
  const percent = progressPercent({ status: 'reading', currentPage: safePage, pageCount: total });
  const muted = currentTheme.text.muted;

  return (
    <div className="bk-sheet">
      <div className="bk-sheet-head">
        <BookCover book={book} width={56} />
        <div style={{ minWidth: 0 }}>
          <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
            {book.title}
          </h3>
          <span className="bk-muted" style={{ color: muted }}>
            {t('Wo bist du gerade?')}
          </span>
        </div>
      </div>

      <div className="bk-page-display" style={{ color: currentTheme.text.secondary }}>
        <span className="bk-muted" style={{ color: muted }}>
          {t('Seite')}
        </span>
        <input
          className="bk-page-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={total}
          value={Number.isFinite(page) ? page : 0}
          onChange={(e) => setPage(Number(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
          style={{ color: currentTheme.text.secondary, borderColor: `${currentTheme.primary}88` }}
          aria-label={t('Seite')}
        />
        {total ? (
          <span className="bk-muted" style={{ color: muted }}>
            {t('von {n}', { n: total })}
          </span>
        ) : null}
      </div>

      {total ? (
        <>
          <input
            className="bk-range"
            type="range"
            min={0}
            max={total}
            value={safePage}
            onChange={(e) => setPage(Number(e.target.value))}
            aria-label={t('Lesestand')}
          />
          <div className="bk-muted" style={{ textAlign: 'center', marginTop: -8, color: muted }}>
            {t('{n} % gelesen', { n: percent })}
          </div>
        </>
      ) : (
        <label
          className="bk-muted"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'center',
            color: muted,
          }}
        >
          {t('Seitenzahl des Buchs')}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value ? Number(e.target.value) : '')}
            style={{
              width: 80,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--glass-border-light)',
              background: 'rgba(255,255,255,0.06)',
              color: currentTheme.text.secondary,
              font: 'inherit',
            }}
          />
        </label>
      )}

      <div className="bk-chip-row">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className="bk-chip-btn"
            style={{ color: currentTheme.text.secondary }}
            onClick={() => setPage((p) => clampPage((Number.isFinite(p) ? p : 0) + step, total))}
          >
            +{step}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          className="bk-cta bk-cta--ghost"
          style={{ color: currentTheme.text.secondary, flex: 1 }}
          onClick={onFinish}
        >
          <CheckCircle style={{ fontSize: 18, color: currentTheme.status.success }} />
          {t('Fertig gelesen')}
        </button>
        <button
          type="button"
          className="bk-cta"
          style={{
            flex: 1,
            color: getOptimalTextColor(currentTheme.primary),
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
          onClick={() => onSave(safePage, total !== book.pageCount ? total : undefined)}
        >
          {t('Speichern')}
        </button>
      </div>
    </div>
  );
};

export const ProgressSheet: React.FC<ProgressSheetProps> = ({
  book,
  onClose,
  onSave,
  onFinish,
}) => (
  <BottomSheet isOpen={!!book} onClose={onClose} ariaLabel={t('Lesestand')}>
    {book && <ProgressBody key={book.id} book={book} onSave={onSave} onFinish={onFinish} />}
  </BottomSheet>
);
