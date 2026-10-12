import { AutoStories, Bookmark, CheckCircle, History } from '@mui/icons-material';
import React from 'react';
import { BottomSheet } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import type { BookSearchResult, BookStatus } from '../../../types/Book';
import { BookCover } from './BookCover';
import './books.css';

export interface AddChoice {
  status: BookStatus;
  finishedEarlier?: boolean;
}

/** Die vier Wege ins Regal — im Sheet und direkt auf der Detailseite. */
export const AddOptions: React.FC<{ busy?: boolean; onPick: (choice: AddChoice) => void }> = ({
  busy,
  onPick,
}) => {
  const { currentTheme } = useTheme();
  const options: {
    choice: AddChoice;
    label: string;
    hint: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      choice: { status: 'reading' },
      label: t('Lese ich gerade'),
      hint: t('Mit Seitenstand und Weiterlesen'),
      icon: <AutoStories />,
      color: currentTheme.primary,
    },
    {
      choice: { status: 'planned' },
      label: t('Will ich lesen'),
      hint: t('Landet auf deinem Stapel'),
      icon: <Bookmark />,
      color: currentTheme.accent,
    },
    {
      choice: { status: 'completed' },
      label: t('Gerade beendet'),
      hint: t('Zählt für dein Lesejahr'),
      icon: <CheckCircle />,
      color: currentTheme.status.success,
    },
    {
      choice: { status: 'completed', finishedEarlier: true },
      label: t('Früher gelesen'),
      hint: t('Ins Regal, ohne Jahreswertung'),
      icon: <History />,
      color: currentTheme.text.muted,
    },
  ];

  return (
    <div className="bk-option-grid">
      {options.map((o) => (
        <button
          key={`${o.choice.status}-${o.choice.finishedEarlier ? 'early' : 'now'}`}
          type="button"
          className="bk-option"
          disabled={busy}
          onClick={() => onPick(o.choice)}
          style={{
            color: currentTheme.text.secondary,
            opacity: busy ? 0.5 : 1,
            background: `linear-gradient(140deg, ${o.color}1f, rgba(255,255,255,0.03) 70%)`,
            borderColor: `${o.color}40`,
          }}
        >
          <span style={{ color: o.color, display: 'flex' }}>{o.icon}</span>
          <span className="bk-option-label">{o.label}</span>
          <span className="bk-option-hint" style={{ color: currentTheme.text.muted }}>
            {o.hint}
          </span>
        </button>
      ))}
    </div>
  );
};

interface AddBookSheetProps {
  result: BookSearchResult | null;
  busy?: boolean;
  zIndex?: number;
  onClose: () => void;
  onPick: (choice: AddChoice) => void;
}

export const AddBookSheet: React.FC<AddBookSheetProps> = ({
  result,
  busy,
  zIndex,
  onClose,
  onPick,
}) => {
  const { currentTheme } = useTheme();
  return (
    <BottomSheet
      isOpen={!!result}
      onClose={onClose}
      ariaLabel={t('Buch hinzufügen')}
      zIndex={zIndex}
    >
      {result && (
        <div className="bk-sheet">
          <div className="bk-sheet-head">
            <BookCover book={result} fallbackSrc={result.coverFallback} width={56} />
            <div style={{ minWidth: 0 }}>
              <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
                {result.title}
              </h3>
              <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
                {[result.authors[0], result.publishedYear].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
          <AddOptions busy={busy} onPick={onPick} />
        </div>
      )}
    </BottomSheet>
  );
};
