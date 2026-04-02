import { LibraryAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';

import { getDisplayFormat } from '../mangaUtils';

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Gerade eben';
  if (minutes < 60) return `Vor ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gestern';
  return `Vor ${days} Tagen`;
}

export const RecentlyAddedMangaSection: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const recentManga = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return mangaList
      .filter((m) => m.addedAt && new Date(m.addedAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime())
      .slice(0, 10);
  }, [mangaList]);

  if (recentManga.length === 0) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeader
        icon={<LibraryAdd />}
        iconColor={currentTheme.accent}
        title="Kürzlich hinzugefügt"
      />
      <HorizontalScrollContainer>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px' }}>
          {recentManga.map((manga) => (
            <motion.div
              key={manga.anilistId}
              style={{
                width: 110,
                flexShrink: 0,
                cursor: 'pointer',
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/manga/${manga.anilistId}`)}
            >
              <div
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  aspectRatio: '2/3',
                  marginBottom: 6,
                  position: 'relative',
                }}
              >
                <img
                  src={manga.poster}
                  alt={manga.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {manga.format && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      fontSize: 8,
                      fontWeight: 600,
                      padding: '2px 5px',
                      borderRadius: 4,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      textTransform: 'uppercase',
                    }}
                  >
                    {getDisplayFormat(manga.countryOfOrigin, manga.format)}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}
              >
                {manga.title}
              </div>
              {manga.addedAt && (
                <div
                  style={{
                    fontSize: 10,
                    color: currentTheme.text.secondary,
                    opacity: 0.6,
                    marginTop: 1,
                  }}
                >
                  {formatRelative(manga.addedAt)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </HorizontalScrollContainer>
    </section>
  );
});
