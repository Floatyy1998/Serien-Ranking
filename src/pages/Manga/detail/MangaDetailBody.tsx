import {
  Check,
  CheckCircle,
  Delete,
  Link,
  OpenInNew,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { MangaDexChapterInfo } from '../../../services/mangaUpdatesService';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import { inferStatus } from '../mangaUtils';
import { Section, SectionTitle } from './Section';
import { appLocale, t } from '../../../services/i18n';

// Status-Optionen als Funktion, damit "Geplant" die Theme-Secondary-Farbe nutzt
// (Farben werden mit Hex-Alpha-Suffix kombiniert, daher kein var() möglich)
const getStatusOptions = (
  secondaryColor: string
): { value: Manga['readStatus']; label: string; color: string }[] => [
  { value: 'reading', label: t('Lese ich'), color: '#3b82f6' },
  { value: 'completed', label: t('Abgeschlossen'), color: '#22c55e' },
  { value: 'paused', label: t('Pausiert'), color: '#f59e0b' },
  { value: 'dropped', label: t('Abgebrochen'), color: '#ef4444' },
  { value: 'planned', label: t('Geplant'), color: secondaryColor },
];

const PLATFORM_OPTIONS = [
  'MangaDex',
  'Viz',
  'Webtoon',
  'Tapas',
  'Crunchyroll',
  'ComiXology',
  'Shonen Jump',
  'MangaPlus',
];

interface MangaDetailBodyProps {
  manga: Manga;
  anilistId: number;
  currentTheme: ThemeContextType['currentTheme'];
  chapterInfo: MangaDexChapterInfo | null;
  displayData: AniListMangaSearchResult | null;
  cleanDescription: string;
  userRating: number;
  // UI state lifted from parent so MangaDetailPage keeps full control of edit modes
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
  onToggleHide: () => void;
  onDelete: () => void;
}

export const MangaDetailBody = ({
  manga,
  anilistId,
  currentTheme,
  chapterInfo,
  displayData,
  cleanDescription,
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
  onToggleHide,
  onDelete,
}: MangaDetailBodyProps) => {
  const navigate = useNavigate();

  // Chapter for which a *backward* progress reset is awaiting confirmation.
  const [confirmChapter, setConfirmChapter] = useState<number | null>(null);
  const currentChapter = manga.currentChapter ?? 0;

  // "Bis hier gelesen": setzt currentChapter auf dieses Kapitel. Nur ein
  // RUECKschritt (Kapitel < aktueller Stand) verlangt eine Bestaetigung,
  // vorwaerts direkt. Nutzt handleChapterChange der Detail-Page (Status-Auto-
  // Logik + lastReadAt + Chapter-Read-Log) — kein Ad-hoc-Write hier.
  const handleMarkReadUpTo = (chapter: number) => {
    if (chapter < currentChapter) {
      setConfirmChapter(chapter);
    } else {
      onChapterChange(chapter);
    }
  };

  const recommendations = displayData?.recommendations?.edges?.slice(0, 6) || [];
  const externalLinks = displayData?.externalLinks || [];
  const relations = displayData?.relations?.edges?.filter((e) => e.node.type === 'MANGA') || [];

  return (
    <div className="manga-detail-content">
      {chapterInfo &&
        chapterInfo.recentChapters.length > 0 &&
        (inferStatus(manga) === 'RELEASING' || inferStatus(manga) === 'HIATUS') && (
          <Section
            bg={`${currentTheme.text.primary}08`}
            delay={0.12}
            className="manga-detail-section--wide"
          >
            <SectionTitle color={currentTheme.text.primary}>{t('Kapitel-Releases')}</SectionTitle>

            {/* Estimated next release — nur bei echt laufenden Manga, nicht bei
                inferred Hiatus (da macht ein Schaetzer keinen Sinn). */}
            {inferStatus(manga) === 'RELEASING' &&
              chapterInfo.estimatedNextDate &&
              new Date(chapterInfo.estimatedNextDate) > new Date() && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: `${currentTheme.primary}15`,
                    border: `1px solid ${currentTheme.primary}30`,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 20 }}>📅</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: currentTheme.primary }}>
                      {t('Nächstes Kapitel')} ~
                      {new Date(chapterInfo.estimatedNextDate).toLocaleDateString(
                        appLocale === 'en' ? 'en-US' : 'de-DE',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </div>
                    {chapterInfo.avgDaysBetweenReleases && (
                      <div
                        style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.7 }}
                      >
                        {t('Erscheint ca. alle {n} Tage', {
                          n: chapterInfo.avgDaysBetweenReleases,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div className="manga-chapter-list">
              {chapterInfo.recentChapters.map((ch) => {
                const isRead = currentChapter >= ch.chapter;
                const isConfirming = confirmChapter === ch.chapter;
                return (
                  <div
                    key={ch.chapter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: currentTheme.text.primary,
                        minWidth: 50,
                      }}
                    >
                      {t('Kap.')} {ch.chapter}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: currentTheme.text.secondary,
                        opacity: 0.7,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ch.title || ''}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: currentTheme.text.secondary,
                        opacity: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {new Date(ch.publishedAt).toLocaleDateString(
                        appLocale === 'en' ? 'en-US' : 'de-DE',
                        {
                          day: 'numeric',
                          month: 'short',
                        }
                      )}
                    </span>
                    {isConfirming ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span
                          style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.8 }}
                        >
                          {t('Zurücksetzen?')}
                        </span>
                        <button
                          type="button"
                          className="manga-chapter-confirm-btn"
                          onClick={() => {
                            onChapterChange(ch.chapter);
                            setConfirmChapter(null);
                          }}
                          style={{
                            background: `${currentTheme.primary}20`,
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
                            background: `${currentTheme.text.primary}10`,
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
                          <Check
                            style={{ fontSize: 20, color: `${currentTheme.text.primary}40` }}
                          />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

      <Section bg={`${currentTheme.text.primary}08`} delay={0.15}>
        <SectionTitle color={currentTheme.text.primary}>Status</SectionTitle>
        <div className="manga-detail-status-grid">
          {getStatusOptions(currentTheme.secondary).map((opt) => (
            <button
              key={opt.value}
              className={`manga-detail-status-btn ${manga.readStatus === opt.value ? 'manga-detail-status-btn--active' : ''}`}
              onClick={() => onStatusChange(opt.value)}
              style={
                manga.readStatus === opt.value
                  ? { borderColor: opt.color, background: `${opt.color}20`, color: opt.color }
                  : { color: currentTheme.text.secondary }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section bg={`${currentTheme.text.primary}08`} delay={0.2}>
        <SectionTitle color={currentTheme.text.primary}>{t('Bewertung')}</SectionTitle>
        <div className="manga-detail-rating">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              className="manga-detail-star-btn"
              aria-label={t('{n} von 10 Sternen', { n: star })}
              aria-pressed={star <= userRating}
              onClick={() => onRating(star)}
            >
              <Star
                style={{
                  fontSize: 28,
                  color: star <= userRating ? '#f59e0b' : `${currentTheme.text.primary}25`,
                  transition: 'color 0.15s',
                }}
              />
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 8,
              fontSize: 14,
              color: currentTheme.text.secondary,
            }}
          >
            {userRating}/10
          </div>
        )}
      </Section>

      <Section bg={`${currentTheme.text.primary}08`} delay={0.25}>
        <SectionTitle color={currentTheme.text.primary}>{t('Lese-Plattform')}</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p}
              className={`manga-detail-status-btn ${manga.readingPlatform === p ? 'manga-detail-status-btn--active' : ''}`}
              onClick={() => onPlatformSelect(p)}
              style={
                manga.readingPlatform === p
                  ? {
                      borderColor: currentTheme.primary,
                      background: `${currentTheme.primary}20`,
                      color: currentTheme.primary,
                    }
                  : { color: currentTheme.text.secondary }
              }
            >
              {p}
            </button>
          ))}
          {!showCustomPlatform ? (
            <button
              className="manga-detail-status-btn"
              onClick={() => setShowCustomPlatform(true)}
              style={{ color: currentTheme.text.secondary }}
            >
              {t('+ Andere')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder={t('Plattform...')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${currentTheme.primary}40`,
                  background: 'transparent',
                  color: currentTheme.text.primary,
                  fontSize: 13,
                  outline: 'none',
                  width: 120,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPlatform.trim()) {
                    onPlatformSelect(customPlatform.trim());
                    setCustomPlatform('');
                  }
                }}
              />
            </div>
          )}
        </div>
        {manga.readingPlatform && !PLATFORM_OPTIONS.includes(manga.readingPlatform) && (
          <div style={{ marginTop: 8, fontSize: 12, color: currentTheme.primary, opacity: 0.8 }}>
            {t('Aktuell:')} {manga.readingPlatform}
          </div>
        )}
      </Section>

      <Section bg={`${currentTheme.text.primary}08`} delay={0.3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle color={currentTheme.text.primary}>{t('Notizen')}</SectionTitle>
          {/* F13: Autosave — kein Bearbeiten/Speichern-Umweg, nur ein dezenter Status. */}
          <span
            aria-live="polite"
            style={{
              fontSize: 12,
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
        </div>
        <textarea
          value={notesValue}
          onChange={(e) => onNotesChange(e.target.value)}
          onFocus={onNotesFocus}
          onBlur={onNotesBlur}
          placeholder={t('Deine Notizen zu diesem Manga…')}
          style={{
            width: '100%',
            minHeight: 80,
            marginTop: 8,
            padding: 12,
            borderRadius: 10,
            border: `1px solid ${currentTheme.primary}30`,
            background: 'rgba(255,255,255,0.03)',
            color: currentTheme.text.primary,
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-body)',
          }}
        />
      </Section>

      {cleanDescription && (
        <Section
          bg={`${currentTheme.text.primary}08`}
          delay={0.35}
          className="manga-detail-section--desc"
        >
          <SectionTitle color={currentTheme.text.primary}>{t('Beschreibung')}</SectionTitle>
          <p className="manga-detail-description" style={{ color: currentTheme.text.secondary }}>
            {cleanDescription}
          </p>
        </Section>
      )}

      {relations.length > 0 && (
        <Section bg={`${currentTheme.text.primary}08`} delay={0.4}>
          <SectionTitle color={currentTheme.text.primary}>{t('Verwandte Titel')}</SectionTitle>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {relations.map((rel) => (
              <div
                key={rel.node.id}
                role="button"
                tabIndex={0}
                aria-label={rel.node.title.english || rel.node.title.romaji}
                onClick={() => navigate(`/manga/${rel.node.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/manga/${rel.node.id}`);
                  }
                }}
                style={{ width: 90, flexShrink: 0, cursor: 'pointer' }}
              >
                <img
                  src={rel.node.coverImage.large}
                  alt={rel.node.title.english || rel.node.title.romaji}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                  loading="lazy"
                  decoding="async"
                />
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    color: currentTheme.text.secondary,
                    opacity: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {rel.relationType.replace(/_/g, ' ')}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: currentTheme.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {rel.node.title.english || rel.node.title.romaji}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {recommendations.length > 0 && (
        <Section bg={`${currentTheme.text.primary}08`} delay={0.45}>
          <SectionTitle color={currentTheme.text.primary}>{t('Empfehlungen')}</SectionTitle>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {recommendations.map((rec) => {
              const m = rec.node.mediaRecommendation;
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-label={m.title.english || m.title.romaji}
                  onClick={() => navigate(`/manga/${m.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/manga/${m.id}`);
                    }
                  }}
                  style={{ width: 90, flexShrink: 0, cursor: 'pointer' }}
                >
                  <img
                    src={m.coverImage.large}
                    alt={m.title.english || m.title.romaji}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      marginTop: 4,
                      color: currentTheme.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.title.english || m.title.romaji}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {externalLinks.length > 0 && (
        <Section bg={`${currentTheme.text.primary}08`} delay={0.5}>
          <SectionTitle color={currentTheme.text.primary}>Links</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a
              href={`https://anilist.co/manga/${anilistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="manga-detail-link-btn"
              style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}30` }}
            >
              <Link style={{ fontSize: 14 }} /> AniList
              <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
            </a>
            {externalLinks.slice(0, 5).map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="manga-detail-link-btn"
                style={{
                  color: currentTheme.text.secondary,
                  borderColor: `${currentTheme.text.primary}15`,
                }}
              >
                <Link style={{ fontSize: 14 }} /> {link.site}
                <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
              </a>
            ))}
          </div>
        </Section>
      )}

      <Section delay={0.55} className="manga-detail-section--wide">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
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
              className="manga-detail-action-btn"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ color: '#ef4444' }}
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
                className="manga-detail-delete-confirm-btn"
                onClick={onDelete}
                style={{ background: '#ef444420', color: '#ef4444' }}
              >
                {t('Ja')}
              </button>
              <button
                className="manga-detail-delete-confirm-btn"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: `${currentTheme.text.primary}10`,
                  color: currentTheme.text.secondary,
                }}
              >
                {t('Nein')}
              </button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};
