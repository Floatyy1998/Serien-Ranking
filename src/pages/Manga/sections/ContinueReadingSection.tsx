/**
 * ContinueReadingSection - Exact same pattern as ContinueWatchingSection
 * Uses SwipeableEpisodeRow with swipe-to-mark-chapter-read, undo toast, etc.
 */
import { MenuBook } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useContinueReading } from '../../../hooks/useContinueReading';
import { logChapterRead } from '../../../services/readActivityService';
import { getDisplayFormat } from '../mangaUtils';

function formatLastRead(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Gerade eben';
  if (mins < 60) return `Vor ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gestern';
  if (days < 7) return `Vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Vor ${weeks} Woche${weeks > 1 ? 'n' : ''}`;
  const months = Math.floor(days / 30);
  return `Vor ${months} Monat${months > 1 ? 'en' : ''}`;
}

export const ContinueReadingSection: React.FC<{ onFilterReading?: () => void }> = React.memo(
  ({ onFilterReading }) => {
    const items = useContinueReading();
    const { currentTheme } = useTheme();
    const { user } = useAuth() || {};
    const { mangaList } = useMangaList();
    const navigate = useNavigate();

    // Swipe state - same pattern as useEpisodeSwipeHandlers
    const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
    const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
    const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
    const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

    const handleComplete = useCallback(
      async (item: (typeof items)[0], direction: 'left' | 'right' = 'right') => {
        if (!user) return;
        const manga = mangaList.find((m) => m.anilistId === item.anilistId);
        if (!manga) return;

        const key = String(item.anilistId);
        const newChapter = item.currentChapter + 1;

        // 1. Brief completing flash, then immediately update Firebase
        // Unlike series (where episode disappears), manga stays in list with updated chapter
        setSwipeDirections((prev) => ({ ...prev, [key]: direction }));
        setCompletingEpisodes((prev) => new Set(prev).add(key));
        setTimeout(() => {
          setCompletingEpisodes((prev) => {
            const s = new Set(prev);
            s.delete(key);
            return s;
          });
        }, 250);

        // 2. Firebase update - realtime listener will refresh the data instantly
        const updates: Record<string, unknown> = {
          currentChapter: newChapter,
          lastReadAt: new Date().toISOString(),
        };
        if (manga.readStatus === 'planned') {
          updates.readStatus = 'reading';
          if (!manga.startedAt) updates.startedAt = new Date().toISOString();
        }
        const effectiveTotal = manga.chapters || manga.latestChapterAvailable;
        if (effectiveTotal && newChapter >= effectiveTotal) {
          updates.readStatus = 'completed';
          updates.completedAt = new Date().toISOString();
        }

        await firebase.database().ref(`${user.uid}/manga/${item.anilistId}`).update(updates);
        await logChapterRead(user.uid, manga, newChapter, item.currentChapter);
      },
      [user, mangaList]
    );

    if (items.length === 0) return null;

    const accentColor = currentTheme.accent;

    return (
      <section style={{ marginBottom: 32 }}>
        <SectionHeader
          icon={<MenuBook />}
          iconColor={accentColor}
          title="Weiterlesen"
          onSeeAll={onFilterReading}
          seeAllLabel="Alle"
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '0 20px',
            position: 'relative',
          }}
        >
          {items.slice(0, 6).map((item) => {
            const key = String(item.anilistId);
            const effectiveTotal = item.totalChapters;
            const format = getDisplayFormat(item.countryOfOrigin, item.format);

            return (
              <SwipeableEpisodeRow
                key={key}
                itemKey={key}
                poster={item.poster}
                posterAlt={item.title}
                accentColor={accentColor}
                isCompleting={completingEpisodes.has(key)}
                isSwiping={swipingEpisodes.has(key)}
                dragOffset={dragOffsets[key] || 0}
                swipeDirection={swipeDirections[key]}
                canSwipe={true}
                onSwipeStart={() => setSwipingEpisodes((prev) => new Set(prev).add(key))}
                onSwipeDrag={(offset) => setDragOffsets((prev) => ({ ...prev, [key]: offset }))}
                onSwipeEnd={() => {
                  setSwipingEpisodes((prev) => {
                    const s = new Set(prev);
                    s.delete(key);
                    return s;
                  });
                  setDragOffsets((prev) => ({ ...prev, [key]: 0 }));
                }}
                onComplete={(direction) => handleComplete(item, direction)}
                onPosterClick={() => navigate(`/manga/${item.anilistId}`)}
                action={null}
                content={
                  <>
                    <h3
                      style={{
                        fontSize: 'clamp(13px, 3.5vw, 16px)',
                        fontWeight: 700,
                        margin: '0 0 2px 0',
                        color: currentTheme.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 'clamp(11px, 3vw, 14px)',
                        margin: 0,
                        color: accentColor,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Kap. {item.currentChapter}
                      {effectiveTotal ? ` / ${effectiveTotal}` : ''}
                      {effectiveTotal && item.currentChapter < effectiveTotal
                        ? ` · ${effectiveTotal - item.currentChapter} übrig`
                        : ` · ${format}`}
                    </p>
                    <p
                      style={{
                        fontSize: 'clamp(10px, 2.5vw, 13px)',
                        margin: '2px 0 0 0',
                        color: currentTheme.text.secondary,
                        opacity: 0.6,
                      }}
                    >
                      {item.lastReadAt ? formatLastRead(item.lastReadAt) : ''}
                    </p>
                    {/* Progress bar */}
                    {item.progress > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          height: 4,
                          borderRadius: 2,
                          background: `${currentTheme.text.primary}12`,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.progress}%`,
                            height: '100%',
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      </section>
    );
  }
);
