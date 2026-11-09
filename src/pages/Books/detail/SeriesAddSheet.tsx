import { LibraryAdd } from '@mui/icons-material';
import React, { useState } from 'react';
import { BottomSheet } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { seriesBulkBooks, type SeriesBulkSelection } from '../../../lib/books/seriesBulk';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { BookCover } from '../components/BookCover';
import { useBookActions } from '../hooks/useBookActions';
import '../components/books.css';

interface SeriesAddSheetProps {
  open: boolean;
  onClose: () => void;
  seriesId: string;
  name: string;
  selection: SeriesBulkSelection;
  /** Band des gerade offenen Buchs — Vorschlag „Gelesen bis hier". */
  currentPosition?: number;
}

const SeriesAddBody: React.FC<Omit<SeriesAddSheetProps, 'open'>> = ({
  onClose,
  seriesId,
  name,
  selection,
  currentPosition,
}) => {
  const { currentTheme } = useTheme();
  const { addSeries } = useBookActions();
  const [readUpTo, setReadUpTo] = useState(0);
  const [busy, setBusy] = useState(false);
  const muted = currentTheme.text.muted;

  const positions = [
    ...selection.candidates.map((c) => c.position),
    ...selection.plannedOwned.map((p) => p.position),
  ];
  const max = Math.max(0, ...positions);
  // Der Regler beginnt vor dem ersten fehlenden Band — bei Band 160–183 wären sonst 87 % der Strecke leer.
  const floor = Math.max(0, Math.min(...positions, max) - 1);
  const limit = Math.min(Math.max(0, Math.floor(readUpTo) || 0), max);
  const readCount = selection.candidates.filter((c) => c.position <= limit).length;
  const plannedCount = selection.candidates.length - readCount;
  const markRead = selection.plannedOwned.filter((p) => p.position <= limit).map((p) => p.book);
  const first = selection.candidates[0]?.result;
  const nothing = !selection.candidates.length && !markRead.length;
  const presets = [
    { label: t('Keinen'), value: 0 },
    ...(currentPosition && currentPosition > 1 && currentPosition < max
      ? [{ label: t('Bis Band {n}', { n: currentPosition }), value: currentPosition }]
      : []),
    { label: t('Alle'), value: max },
  ];

  const submit = async () => {
    if (busy || nothing) return;
    setBusy(true);
    const books = seriesBulkBooks(
      selection.candidates,
      { id: seriesId, name },
      limit,
      new Date().toISOString()
    );
    await addSeries(books, markRead);
    setBusy(false);
    onClose();
  };

  return (
    <div className="bk-sheet">
      <div className="bk-sheet-head">
        {first ? <BookCover book={first} fallbackSrc={first.coverFallback} width={56} /> : <span />}
        <div style={{ minWidth: 0 }}>
          <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
            {t('Ganze Reihe hinzufügen')}
          </h3>
          <span className="bk-muted" style={{ color: muted }}>
            {[name, t('{n} Bände fehlen dir', { n: selection.candidates.length })]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </div>

      <div className="bk-page-display" style={{ color: currentTheme.text.secondary }}>
        <span className="bk-muted" style={{ color: muted }}>
          {t('Gelesen bis Band')}
        </span>
        <input
          className="bk-page-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={limit > floor ? limit : ''}
          placeholder="–"
          onChange={(e) => setReadUpTo(Number(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
          style={{ color: currentTheme.text.secondary, borderColor: `${currentTheme.primary}88` }}
          aria-label={t('Gelesen bis Band')}
        />
      </div>
      {max > 1 && (
        <input
          className="bk-range"
          type="range"
          min={floor}
          max={max}
          value={Math.max(floor, limit)}
          onChange={(e) => setReadUpTo(Number(e.target.value))}
          aria-label={t('Gelesen bis Band')}
        />
      )}
      <div className="bk-chip-row">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="bk-chip-btn"
            style={{
              color: limit === preset.value ? currentTheme.primary : currentTheme.text.secondary,
              borderColor: limit === preset.value ? `${currentTheme.primary}88` : undefined,
            }}
            onClick={() => setReadUpTo(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="bk-muted" style={{ color: muted, textAlign: 'center', lineHeight: 1.5 }}>
        {[
          readCount ? t('{n} als früher gelesen', { n: readCount }) : '',
          plannedCount ? t('{n} auf die Leseliste', { n: plannedCount }) : '',
          markRead.length ? t('{n} von deiner Leseliste als gelesen', { n: markRead.length }) : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        {(selection.upcoming > 0 || selection.unresolved > 0) && (
          <div style={{ marginTop: 4 }}>
            {[
              selection.upcoming
                ? t('{n} angekündigte Bände bleiben draußen', { n: selection.upcoming })
                : '',
              selection.unresolved
                ? t('{n} Bände ohne Buchdaten übersprungen', { n: selection.unresolved })
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}
      </div>

      <button
        type="button"
        className="bk-cta"
        disabled={busy || nothing}
        style={{
          color: getOptimalTextColor(currentTheme.primary),
          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          opacity: busy || nothing ? 0.5 : 1,
        }}
        onClick={() => void submit()}
      >
        <LibraryAdd style={{ fontSize: 18 }} />
        {selection.candidates.length
          ? t('{n} Bände hinzufügen', { n: selection.candidates.length })
          : t('Als gelesen markieren')}
      </button>
    </div>
  );
};

export const SeriesAddSheet: React.FC<SeriesAddSheetProps> = ({ open, ...props }) => (
  <BottomSheet isOpen={open} onClose={props.onClose} ariaLabel={t('Ganze Reihe hinzufügen')}>
    {open && <SeriesAddBody {...props} />}
  </BottomSheet>
);
