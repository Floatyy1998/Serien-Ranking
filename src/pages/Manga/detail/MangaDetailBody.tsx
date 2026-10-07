import {
  Check,
  CheckCircle,
  Delete,
  EventAvailable,
  Replay,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { MangaDexChapterInfo } from '../../../services/api/mangaUpdatesService';
import { dateLocale, t } from '../../../services/i18n';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import { inferStatus, STATUS_COLORS } from '../mangaUtils';
import type { MangaHeroData } from './mangaDetailData';
import { MangaInfoSections } from './MangaInfoSections';
import { Section, SectionTitle } from './Section';

const STATUS_OPTIONS: { value: Manga['readStatus']; label: string }[] = [
  { value: 'reading', label: t('Lese ich') },
  { value: 'completed', label: t('Abgeschlossen') },
  { value: 'paused', label: t('Pausiert') },
  { value: 'dropped', label: t('Abgebrochen') },
  { value: 'planned', label: t('Geplant') },
];

const PLATFORM_OPTIONS = [
  'Webtoon',
  'MangaPlus',
  'MangaDex',
  'Tapas',
  'Crunchyroll',
  'Viz',
  'Shonen Jump',
  'ComiXology',
  'Kindle',
  'Print',
];

const RATING_WORDS: Record<number, string> = {
  1: t('Grauenhaft'),
  2: t('Schlecht'),
  3: t('Schwach'),
  4: t('Naja'),
  5: t('Mittelmaß'),
  6: t('Okay'),
  7: t('Gut'),
  8: t('Sehr gut'),
  9: t('Großartig'),
  10: t('Meisterwerk'),
};

const formatDay = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(dateLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

interface MangaDetailBodyProps {
  manga: Manga;
  heroData: MangaHeroData;
  currentTheme: ThemeContextType['currentTheme'];
  isMobile: boolean;
  chapterInfo: MangaDexChapterInfo | null;
  displayData: AniListMangaSearchResult | null;
  ownedIds: Set<number>;
  userRating: number;
  notesValue: string;
  notesStatus: 'idle' | 'saving' | 'saved';
  showCustomPlatform: boolean;
  setShowCustomPlatform: (v: boolean) => void;
  customPlatform: string;
  setCustomPlatform: (v: string) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  onStatusChange: (status: Manga['readStatus']) => void;
  onChapterChange: (chapter: number) => void;
  onRating: (rating: number) => void;
  onPlatformSelect: (platform: string) => void;
  onNotesChange: (value: string) => void;
  onNotesFocus: () => void;
  onNotesBlur: () => void;
  onReread: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
}

export const MangaDetailBody = ({
  manga,
  heroData,
  currentTheme,
  isMobile,
  chapterInfo,
  displayData,
  ownedIds,
  userRating,
  notesValue,
  notesStatus,
  showCustomPlatform,
  setShowCustomPlatform,
  customPlatform,
  setCustomPlatform,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onStatusChange,
  onChapterChange,
  onRating,
  onPlatformSelect,
  onNotesChange,
  onNotesFocus,
  onNotesBlur,
  onReread,
  onToggleHide,
  onDelete,
}: MangaDetailBodyProps) => {
  // Kapitel, dessen *Rückschritt* noch bestätigt werden muss.
  const [confirmChapter, setConfirmChapter] = useState<number | null>(null);
  const [confirmReread, setConfirmReread] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const currentChapter = manga.currentChapter ?? 0;
  const effectiveStatus = inferStatus(manga);
  const shownRating = hoverRating || userRating;

  // Nur ein Rückschritt verlangt eine Bestätigung, vorwärts direkt.
  const handleMarkReadUpTo = (chapter: number) => {
    if (chapter < currentChapter) {
      setConfirmChapter(chapter);
    } else {
      onChapterChange(chapter);
    }
  };

  const journey = [
    { label: t('Hinzugefügt'), iso: manga.addedAt },
    { label: t('Begonnen'), iso: manga.startedAt },
    { label: t('Zuletzt gelesen'), iso: manga.lastReadAt },
    { label: t('Abgeschlossen'), iso: manga.completedAt },
  ]
    .filter((step) => step.iso)
    .sort((a, b) => new Date(a.iso || 0).getTime() - new Date(b.iso || 0).getTime())
    .map((step) => ({ label: step.label, value: formatDay(step.iso) }));

  const showReleases =
    !!chapterInfo &&
    chapterInfo.recentChapters.length > 0 &&
    (effectiveStatus === 'RELEASING' || effectiveStatus === 'HIATUS');

  return (
    <div className="manga-detail-content md-layout">
      <div className="md-main">
        {showReleases && chapterInfo && (
          <Section delay={0.08} order={2}>
            <SectionTitle
              action={
                effectiveStatus === 'RELEASING' &&
                chapterInfo.estimatedNextDate &&
                new Date(chapterInfo.estimatedNextDate) > new Date() ? (
                  <span className="md-next-chip">
                    <EventAvailable style={{ fontSize: 15 }} />
                    {t('Nächstes Kapitel')} ~
                    {new Date(chapterInfo.estimatedNextDate).toLocaleDateString(dateLocale(), {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {chapterInfo.avgDaysBetweenReleases
                      ? ` · ${t('alle {n} Tage', { n: chapterInfo.avgDaysBetweenReleases })}`
                      : ''}
                  </span>
                ) : undefined
              }
            >
              {t('Kapitel-Releases')}
            </SectionTitle>

            <div className="manga-chapter-list">
              {chapterInfo.recentChapters.map((ch) => {
                const isRead = currentChapter >= ch.chapter;
                const isConfirming = confirmChapter === ch.chapter;
                return (
                  <div
                    key={ch.chapter}
                    className={`md-release ${isRead ? 'md-release--read' : ''}`}
                  >
                    <span className="md-release-no">
                      {t('Kap.')} {ch.chapter}
                    </span>
                    <span className="md-release-title">{ch.title || ''}</span>
                    <span className="md-release-date">
                      {new Date(ch.publishedAt).toLocaleDateString(dateLocale(), {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {isConfirming ? (
                      <div className="md-release-confirm">
                        <span>{t('Zurücksetzen?')}</span>
                        <button
                          type="button"
                          className="manga-chapter-confirm-btn"
                          onClick={() => {
                            onChapterChange(ch.chapter);
                            setConfirmChapter(null);
                          }}
                          style={{
                            background: 'var(--theme-primary-15)',
                            color: currentTheme.primary,
                          }}
                        >
                          {t('Ja')}
                        </button>
                        <button
                          type="button"
                          className="manga-chapter-confirm-btn"
                          onClick={() => setConfirmChapter(null)}
                          style={{
                            background: 'var(--glass-light)',
                            color: currentTheme.text.secondary,
                          }}
                        >
                          {t('Nein')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="manga-chapter-read-btn"
                        aria-label={
                          isRead
                            ? t('Fortschritt auf Kapitel {n} zurücksetzen', { n: ch.chapter })
                            : t('Bis Kapitel {n} als gelesen markieren', { n: ch.chapter })
                        }
                        aria-pressed={isRead}
                        onClick={() => handleMarkReadUpTo(ch.chapter)}
                      >
                        {isRead ? (
                          <CheckCircle style={{ fontSize: 20, color: currentTheme.primary }} />
                        ) : (
                          <Check style={{ fontSize: 20, color: currentTheme.text.muted }} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {journey.length > 0 && (
          <Section delay={0.18} order={3}>
            <SectionTitle
              action={
                (manga.rereadCount || 0) > 0 ? (
                  <span className="md-hint" style={{ margin: 0, color: currentTheme.text.muted }}>
                    {t('{n}× erneut gelesen', { n: manga.rereadCount || 0 })}
                  </span>
                ) : undefined
              }
            >
              {t('Deine Lesereise')}
            </SectionTitle>
            <ol className="md-journey">
              {journey.map((step) => (
                <li key={step.label} className="md-journey-step">
                  <span className="md-journey-dot" />
                  <span className="md-journey-label" style={{ color: currentTheme.text.muted }}>
                    {step.label}
                  </span>
                  <span className="md-journey-value">{step.value}</span>
                </li>
              ))}
            </ol>
            {manga.readStatus === 'completed' &&
              (confirmReread ? (
                <div className="md-reread-confirm">
                  <span style={{ color: currentTheme.text.secondary }}>
                    {t('Von vorn beginnen? Dein Fortschritt springt auf Kapitel 0.')}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="manga-chapter-confirm-btn"
                      onClick={() => {
                        onReread();
                        setConfirmReread(false);
                      }}
                      style={{ background: 'var(--theme-primary-15)', color: currentTheme.primary }}
                    >
                      {t('Los geht’s')}
                    </button>
                    <button
                      type="button"
                      className="manga-chapter-confirm-btn"
                      onClick={() => setConfirmReread(false)}
                      style={{
                        background: 'var(--glass-light)',
                        color: currentTheme.text.secondary,
                      }}
                    >
                      {t('Abbrechen')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="md-reread-btn"
                  onClick={() => setConfirmReread(true)}
                  style={{ color: currentTheme.primary }}
                >
                  <Replay style={{ fontSize: 18 }} />
                  {t('Nochmal lesen')}
                </button>
              ))}
          </Section>
        )}

        <Section delay={0.16} order={4}>
          <SectionTitle
            action={
              <span
                aria-live="polite"
                className="md-hint"
                style={{
                  margin: 0,
                  color:
                    notesStatus === 'saved' ? currentTheme.status.success : currentTheme.text.muted,
                  opacity: notesStatus === 'idle' ? 0 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {notesStatus === 'saving'
                  ? t('Speichert…')
                  : notesStatus === 'saved'
                    ? t('Gespeichert')
                    : ''}
              </span>
            }
          >
            {t('Notizen')}
          </SectionTitle>
          <textarea
            value={notesValue}
            onChange={(e) => onNotesChange(e.target.value)}
            onFocus={onNotesFocus}
            onBlur={onNotesBlur}
            placeholder={t('Deine Notizen zu diesem Manga…')}
            className="md-notes"
          />
        </Section>

        <MangaInfoSections
          part="main"
          data={heroData}
          anilist={displayData}
          isMobile={isMobile}
          ownedIds={ownedIds}
        />
      </div>

      <aside className="md-side">
        <Section delay={0.1} order={1} className="md-stand">
          <div className="md-sub">
            <SectionTitle>{t('Lesestatus')}</SectionTitle>
            <div className="manga-detail-status-grid">
              {STATUS_OPTIONS.map((opt) => {
                const active = manga.readStatus === opt.value;
                const color = STATUS_COLORS[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    className={`manga-detail-status-btn ${active ? 'manga-detail-status-btn--active' : ''}`}
                    onClick={() => onStatusChange(opt.value)}
                    style={
                      active
                        ? {
                            borderColor: `${color}80`,
                            background: `${color}22`,
                            color,
                          }
                        : { color: currentTheme.text.secondary }
                    }
                  >
                    <span className="md-status-dot" style={{ background: color }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md-sub" id="manga-rating">
            <SectionTitle
              action={
                shownRating > 0 ? (
                  <span className="md-rating-word" style={{ color: '#fbbf24' }}>
                    {shownRating}/10 · {RATING_WORDS[shownRating]}
                  </span>
                ) : undefined
              }
            >
              {t('Deine Bewertung')}
            </SectionTitle>
            <div className="manga-detail-rating" onPointerLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="manga-detail-star-btn"
                  aria-label={t('{n} von 10 Sternen', { n: star })}
                  aria-pressed={star <= userRating}
                  onClick={() => onRating(star)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setHoverRating(star);
                  }}
                >
                  <Star
                    style={{
                      fontSize: isMobile ? 27 : 32,
                      color: star <= shownRating ? '#fbbf24' : 'rgba(255,255,255,0.14)',
                      filter:
                        star <= shownRating ? 'drop-shadow(0 0 6px rgba(251,191,36,0.45))' : 'none',
                      transition: 'color 0.15s, filter 0.15s',
                    }}
                  />
                </button>
              ))}
            </div>
            {userRating === 0 && (
              <p className="md-hint" style={{ color: currentTheme.text.muted }}>
                {t('Tippe auf einen Stern — nochmal tippen entfernt die Bewertung.')}
              </p>
            )}
          </div>
          <div className="md-sub">
            <SectionTitle>{t('Wo du liest')}</SectionTitle>
            <div className="manga-detail-status-grid">
              {PLATFORM_OPTIONS.map((p) => {
                const active = manga.readingPlatform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active}
                    className={`manga-detail-status-btn ${active ? 'manga-detail-status-btn--active' : ''}`}
                    onClick={() => onPlatformSelect(p)}
                    style={
                      active
                        ? {
                            borderColor: 'var(--theme-primary-50)',
                            background: 'var(--theme-primary-15)',
                            color: currentTheme.primary,
                          }
                        : { color: currentTheme.text.secondary }
                    }
                  >
                    {p}
                  </button>
                );
              })}
              {manga.readingPlatform && !PLATFORM_OPTIONS.includes(manga.readingPlatform) && (
                <button
                  type="button"
                  aria-pressed
                  className="manga-detail-status-btn manga-detail-status-btn--active"
                  style={{
                    borderColor: 'var(--theme-primary-50)',
                    background: 'var(--theme-primary-15)',
                    color: currentTheme.primary,
                  }}
                >
                  {manga.readingPlatform}
                </button>
              )}
              {!showCustomPlatform ? (
                <button
                  type="button"
                  className="manga-detail-status-btn"
                  onClick={() => setShowCustomPlatform(true)}
                  style={{ color: currentTheme.text.secondary, borderStyle: 'dashed' }}
                >
                  {t('+ Andere')}
                </button>
              ) : (
                <input
                  autoFocus
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder={t('Plattform...')}
                  aria-label={t('Eigene Plattform')}
                  className="md-platform-input"
                  onBlur={() => {
                    if (!customPlatform.trim()) setShowCustomPlatform(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPlatform.trim()) {
                      onPlatformSelect(customPlatform.trim());
                      setCustomPlatform('');
                    }
                    if (e.key === 'Escape') setShowCustomPlatform(false);
                  }}
                />
              )}
            </div>
          </div>
        </Section>

        <MangaInfoSections
          part="side"
          data={heroData}
          anilist={displayData}
          isMobile={isMobile}
          ownedIds={ownedIds}
        />

        <Section delay={0.3} order={10}>
          <SectionTitle>{t('Verwaltung')}</SectionTitle>
          <div className="md-manage">
            <button
              type="button"
              className="manga-detail-action-btn"
              onClick={onToggleHide}
              style={{ color: currentTheme.text.secondary }}
            >
              {manga.hidden ? (
                <Visibility style={{ fontSize: 18 }} />
              ) : (
                <VisibilityOff style={{ fontSize: 18 }} />
              )}
              {manga.hidden ? t('Einblenden') : t('Verstecken')}
            </button>

            {!showDeleteConfirm ? (
              <button
                type="button"
                className="manga-detail-action-btn"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: currentTheme.status?.error || '#ef4444' }}
              >
                <Delete style={{ fontSize: 18 }} />
                {t('Entfernen')}
              </button>
            ) : (
              <div className="manga-detail-delete-confirm">
                <span style={{ color: currentTheme.text.secondary, fontSize: 14 }}>
                  {t('Wirklich entfernen?')}
                </span>
                <button
                  type="button"
                  className="manga-detail-delete-confirm-btn"
                  onClick={onDelete}
                  style={{
                    background: 'rgba(239,68,68,0.14)',
                    color: currentTheme.status?.error || '#ef4444',
                  }}
                >
                  {t('Ja')}
                </button>
                <button
                  type="button"
                  className="manga-detail-delete-confirm-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ background: 'var(--glass-light)', color: currentTheme.text.secondary }}
                >
                  {t('Nein')}
                </button>
              </div>
            )}
          </div>
        </Section>
      </aside>
    </div>
  );
};
