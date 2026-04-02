import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';

export const HiddenMangaPage = () => {
  const { currentTheme } = useTheme();
  const { hiddenMangaList, toggleHideManga } = useMangaList();
  const navigate = useNavigate();

  const mangaWithStats = useMemo(
    () =>
      hiddenMangaList.map((manga) => ({
        manga,
        progress:
          manga.chapters && manga.chapters > 0 ? (manga.currentChapter / manga.chapters) * 100 : 0,
      })),
    [hiddenMangaList]
  );

  return (
    <PageLayout>
      <PageHeader
        title="Versteckte Manga"
        gradientFrom={currentTheme.text.secondary}
        subtitle={
          hiddenMangaList.length > 0 ? `${hiddenMangaList.length} Manga versteckt` : undefined
        }
        icon={<VisibilityOff />}
      />

      <div style={{ padding: '0 16px', paddingBottom: 100 }}>
        <AnimatePresence mode="popLayout">
          {mangaWithStats.map(({ manga, progress }) => (
            <motion.div
              key={manga.anilistId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              onClick={() => navigate(`/manga/${manga.anilistId}`)}
              style={{
                display: 'flex',
                gap: 14,
                padding: 14,
                borderRadius: 14,
                background: `${currentTheme.text.primary}06`,
                marginBottom: 10,
                cursor: 'pointer',
                alignItems: 'center',
              }}
            >
              <img
                src={manga.poster}
                alt={manga.title}
                style={{
                  width: 50,
                  height: 70,
                  borderRadius: 8,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                loading="lazy"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: currentTheme.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {manga.title}
                </div>
                <div style={{ fontSize: 12, color: currentTheme.text.secondary, marginTop: 2 }}>
                  Kap. {manga.currentChapter}
                  {manga.chapters ? ` / ${manga.chapters}` : ''} ·{' '}
                  {manga.chapters ? `${Math.round(progress)}%` : '—'}
                </div>
                {manga.chapters && (
                  <div
                    style={{
                      height: 3,
                      borderRadius: 2,
                      background: `${currentTheme.text.primary}10`,
                      marginTop: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: currentTheme.primary,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideManga(manga.anilistId, false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: `${currentTheme.primary}15`,
                  color: currentTheme.primary,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  flexShrink: 0,
                }}
              >
                <Visibility style={{ fontSize: 16 }} />
                Weiter
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>

        {hiddenMangaList.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👁️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: currentTheme.text.primary }}>
              Keine versteckten Manga
            </div>
            <div
              style={{
                fontSize: 14,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              Verstecke Manga über die Detail-Seite, wenn du eine Pause machen möchtest.
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
