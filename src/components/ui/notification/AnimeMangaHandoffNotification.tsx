import { MenuBook, Tv } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { hapticTap } from '../../../lib/interaction/haptics';
import {
  markAnimeMangaHandoffDismissed,
  type AnimeMangaHandoff,
} from '../../../services/detection/animeMangaHandoffDetection';
import { t } from '../../../services/i18n';
import { getImageUrl } from '../../../utils/imageUrl';
import { HintCard, HintDeck, HintProgress } from './HintDeck';

interface AnimeMangaHandoffNotificationProps {
  handoffs: AnimeMangaHandoff[];
  /** Kategorie aus der Ansicht nehmen, wenn alle Handoffs abgearbeitet sind. */
  onDismiss: () => void;
}

const handoffKey = (h: AnimeMangaHandoff) => `${h.series.id}-${h.seasonNumber}`;

/**
 * F9 „Manga-Anschluss": Anime-Staffel durch, Quell-Manga bekannt — „lies den
 * Manga ab ~Kapitel X weiter" (KI-Schätzung, klar gelabelt).
 */
export const AnimeMangaHandoffNotification: React.FC<AnimeMangaHandoffNotificationProps> = ({
  handoffs,
  onDismiss,
}) => {
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const { mangaList } = useMangaList();
  const navigate = useNavigate();
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  const visible = handoffs.filter((h) => !doneKeys.has(handoffKey(h)));
  if (visible.length === 0) return null;

  const color = currentTheme.accent || currentTheme.primary;

  const finish = (h: AnimeMangaHandoff) => {
    if (user) void markAnimeMangaHandoffDismissed(user.uid, h.series.id, h.seasonNumber);
    if (visible.length <= 1) onDismiss();
    else setDoneKeys((prev) => new Set(prev).add(handoffKey(h)));
  };

  const handleGoToManga = (h: AnimeMangaHandoff) => {
    hapticTap();
    if (user) void markAnimeMangaHandoffDismissed(user.uid, h.series.id, h.seasonNumber);
    navigate(`/manga/${h.mangaId}`);
  };

  const handleDismissAll = () => {
    if (user) {
      visible.forEach(
        (h) => void markAnimeMangaHandoffDismissed(user.uid, h.series.id, h.seasonNumber)
      );
    }
    onDismiss();
  };

  return (
    <HintDeck
      color={color}
      Icon={MenuBook}
      title={t('Manga-Anschluss')}
      count={visible.length}
      onDismissAll={handleDismissAll}
    >
      {visible.map((h) => {
        const tracked = mangaList.some((m) => m.anilistId === h.mangaId);
        return (
          <HintCard
            key={handoffKey(h)}
            title={h.mangaTitle}
            poster={getImageUrl(h.series.poster, 'w342', '') || undefined}
            backdrop={getImageUrl(h.series.backdrop, 'w780', '') || undefined}
            DetailIcon={Tv}
            detail={`${h.series.title || t('Serie')} · ${t('Staffel {staffel}', { staffel: h.seasonNumber })}`}
            extra={
              <>
                <p className="hint-card-note">
                  {t('Anime endet ca. bei Kapitel {kapitel}', { kapitel: h.estimatedChapter })}{' '}
                  <em>{t('(KI-Schätzung)')}</em>
                </p>
                {h.totalChapters && h.totalChapters > 0 ? (
                  <HintProgress
                    percent={(h.estimatedChapter / h.totalChapters) * 100}
                    label={`~${h.estimatedChapter} / ${h.totalChapters}`}
                  />
                ) : null}
              </>
            }
            onOpen={() => handleGoToManga(h)}
            onDismiss={() => {
              hapticTap();
              finish(h);
            }}
            actions={
              <>
                <button
                  type="button"
                  className="hint-btn hint-btn--ghost"
                  onClick={() => {
                    hapticTap();
                    finish(h);
                  }}
                >
                  <span>{t('Später')}</span>
                </button>
                <button
                  type="button"
                  className="hint-btn hint-btn--primary"
                  onClick={() => handleGoToManga(h)}
                >
                  <MenuBook />
                  <span>{tracked ? t('Weiterlesen') : t('Zum Manga')}</span>
                </button>
              </>
            }
          />
        );
      })}
    </HintDeck>
  );
};
