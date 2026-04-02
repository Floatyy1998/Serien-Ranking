import { VisibilityOff } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconContainer, NavCard } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';

export const HiddenMangaCard: React.FC = React.memo(() => {
  const { hiddenMangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  if (hiddenMangaList.length === 0) return null;

  const count = hiddenMangaList.length;

  return (
    <NavCard onClick={() => navigate('/manga/hidden')} accentColor={currentTheme.text.secondary}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <IconContainer color={currentTheme.text.secondary} size={40} borderRadius={12}>
          <VisibilityOff style={{ fontSize: 20 }} />
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
            Versteckte Manga
          </div>
          <div style={{ fontSize: 12, color: currentTheme.text.secondary, opacity: 0.7 }}>
            {count} {count === 1 ? 'Manga' : 'Manga'} pausiert
          </div>
        </div>
      </div>
    </NavCard>
  );
});
