import { ChevronRight, SwapHoriz, Visibility } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { showUndoToast } from '../../../lib/interaction/toast';
import { snoozeNotifications, type SnoozeOption } from '../../../lib/settings/notificationSettings';
import { normalizeProviderName } from '../../../lib/provider/providerName';
import {
  markProviderChangesDismissed,
  type ProviderChangeInfo,
} from '../../../services/detection/providerChangeDetection';
import { t } from '../../../services/i18n';
import type { Series } from '../../../types/Series';
import { getImageUrl } from '../../../utils/imageUrl';
import { HintCard, HintDeck } from './HintDeck';
import './CarouselNotification.css';

/** Schmaler Eingang: die Karte braucht nur Titel, Bilder und Anbieter der Serie. */
type ProviderChangeItem = Omit<ProviderChangeInfo, 'series'> & {
  series: Pick<Series, 'id' | 'title'> &
    Partial<Pick<Series, 'original_name' | 'poster' | 'backdrop' | 'provider'>>;
};

interface ProviderChangeNotificationProps {
  changes: ProviderChangeItem[];
  onDismiss: () => void;
  onCollapse?: () => void;
  /** `hidden`: die Serien sind ausgeblendet — statt „Ansehen" wird das
   *  Wiedereinblenden angeboten. */
  variant?: 'default' | 'hidden';
  onUnhide?: (seriesId: number) => void | Promise<void>;
}

const detailText = (change: ProviderChangeItem): string => {
  const hasAdded = change.addedProviders.length > 0;
  const hasRemoved = change.removedProviders.length > 0;
  if (hasAdded && hasRemoved) {
    return `+${change.addedProviders.join(', ')} · −${change.removedProviders.join(', ')}`;
  }
  if (hasAdded) return t('Jetzt auf {anbieter}', { anbieter: change.addedProviders.join(', ') });
  if (hasRemoved) {
    return t('Nicht mehr auf {anbieter}', { anbieter: change.removedProviders.join(', ') });
  }
  return '';
};

/** Logos der neu hinzugekommenen Anbieter aus dem Katalog-Eintrag der Serie. */
const addedLogos = (change: ProviderChangeItem): { name: string; logo: string }[] => {
  const added = new Set(change.addedProviders.map((p) => normalizeProviderName(p) ?? p));
  return (change.series.provider?.provider ?? [])
    .filter((p) => p.logo && added.has(normalizeProviderName(p.name) ?? p.name))
    .map((p) => ({ name: p.name, logo: getImageUrl(p.logo, 'w92', '') }))
    .filter((p) => p.logo);
};

export const ProviderChangeNotification: React.FC<ProviderChangeNotificationProps> = ({
  changes,
  onDismiss,
  onCollapse,
  variant = 'default',
  onUnhide,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [unhiding, setUnhiding] = useState<number | null>(null);

  const color = currentTheme.accent || currentTheme.primary;
  const visible = changes.filter((c) => !doneIds.has(c.series.id));
  const isHiddenVariant = variant === 'hidden';

  const dismiss = async (selected: ProviderChangeItem[]) => {
    if (!user) return;
    await markProviderChangesDismissed(
      selected.map((c) => ({ seriesId: c.series.id, currentProviders: c.currentProviders })),
      user.uid
    );
  };

  // Eine Karte erledigt: aus der Reihe nehmen, bei der letzten die Kategorie schließen.
  const finish = (change: ProviderChangeItem) => {
    void dismiss([change]);
    if (visible.length <= 1) {
      onDismiss();
      return;
    }
    setDoneIds((prev) => new Set(prev).add(change.series.id));
  };

  const handleNavigate = (change: ProviderChangeItem) => {
    finish(change);
    navigate(`/series/${change.series.id}`);
  };

  const handleUnhide = async (change: ProviderChangeItem) => {
    if (!onUnhide || unhiding !== null) return;
    setUnhiding(change.series.id);
    try {
      await onUnhide(change.series.id);
      finish(change);
    } finally {
      setUnhiding(null);
    }
  };

  const handleDismissAll = async () => {
    await dismiss(visible);
    onDismiss();
  };

  const handleSnooze = async (days: SnoozeOption) => {
    if (!user) return;
    const ids = visible.map((c) => c.series.id);
    await snoozeNotifications('provider', ids, user.uid, days);
    showUndoToast(
      t('Erinnerung in {zeitraum}', {
        zeitraum: days === 1 ? t('1 Tag') : days === 7 ? t('1 Woche') : t('1 Monat'),
      }),
      async () => {
        // Undo: snoozeUntil auf das Minimum setzen, der Cleanup räumt danach auf
        await snoozeNotifications('provider', ids, user.uid, 1);
      }
    );
    onDismiss();
  };

  if (visible.length === 0) return null;

  const title = isHiddenVariant
    ? t('Wieder einblenden?')
    : visible.length > 1
      ? t('Provider-Änderungen')
      : t('Provider-Änderung');

  return (
    <HintDeck
      color={color}
      Icon={isHiddenVariant ? Visibility : SwapHoriz}
      iconMotion="wobble"
      title={title}
      count={visible.length}
      onSnooze={handleSnooze}
      onDismissAll={handleDismissAll}
      onCollapse={onCollapse}
    >
      {visible.map((change) => {
        const logos = addedLogos(change);
        return (
          <HintCard
            key={change.series.id}
            title={change.series.title || change.series.original_name || t('Serie')}
            poster={getImageUrl(change.series.poster, 'w342', '') || undefined}
            backdrop={getImageUrl(change.series.backdrop, 'w780', '') || undefined}
            DetailIcon={SwapHoriz}
            detail={detailText(change)}
            extra={
              logos.length > 0 && (
                <div className="hint-card-logos">
                  {logos.map((p) => (
                    <img key={p.name} src={p.logo} alt={p.name} title={p.name} loading="lazy" />
                  ))}
                </div>
              )
            }
            onOpen={() => handleNavigate(change)}
            onDismiss={() => finish(change)}
            actions={
              isHiddenVariant ? (
                <>
                  <button
                    type="button"
                    className="hint-btn hint-btn--ghost hint-btn--compact"
                    onClick={() => handleNavigate(change)}
                  >
                    <span>{t('Ansehen')}</span>
                  </button>
                  <button
                    type="button"
                    className="hint-btn hint-btn--primary"
                    onClick={() => void handleUnhide(change)}
                    disabled={unhiding !== null}
                    aria-busy={unhiding === change.series.id}
                  >
                    <Visibility />
                    <span>{t('Wieder einblenden')}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="hint-btn hint-btn--primary"
                  onClick={() => handleNavigate(change)}
                >
                  <span>{t('Ansehen')}</span>
                  <ChevronRight />
                </button>
              )
            }
          />
        );
      })}
    </HintDeck>
  );
};
