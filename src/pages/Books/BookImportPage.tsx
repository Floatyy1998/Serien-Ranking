import { CheckCircle, Description, UploadFile } from '@mui/icons-material';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notifyBookEventsChanged } from '../../hooks/books/useBookEvents';
import { createBookIndex } from '../../lib/books/bookIdentity';
import { buildImportPreview, type ImportPreview } from '../../lib/books/goodreadsCsv';
import { hapticCelebrate } from '../../lib/interaction/haptics';
import { importBooks } from '../../services/books/bookService';
import { logBookFinished } from '../../features/badges/minimalActivityLogger';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { BookStatus } from '../../types/Book';
import { BookCover } from './components/BookCover';
import './components/books.css';
import { STATUS_LABELS } from './helpers';

type Phase = 'pick' | 'preview' | 'importing' | 'done';

export const BookImportPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { allBookList } = useBooksList();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);

  const existing = useMemo(() => createBookIndex(allBookList), [allBookList]);

  const fresh = useMemo(
    () => preview?.books.filter((b) => !existing.has(b)) ?? [],
    [preview, existing]
  );

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const text = await file.text();
      const result = buildImportPreview(text, new Date().toISOString());
      if (!result || result.books.length === 0) {
        setError(t('Das sieht nicht nach einem Goodreads- oder StoryGraph-Export aus.'));
        return;
      }
      setPreview(result);
      setPhase('preview');
    } catch {
      setError(t('Die Datei konnte nicht gelesen werden.'));
    }
  };

  const runImport = async () => {
    if (!user || fresh.length === 0) return;
    setPhase('importing');
    try {
      const count = await importBooks(user.uid, fresh, setProgress);
      setImported(count);
      setPhase('done');
      hapticCelebrate();
      notifyBookEventsChanged();
      void logBookFinished(user.uid);
    } catch {
      setError(t('Import fehlgeschlagen. Bitte versuch es nochmal.'));
      setPhase('preview');
    }
  };

  const primaryBtn = {
    color: getOptimalTextColor(currentTheme.primary),
    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
  };

  const steps = [
    {
      title: 'Goodreads',
      text: t(
        'Meine Bücher → Import und Export → Bibliothek exportieren. Die CSV-Datei hier auswählen.'
      ),
    },
    {
      title: 'StoryGraph',
      text: t('Konto verwalten → Deine Daten exportieren. Die CSV-Datei hier auswählen.'),
    },
  ];

  const statusOrder: BookStatus[] = ['completed', 'reading', 'planned', 'paused', 'dropped'];

  return (
    <PageLayout>
      <PageHeader
        title={t('Bücher importieren')}
        subtitle={t('Deine Bibliothek in einem Rutsch')}
        icon={<UploadFile />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
      />
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 'var(--page-bottom-gap)',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {phase === 'pick' && (
          <>
            <div className="bk-grid-2">
              {steps.map((s) => (
                <div key={s.title} className="bk-card">
                  <div
                    style={{ fontWeight: 800, color: currentTheme.text.secondary, marginBottom: 6 }}
                  >
                    {s.title}
                  </div>
                  <div
                    className="bk-muted"
                    style={{ color: currentTheme.text.muted, lineHeight: 1.5 }}
                  >
                    {s.text}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="bk-cta"
              style={primaryBtn}
              onClick={() => fileRef.current?.click()}
            >
              <Description style={{ fontSize: 20 }} />
              {t('CSV-Datei auswählen')}
            </button>
            <div
              className="bk-muted"
              style={{ color: currentTheme.text.muted, textAlign: 'center' }}
            >
              {t(
                'Die Datei wird nur auf deinem Gerät gelesen. Übernommen werden Titel, Autor, ISBN, Status, Bewertung und Lesedatum.'
              )}
            </div>
          </>
        )}

        {error && (
          <div
            className="bk-card"
            style={{ color: currentTheme.status.error, textAlign: 'center' }}
          >
            {error}
          </div>
        )}

        {(phase === 'preview' || phase === 'importing') && preview && (
          <>
            <div className="bk-card">
              <div style={{ fontWeight: 800, fontSize: 17, color: currentTheme.text.secondary }}>
                {t('{n} Bücher gefunden', { n: preview.books.length })}
              </div>
              <div className="bk-muted" style={{ color: currentTheme.text.muted, marginTop: 4 }}>
                {preview.books.length - fresh.length > 0
                  ? t('{n} davon hast du schon, die bleiben unverändert.', {
                      n: preview.books.length - fresh.length,
                    })
                  : t('Alles neu für dein Regal.')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {statusOrder
                  .filter((s) => preview.counts[s] > 0)
                  .map((s) => (
                    <span
                      key={s}
                      className="bk-badge"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: currentTheme.text.secondary,
                      }}
                    >
                      {STATUS_LABELS[s]()} · {preview.counts[s]}
                    </span>
                  ))}
              </div>
            </div>
            <div className="bk-carousel" style={{ padding: '0 0 6px' }}>
              {fresh.slice(0, 24).map((b) => (
                <div
                  key={b.id}
                  className="bk-carousel-item"
                  style={{ width: 92, cursor: 'default' }}
                >
                  <BookCover book={b} />
                  <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                    {b.title}
                  </span>
                </div>
              ))}
            </div>
            {phase === 'importing' ? (
              <div className="bk-card">
                <div className="bk-progress">
                  <div
                    className="bk-progress-fill"
                    style={{
                      width: `${(progress / Math.max(1, fresh.length)) * 100}%`,
                      background: currentTheme.primary,
                    }}
                  />
                </div>
                <div
                  className="bk-muted"
                  style={{ color: currentTheme.text.muted, marginTop: 8, textAlign: 'center' }}
                >
                  {t('{n} von {m} importiert', { n: progress, m: fresh.length })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="bk-cta bk-cta--ghost"
                  style={{ flex: 1, color: currentTheme.text.secondary }}
                  onClick={() => {
                    setPreview(null);
                    setPhase('pick');
                  }}
                >
                  {t('Andere Datei')}
                </button>
                <button
                  type="button"
                  className="bk-cta"
                  style={{ flex: 2, ...primaryBtn, opacity: fresh.length ? 1 : 0.5 }}
                  disabled={fresh.length === 0}
                  onClick={() => void runImport()}
                >
                  <UploadFile style={{ fontSize: 20 }} />
                  {t('{n} Bücher importieren', { n: fresh.length })}
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div className="bk-empty" style={{ margin: 0 }}>
            <CheckCircle style={{ fontSize: 52, color: currentTheme.status.success }} />
            <h2 className="bk-empty-title" style={{ color: currentTheme.text.secondary }}>
              {t('{n} Bücher eingeräumt', { n: imported })}
            </h2>
            <p className="bk-muted" style={{ color: currentTheme.text.muted }}>
              {t('Cover kommen von Open Library, wo es eins gibt.')}
            </p>
            <button
              type="button"
              className="bk-cta"
              style={primaryBtn}
              onClick={() => navigate('/books')}
            >
              {t('Zum Regal')}
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
