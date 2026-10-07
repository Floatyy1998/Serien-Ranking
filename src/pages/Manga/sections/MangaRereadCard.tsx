import { Replay } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconContainer, NavCard } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRereadPicks, userMangaRating } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';

export const MangaRereadCard: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const pick = useMemo(() => getRereadPicks(mangaList, user?.uid)[0], [mangaList, user?.uid]);

  if (!pick) return null;
  const color = currentTheme.secondary || currentTheme.primary;

  return (
    <NavCard onClick={() => navigate(`/manga/${pick.anilistId}`)} accentColor={color}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
        <img
          src={pick.poster}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: 40, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentTheme.text.primary,
              fontFamily: 'var(--font-display)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('Mal wieder „{title}“?', { title: pick.title })}
          </div>
          <div style={{ fontSize: 12, color: currentTheme.text.secondary, opacity: 0.7 }}>
            {t('Du hast ihn mit {n}/10 bewertet', { n: userMangaRating(pick, user?.uid) })}
          </div>
        </div>
        <IconContainer color={color} size={34} borderRadius={10}>
          <Replay style={{ fontSize: 18 }} />
        </IconContainer>
      </div>
    </NavCard>
  );
});
