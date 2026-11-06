import { ChevronRight, NewReleases, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import type { UnsubscribedNewSeasonEntry } from '../../../hooks/watch/useUnsubscribedNewSeasons';
import { t } from '../../../services/i18n';
import { getImageUrl } from '../../../utils/imageUrl';
import { HintCard, HintDeck } from './HintDeck';
import './CarouselNotification.css';

interface Props {
  entries: UnsubscribedNewSeasonEntry[];
  /** Ohne ids: alle Einträge wegklicken. */
  onDismiss: (seriesIds?: number[]) => void;
  onCollapse?: () => void;
}

export const UnsubscribedNewSeasonNotification: React.FC<Props> = ({
  entries,
  onDismiss,
  onCollapse,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const color = currentTheme.status.warning;

  if (entries.length === 0) return null;

  return (
    <HintDeck
      color={color}
      Icon={NewReleases}
      title={
        entries.length === 1
          ? t('Anbieter fehlt')
          : t('{anzahl} neue Staffeln auf nicht abonnierten Anbietern', {
              anzahl: entries.length,
            })
      }
      count={entries.length}
      onDismissAll={() => onDismiss()}
      onCollapse={onCollapse}
    >
      {entries.map(({ series, providers }) => (
        <HintCard
          key={series.id}
          title={series.title || series.original_name || t('Serie')}
          poster={getImageUrl(series.poster, 'w342', '') || undefined}
          backdrop={getImageUrl(series.backdrop, 'w780', '') || undefined}
          DetailIcon={NewReleases}
          detail={t('Neue Staffel auf {anbieter}', { anbieter: providers.join(', ') })}
          onOpen={() => navigate(`/series/${series.id}`)}
          onDismiss={() => onDismiss([series.id])}
          actions={
            <>
              <button
                type="button"
                className="hint-btn hint-btn--ghost"
                onClick={() => navigate('/subscriptions')}
              >
                <SettingsIcon />
                <span>{t('Abos')}</span>
              </button>
              <button
                type="button"
                className="hint-btn hint-btn--primary"
                onClick={() => navigate(`/series/${series.id}`)}
              >
                <span>{t('Ansehen')}</span>
                <ChevronRight />
              </button>
            </>
          }
        />
      ))}
    </HintDeck>
  );
};
