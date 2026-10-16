import { AutoStories } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAppFocus } from '../../../hooks/ui/useAppFocus';
import { hapticTap } from '../../../lib/interaction/haptics';
import { tapScaleTight } from '../../../lib/motion';
import { showToast } from '../../../lib/interaction/toast';
import { suggestsReadingHome } from '../../../lib/settings/focusSuggestion';
import { t } from '../../../services/i18n';
import { setAppFocus, type AppFocus } from '../../../services/settings/appFocus';
import { getOptimalTextColor } from '../../../theme/colorUtils';

/** Einmaliger Vorschlag für Bestandskonten, die mehr lesen als schauen. Jede Antwort gilt als Wahl. */
export const FocusSuggestionCard = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { chosen, loaded } = useAppFocus();
  const { allSeriesList, loading: seriesLoading } = useSeriesList();
  const { movieList, loading: moviesLoading } = useMovieList();
  const { allMangaList, loading: mangaLoading } = useMangaList();
  const { bookList, loading: booksLoading } = useBooksList();
  const [answered, setAnswered] = useState(false);

  const ready = loaded && !seriesLoading && !moviesLoading && !mangaLoading && !booksLoading;
  const read = allMangaList.length + bookList.length;
  const watch = allSeriesList.length + movieList.length;
  if (!user || answered || chosen || !ready || !suggestsReadingHome({ watch, read })) return null;

  const answer = (focus: AppFocus) => {
    hapticTap();
    setAnswered(true);
    setAppFocus(user.uid, focus).catch(() => {
      setAnswered(false);
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass"
      style={{ margin: '0 16px 20px', borderRadius: 'var(--radius-xl)', padding: '14px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--theme-primary-12)',
            border: '1px solid var(--theme-primary-25)',
            color: currentTheme.primary,
          }}
        >
          <AutoStories />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: currentTheme.text.secondary,
              marginBottom: 2,
            }}
          >
            {t('Du liest mehr, als du schaust')}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: currentTheme.text.muted }}>
            {t(
              '{read} Manga und Bücher, {watch} Serien und Filme. Soll deine Startseite das Lesen zeigen? Umstellen kannst du jederzeit in den Einstellungen.',
              { read, watch }
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <motion.button
          whileTap={tapScaleTight}
          onClick={() => answer('watch')}
          style={{
            flex: 1,
            padding: '11px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--glass-border-light)',
            background: 'var(--glass-light)',
            color: currentTheme.text.secondary,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('Nein, so lassen')}
        </motion.button>
        <motion.button
          whileTap={tapScaleTight}
          onClick={() => answer('read')}
          style={{
            flex: 1,
            padding: '11px 14px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: currentTheme.primary,
            color: getOptimalTextColor(currentTheme.primary),
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('Lese-Startseite')}
        </motion.button>
      </div>
    </motion.div>
  );
};
