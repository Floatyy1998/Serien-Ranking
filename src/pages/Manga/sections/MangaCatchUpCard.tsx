import { Schedule } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconContainer, NavCard } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';

export const MangaCatchUpCard: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const { seriesCount, totalChapters } = useMemo(() => {
    let count = 0;
    let chapters = 0;

    for (const manga of mangaList) {
      if (
        manga.readStatus === 'reading' &&
        manga.chapters &&
        manga.chapters > 0 &&
        manga.currentChapter < manga.chapters
      ) {
        count++;
        chapters += manga.chapters - manga.currentChapter;
      }
    }

    return { seriesCount: count, totalChapters: chapters };
  }, [mangaList]);

  if (seriesCount === 0) return null;

  return (
    <NavCard onClick={() => navigate('/manga/catch-up')} accentColor={currentTheme.accent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <IconContainer color={currentTheme.accent} size={40} borderRadius={12}>
          <Schedule style={{ fontSize: 20 }} />
        </IconContainer>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentTheme.text.primary,
              fontFamily: 'var(--font-display)',
            }}
          >
            Aufholen
          </div>
          <div style={{ fontSize: 12, color: currentTheme.text.secondary, opacity: 0.7 }}>
            {seriesCount} Manga · {totalChapters} Kapitel offen
          </div>
        </div>
      </div>
    </NavCard>
  );
});
