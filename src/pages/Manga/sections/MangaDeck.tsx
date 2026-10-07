import { AutoStories, Search, Tune } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HeaderActions } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getNewChapterEntries } from '../../../lib/manga/overview';
import { tapScaleSmall } from '../../../lib/motion';
import { t } from '../../../services/i18n';

interface MangaDeckProps {
  photoURL?: string | null;
  displayName?: string | null;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  onShowCollection: () => void;
}

export const MangaDeck: React.FC<MangaDeckProps> = React.memo(
  ({ photoURL, displayName, totalUnreadBadge, onNotificationsOpen, onShowCollection }) => {
    const { currentTheme } = useTheme();
    const { mangaList } = useMangaList();
    const navigate = useNavigate();
    const [now] = useState(() => Date.now());

    const summary = useMemo(() => {
      let reading = 0;
      let chapters = 0;
      let completed = 0;
      for (const m of mangaList) {
        if (m.readStatus === 'reading') reading += 1;
        if (m.readStatus === 'completed') completed += 1;
        chapters += m.currentChapter || 0;
      }
      const fresh = getNewChapterEntries(mangaList, now);
      const newChapters = fresh.reduce((sum, e) => sum + e.unread, 0);
      const art = [...mangaList]
        .filter((m) => m.bannerImage)
        .sort(
          (a, b) =>
            new Date(b.lastReadAt || b.addedAt || 0).getTime() -
            new Date(a.lastReadAt || a.addedAt || 0).getTime()
        )[0]?.bannerImage;
      return { reading, chapters, completed, newChapters, art };
    }, [mangaList, now]);

    const pods = [
      {
        key: 'reading',
        value: summary.reading,
        label: t('Am Lesen'),
        onClick: () => navigate('/manga/reading-list'),
        highlight: false,
      },
      ...(summary.newChapters > 0
        ? [
            {
              key: 'new',
              value: summary.newChapters,
              label: t('Neu'),
              onClick: () => navigate('/manga/catch-up'),
              highlight: true,
            },
          ]
        : []),
      {
        key: 'chapters',
        value: summary.chapters.toLocaleString(),
        label: t('Kapitel'),
        onClick: () => navigate('/manga/stats'),
        highlight: false,
      },
      {
        key: 'collection',
        value: mangaList.length,
        label: t('Sammlung'),
        onClick: onShowCollection,
        highlight: false,
      },
    ];

    return (
      <header className="manga-deck-wrap">
        <motion.div
          className="manga-deck liquid-glass"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {summary.art && (
            <div
              className="manga-deck-art"
              aria-hidden
              style={{ backgroundImage: `url(${summary.art})` }}
            />
          )}
          <div
            className="manga-deck-glow"
            aria-hidden
            style={{
              background: `radial-gradient(ellipse, ${currentTheme.primary}33, transparent 70%)`,
            }}
          />

          <div className="manga-deck-top">
            <div style={{ minWidth: 0, flex: 1 }}>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 1.2vw + 16px, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.16,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                }}
              >
                <AutoStories style={{ fontSize: '0.95em', color: currentTheme.primary }} />
                Manga
              </GradientText>
              <p className="manga-deck-sub" style={{ color: currentTheme.text.secondary }}>
                {mangaList.length > 0
                  ? summary.completed > 0
                    ? t('{n} Titel · {m} abgeschlossen', {
                        n: mangaList.length,
                        m: summary.completed,
                      })
                    : t('{n} Titel in deiner Sammlung', { n: mangaList.length })
                  : t('Deine Manga-Sammlung')}
              </p>
            </div>

            <div className="manga-deck-actions">
              <motion.button
                type="button"
                whileTap={tapScaleSmall}
                className="manga-deck-icon-btn"
                onClick={() => navigate('/manga/layout')}
                aria-label={t('Manga-Übersicht anpassen')}
                title={t('Übersicht anpassen')}
                style={{ color: currentTheme.text.secondary }}
              >
                <Tune style={{ fontSize: 20 }} />
              </motion.button>
              <HeaderActions
                totalUnreadBadge={totalUnreadBadge}
                onNotificationsOpen={onNotificationsOpen}
                photoURL={photoURL}
                displayName={displayName ?? undefined}
              />
            </div>
          </div>

          <div className="manga-deck-row">
            <motion.button
              type="button"
              whileTap={tapScaleSmall}
              onClick={() => navigate('/manga/search')}
              aria-label={t('Manga suchen')}
              className="manga-deck-search"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 45%), var(--glass-light)`,
                borderColor: `${currentTheme.primary}33`,
              }}
            >
              <Search style={{ fontSize: 20, color: currentTheme.primary, flexShrink: 0 }} />
              <span className="manga-deck-search-hint" style={{ color: currentTheme.text.muted }}>
                {t('Manga, Manhwa, Manhua suchen...')}
              </span>
            </motion.button>

            {mangaList.length > 0 &&
              pods.map((pod) => (
                <motion.button
                  key={pod.key}
                  type="button"
                  whileTap={tapScaleSmall}
                  onClick={pod.onClick}
                  aria-label={`${pod.value} ${pod.label}`}
                  className={`manga-deck-pod ${pod.highlight ? 'manga-deck-pod--hot' : ''}`}
                >
                  <span
                    className="manga-deck-pod-value"
                    style={{
                      color: pod.highlight ? currentTheme.primary : currentTheme.text.primary,
                    }}
                  >
                    {pod.value}
                  </span>
                  <span className="manga-deck-pod-label" style={{ color: currentTheme.text.muted }}>
                    {pod.label}
                  </span>
                </motion.button>
              ))}
          </div>
        </motion.div>
      </header>
    );
  }
);
