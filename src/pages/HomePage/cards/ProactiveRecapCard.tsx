import { AutoAwesome, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HintCard, HintDeck } from '../../../components/ui/notification/HintDeck';
import { SpeakButton } from '../../../components/ui/input/SpeakButton';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTextToSpeech } from '../../../hooks/platform/useTextToSpeech';
import type { ProactiveRecap } from '../../../hooks/watch/useProactiveRecaps';
import { t } from '../../../services/i18n';
import { getImageUrl } from '../../../utils/imageUrl';

interface ProactiveRecapCardProps {
  recaps: ProactiveRecap[];
  onDismiss: (cacheKey: string) => void;
  onFetchRecap: (cacheKey: string) => Promise<void>;
}

function parseBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, ''));
}

const triggerLabel = (recap: ProactiveRecap): string => {
  const when = recap.startsToday ? t('heute') : t('morgen');
  return recap.triggerType === 'new-season'
    ? t('Staffel {n} startet {when}!', { n: recap.seasonNumber, when })
    : t('Staffel {n} wird {when} fortgesetzt!', { n: recap.seasonNumber, when });
};

const RecapHintCard: React.FC<{
  recap: ProactiveRecap;
  accent: string;
  backdrop?: string;
  onDismiss: () => void;
  onFetch: () => void;
}> = ({ recap, accent, backdrop, onDismiss, onFetch }) => {
  const navigate = useNavigate();
  const tts = useTextToSpeech();
  const [expanded, setExpanded] = useState(false);
  const hasContent = !!recap.recap && !recap.loading;
  const points = hasContent ? parseBulletPoints(recap.recap ?? '') : [];
  const openSeries = () => navigate(`/series/${recap.seriesId}`);

  return (
    <HintCard
      title={recap.seriesTitle}
      poster={recap.posterUrl || undefined}
      backdrop={backdrop}
      DetailIcon={AutoAwesome}
      detail={triggerLabel(recap)}
      extra={recap.loading && <p className="hint-card-note">{t('Recap wird generiert...')}</p>}
      onOpen={openSeries}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className="hint-btn hint-btn--ghost" onClick={openSeries}>
            <span>{t('Zur Serie')}</span>
            <ChevronRight />
          </button>
          <button
            type="button"
            className="hint-btn hint-btn--primary"
            disabled={recap.loading}
            onClick={() => {
              if (!hasContent) {
                onFetch();
                setExpanded(true);
              } else {
                setExpanded((v) => !v);
              }
            }}
          >
            <span>{expanded ? t('Einklappen') : t('Recap lesen')}</span>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </button>
        </>
      }
      footer={
        <>
          {recap.loading && (
            <div className="hint-card-loading" aria-hidden>
              <motion.span
                animate={{ x: ['-100%', '250%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              />
            </div>
          )}
          <AnimatePresence initial={false}>
            {expanded && hasContent && (
              <motion.div
                className="hint-card-footer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="hint-recap">
                  <div className="hint-recap-head">
                    <span className="hint-recap-rule" />
                    <SpeakButton
                      state={tts.state}
                      onClick={() => tts.speak(recap.recap ?? '')}
                      accent={accent}
                      size={26}
                    />
                  </div>
                  {points.map((point, i) => (
                    <p key={i} className="hint-recap-point">
                      {point}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
};

// Memo: parent HomePage re-renders on many unrelated state changes; this
// card only cares about recaps + theme via context. memo cuts the noise.
export const ProactiveRecapCard: React.FC<ProactiveRecapCardProps> = memo(
  ({ recaps, onDismiss, onFetchRecap }) => {
    const { currentTheme } = useTheme();
    const { allSeriesList } = useSeriesList();
    const accent = currentTheme.accent || currentTheme.primary;

    if (recaps.length === 0) return null;

    const backdropOf = (seriesId: number) => {
      const series = allSeriesList.find((s) => s.id === seriesId);
      return getImageUrl(series?.backdrop, 'w780', '') || undefined;
    };

    return (
      <HintDeck
        color={accent}
        Icon={AutoAwesome}
        title={
          recaps.length > 1
            ? t('{n} Recaps vor dem Staffelstart', { n: recaps.length })
            : recaps[0].triggerType === 'new-season'
              ? t('Recap der vorherigen Staffel')
              : t('Recap vor der Fortsetzung')
        }
        count={recaps.length}
        onDismissAll={() => recaps.forEach((r) => onDismiss(r.cacheKey))}
      >
        {recaps.map((recap) => (
          <RecapHintCard
            key={recap.cacheKey}
            recap={recap}
            accent={accent}
            backdrop={backdropOf(recap.seriesId)}
            onDismiss={() => onDismiss(recap.cacheKey)}
            onFetch={() => void onFetchRecap(recap.cacheKey)}
          />
        ))}
      </HintDeck>
    );
  }
);

ProactiveRecapCard.displayName = 'ProactiveRecapCard';
