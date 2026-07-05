import {
  Check,
  CheckCircle,
  Delete,
  Edit,
  Link,
  OpenInNew,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import type { MangaDexChapterInfo } from '../../../services/mangadexService';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import { inferStatus } from '../mangaUtils';
import { Section, SectionTitle } from './Section';

// Status-Optionen als Funktion, damit "Geplant" die Theme-Secondary-Farbe nutzt
// (Farben werden mit Hex-Alpha-Suffix kombiniert, daher kein var() möglich)
const getStatusOptions = (
  secondaryColor: string
): { value: Manga['readStatus']; label: string; color: string }[] => [
  { value: 'reading', label: 'Lese ich', color: '#3b82f6' },
  { value: 'completed', label: 'Abgeschlossen', color: '#22c55e' },
  { value: 'paused', label: 'Pausiert', color: '#f59e0b' },
  { value: 'dropped', label: 'Abgebrochen', color: '#ef4444' },
  { value: 'planned', label: 'Geplant', color: secondaryColor },
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
  editingNotes: boolean;
  setEditingNotes: (v: boolean) => void;
  notesValue: string;
  setNotesValue: (v: string) => void;
  showCustomPlatform: boolean;
  setShowCustomPlatform: (v: boolean) => void;
  customPlatform: string;
  setCustomPlatform: (v: string) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  // handlers
  onStatusChange: (status: Manga['readStatus']) => void;
  onChapterChange: (chapter: number) => void;
  onRating: (rating: number) => void;
  onPlatformSelect: (platform: string) => void;
  onSaveNotes: () => void;
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
  editingNotes,
  setEditingNotes,
  notesValue,
  setNotesValue,
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
  onSaveNotes,
  onToggleHide,
  onDelete,
}: MangaDetailBodyProps) => {
  const navigate = useNavigate();
  const notesRef = useRef<HTMLTextAreaElement>(null);

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
          <Section bg={`${currentTheme.text.primary}08`} delay={0.12}>
            <SectionTitle color={currentTheme.text.primary}>Kapitel-Releases</SectionTitle>

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
                      Nächstes Kapitel ~
                      {new Date(chapterInfo.estimatedNextDate).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    {chapterInfo.avgDaysBetweenReleases && (
                      <div
                        style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.7 }}
                      >
                        Erscheint ca. alle {chapterInfo.avgDaysBetweenReleases} Tage
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      Kap. {ch.chapter}
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
                      {new Date(ch.publishedAt).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {isConfirming ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span
                          style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.8 }}
                        >
                          Zurücksetzen?
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
                          Ja
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
                          Nein
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="manga-chapter-read-btn"
                        aria-label={
                          isRead
                            ? `Fortschritt auf Kapitel ${ch.chapter} zurücksetzen`
                            : `Bis Kapitel ${ch.chapter} als gelesen markieren`
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
        <SectionTitle color={currentTheme.text.primary}>Bewertung</SectionTitle>
        <div className="manga-detail-rating">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              className="manga-detail-star-btn"
              aria-label={`${star} von 10 Sternen`}
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
        <SectionTitle color={currentTheme.text.primary}>Lese-Plattform</SectionTitle>
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
              + Andere
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Plattform..."
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
            Aktuell: {manga.readingPlatform}
          </div>
        )}
      </Section>

      <Section bg={`${currentTheme.text.primary}08`} delay={0.3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle color={currentTheme.text.primary}>Notizen</SectionTitle>
          <button
            onClick={() => {
              if (editingNotes) onSaveNotes();
              else setEditingNotes(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: currentTheme.primary,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit style={{ fontSize: 14 }} />
            {editingNotes ? 'Speichern' : 'Bearbeiten'}
          </button>
        </div>
        {editingNotes ? (
          <textarea
            ref={notesRef}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Deine Notizen zu diesem Manga..."
            style={{
              width: '100%',
              minHeight: 80,
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
        ) : (
          <p
            style={{
              fontSize: 14,
              color: currentTheme.text.secondary,
              opacity: manga.notes ? 1 : 0.4,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {manga.notes || 'Keine Notizen vorhanden.'}
          </p>
        )}
      </Section>

      {cleanDescription && (
        <Section bg={`${currentTheme.text.primary}08`} delay={0.35}>
          <SectionTitle color={currentTheme.text.primary}>Beschreibung</SectionTitle>
          <p className="manga-detail-description" style={{ color: currentTheme.text.secondary }}>
            {cleanDescription}
          </p>
        </Section>
      )}

      {relations.length > 0 && (
        <Section bg={`${currentTheme.text.primary}08`} delay={0.4}>
          <SectionTitle color={currentTheme.text.primary}>Verwandte Titel</SectionTitle>
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
          <SectionTitle color={currentTheme.text.primary}>Empfehlungen</SectionTitle>
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

      <Section delay={0.55}>
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
            {manga.hidden ? 'Einblenden' : 'Verstecken'}
          </button>

          {!showDeleteConfirm ? (
            <button
              className="manga-detail-action-btn"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ color: '#ef4444' }}
            >
              <Delete style={{ fontSize: 18 }} />
              Entfernen
            </button>
          ) : (
            <div className="manga-detail-delete-confirm">
              <span style={{ color: currentTheme.text.secondary, fontSize: 14 }}>
                Wirklich entfernen?
              </span>
              <button
                className="manga-detail-delete-confirm-btn"
                onClick={onDelete}
                style={{ background: '#ef444420', color: '#ef4444' }}
              >
                Ja
              </button>
              <button
                className="manga-detail-delete-confirm-btn"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: `${currentTheme.text.primary}10`,
                  color: currentTheme.text.secondary,
                }}
              >
                Nein
              </button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};
