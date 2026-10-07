import { StarHalf } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconContainer, NavCard } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRatingQueue } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';

export const MangaRatingQueueCard: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const queue = useMemo(() => getRatingQueue(mangaList, user?.uid), [mangaList, user?.uid]);

  if (queue.length === 0) return null;
  const next = queue[0];
  const color = currentTheme.status?.warning || currentTheme.accent;

  return (
    <NavCard onClick={() => navigate(`/manga/${next.anilistId}#rating`)} accentColor={color}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
        <IconContainer color={color} size={40} borderRadius={12}>
          <StarHalf style={{ fontSize: 20 }} />
        </IconContainer>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentTheme.text.primary,
              fontFamily: 'var(--font-display)',
            }}
          >
            {queue.length === 1
              ? t('1 Manga wartet auf deine Bewertung')
              : t('{n} Manga warten auf deine Bewertung', { n: queue.length })}
          </div>
          <div
            style={{
              fontSize: 12,
              color: currentTheme.text.secondary,
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('Weiter mit „{title}“', { title: next.title })}
          </div>
        </div>
      </div>
    </NavCard>
  );
});
