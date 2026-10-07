import { Add, CheckCircle, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { mangaProgressPercent, mangaTotalChapters } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import {
  FORMAT_COLORS,
  getDisplayFormat,
  getDisplayFormatKey,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../mangaUtils';
import './MangaCards.css';

interface MangaResultCardProps {
  result: AniListMangaSearchResult;
  /** Eintrag aus der eigenen Sammlung — dann Status statt Hinzufügen-Knopf. */
  owned?: Manga;
  alias?: string;
  adding?: boolean;
  onOpen: () => void;
  onAdd: (e: React.MouseEvent) => void;
}

/** Ergebnis-Karte für Suche und Entdecken. */
export const MangaResultCard = ({
  result,
  owned,
  alias,
  adding,
  onOpen,
  onAdd,
}: MangaResultCardProps) => {
  const { currentTheme } = useTheme();
  const title = result.title.english || result.title.romaji;
  const formatKey = getDisplayFormatKey(result.countryOfOrigin, result.format);
  const addTextColor = getOptimalTextColor(currentTheme.primary);
  const total = owned ? mangaTotalChapters(owned) : 0;
  const progress = owned ? mangaProgressPercent(owned) : 0;

  return (
    <motion.div
      className="mrc"
      role="button"
      tabIndex={0}
      aria-label={t('{title} öffnen', { title })}
      whileTap={{ opacity: 0.7 }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={`mrc-art ${owned ? 'mrc-art--owned' : ''}`}>
        <img src={result.coverImage.large} alt={title} loading="lazy" decoding="async" />
        <div className="mpc-top">
          <span className="mpc-chip" style={{ color: FORMAT_COLORS[formatKey] || undefined }}>
            {getDisplayFormat(result.countryOfOrigin, result.format)}
          </span>
          {result.averageScore ? (
            <span className="mpc-chip mpc-chip--score">
              <Star style={{ fontSize: 12 }} />
              {(result.averageScore / 10).toFixed(1)}
            </span>
          ) : null}
        </div>

        {owned ? (
          <div className="mrc-owned">
            <span
              className="mrc-owned-chip"
              style={{ color: STATUS_COLORS[owned.readStatus] }}
              title={t('In deiner Sammlung')}
            >
              <CheckCircle style={{ fontSize: 14 }} />
              {STATUS_LABELS[owned.readStatus]}
            </span>
            {progress > 0 && (
              <div className="mpc-progress" aria-hidden>
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <motion.button
            type="button"
            className="mrc-add"
            aria-label={t('{title} zur Sammlung hinzufügen', { title })}
            whileTap={{ opacity: 0.7 }}
            onClick={onAdd}
            disabled={adding}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: addTextColor,
            }}
          >
            {adding ? (
              <span className="mrc-spinner" style={{ borderTopColor: addTextColor }} />
            ) : (
              <Add style={{ fontSize: 22 }} />
            )}
          </motion.button>
        )}
      </div>

      <div className="mrc-info">
        <div className="mrc-title">{title}</div>
        {alias && (
          <div className="mrc-alias" style={{ color: currentTheme.primary }}>
            {t('Gefunden als „{title}“', { title: alias })}
          </div>
        )}
        <div className="mrc-meta" style={{ color: currentTheme.text.muted }}>
          {owned
            ? owned.currentChapter > 0
              ? total > 0
                ? t('Kap. {a} / {b}', { a: owned.currentChapter, b: total })
                : t('Kap. {n}', { n: owned.currentChapter })
              : t('In deiner Sammlung')
            : [
                result.startDate?.year || '',
                result.chapters ? t('{n} Kap.', { n: result.chapters }) : '',
              ]
                .filter(Boolean)
                .join(' · ')}
        </div>
      </div>
    </motion.div>
  );
};
