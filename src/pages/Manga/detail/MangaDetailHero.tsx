import { Add, Remove } from '@mui/icons-material';
import { BackButton } from '../../../components/ui';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import type { Manga } from '../../../types/Manga';
import { getDisplayFormat, getStatusLabel } from '../mangaUtils';

interface MangaDetailHeroProps {
  manga: Manga;
  currentTheme: ThemeContextType['currentTheme'];
  isMobile: boolean;
  editChapter: number;
  effectiveChapters: number | null;
  progress: number;
  staff: Array<{ role: string; node: { name: { full: string } } }>;
  onChapterChange: (next: number) => void;
}

export const MangaDetailHero = ({
  manga,
  currentTheme,
  isMobile,
  editChapter,
  effectiveChapters,
  progress,
  staff,
  onChapterChange,
}: MangaDetailHeroProps) => {
  const displayFormat = getDisplayFormat(manga.countryOfOrigin, manga.format);
  const backdrop = manga.bannerImage || manga.poster;

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', minHeight: isMobile ? undefined : 420 }}
    >
      {/* Backdrop: blurred poster on mobile, banner on desktop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${backdrop})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: isMobile ? 'blur(50px) brightness(0.25) saturate(1.8)' : 'brightness(0.35)',
          transform: isMobile ? 'scale(1.3)' : 'none',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: isMobile ? '60%' : '80%',
          zIndex: 1,
          background: `linear-gradient(transparent, ${currentTheme.background.default})`,
          pointerEvents: 'none',
        }}
      />
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, rgba(10,14,26,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: 'calc(12px + env(safe-area-inset-top))',
          left: isMobile ? 12 : 20,
          zIndex: 100,
          pointerEvents: 'auto',
        }}
      >
        <BackButton style={{ backdropFilter: 'blur(10px)' }} />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: 'calc(64px + env(safe-area-inset-top))',
          paddingBottom: isMobile ? 20 : 36,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'stretch',
          gap: isMobile ? 0 : 32,
          ...(isMobile
            ? {}
            : { maxWidth: 1100, margin: '0 auto', paddingLeft: 48, paddingRight: 48 }),
        }}
      >
        {/* Poster — shared view-transition target (matches Manga listing). */}
        <img
          src={manga.poster}
          alt={manga.title}
          style={{
            width: isMobile ? 150 : 220,
            height: isMobile ? 220 : 325,
            borderRadius: isMobile ? 14 : 16,
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: isMobile ? 20 : 0,
            viewTransitionName: `poster-manga-${manga.anilistId}`,
          }}
        />

        <div
          style={{
            ...(isMobile
              ? { width: '100%' }
              : {
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  background: 'rgba(10, 14, 26, 0.55)',
                  backdropFilter: 'blur(24px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                  borderRadius: 20,
                  padding: '24px 28px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }),
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? 24 : 32,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              margin: isMobile ? '0 20px 4px' : '0 0 6px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#fff',
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            {manga.title}
          </h1>

          {manga.titleRomaji && manga.titleRomaji !== manga.title && (
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                textAlign: isMobile ? 'center' : 'left',
                padding: isMobile ? '0 20px' : 0,
                marginBottom: 2,
              }}
            >
              {manga.titleRomaji}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: '3px 8px',
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 8,
              padding: isMobile ? '0 20px' : 0,
            }}
          >
            <span style={{ fontWeight: 600, color: currentTheme.primary }}>{displayFormat}</span>
            {manga.status && <span>{getStatusLabel(manga)}</span>}
            {effectiveChapters && <span>{effectiveChapters} Kapitel</span>}
            {manga.averageScore && <span>⭐ {manga.averageScore}%</span>}
          </div>

          {staff.length > 0 && (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
                marginTop: 6,
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              {staff
                .filter(
                  (s) =>
                    s.role.toLowerCase().includes('story') || s.role.toLowerCase().includes('art')
                )
                .slice(0, 2)
                .map((s) => s.node.name.full)
                .join(' · ')}
            </div>
          )}

          {manga.genres && manga.genres.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: 6,
                padding: isMobile ? '0 20px' : 0,
                marginTop: 12,
              }}
            >
              {manga.genres.slice(0, 5).map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '4px 12px',
                    borderRadius: 999,
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: isMobile ? 14 : 'auto',
              padding: isMobile ? '0 20px' : 0,
              paddingTop: isMobile ? 0 : 16,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: 2,
                }}
              >
                <button
                  onClick={() => onChapterChange(editChapter - 1)}
                  className="manga-hero-stepper"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Remove style={{ fontSize: 20 }} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={editChapter}
                  key={editChapter}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1) {
                      const clamped = effectiveChapters ? Math.min(v, effectiveChapters) : v;
                      onChapterChange(clamped);
                      e.target.value = String(clamped);
                    } else {
                      e.target.value = String(editChapter);
                    }
                  }}
                  onInput={(e) => {
                    const el = e.target as HTMLInputElement;
                    el.style.width = `${Math.max(el.value.length, 1) * 15 + 6}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="manga-detail-counter-input manga-hero-chapter-input"
                  style={{
                    width: `${Math.max(String(editChapter).length, 1) * 15 + 6}px`,
                  }}
                />
                <button
                  onClick={() => onChapterChange(editChapter + 1)}
                  className="manga-hero-stepper"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Add style={{ fontSize: 20 }} />
                </button>
                {effectiveChapters && (
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.2)',
                      fontSize: 13,
                      fontWeight: 500,
                      marginLeft: 4,
                    }}
                  >
                    von {effectiveChapters} Kapiteln
                  </span>
                )}
              </div>

              {effectiveChapters && effectiveChapters > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        transition: 'width 0.5s ease',
                        boxShadow: `0 0 8px ${currentTheme.primary}50`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
