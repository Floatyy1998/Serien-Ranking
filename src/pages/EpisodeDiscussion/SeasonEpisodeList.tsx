import Check from '@mui/icons-material/Check';
import { memo } from 'react';
import { RailSection } from '../../components/detail/kit/DetailKit';
import { t } from '../../services/i18n';

interface SeasonEpisodeListProps {
  seasonNumber: number;
  /** 1-basiert. */
  currentEpisode: number;
  episodes: { id: number | string; name?: string; watched: boolean }[];
  onOpen: (episodeNumber: number) => void;
}

const BEFORE = 4;
const AFTER = 8;
const WINDOW_FROM = 16;

/** Die Folgen der Staffel als kompakte Liste — die aktuelle hervorgehoben, ein Tipp wechselt die Folge. */
export const SeasonEpisodeList = memo(
  ({ seasonNumber, currentEpisode, episodes, onOpen }: SeasonEpisodeListProps) => {
    if (episodes.length < 2) return null;

    // Lange Staffeln (Anime): nur den Ausschnitt um die aktuelle Folge zeigen.
    const windowed = episodes.length > WINDOW_FROM;
    const from = windowed ? Math.max(0, currentEpisode - 1 - BEFORE) : 0;
    const to = windowed ? Math.min(episodes.length, currentEpisode + AFTER) : episodes.length;

    return (
      <RailSection
        title={t('Staffel {n}', { n: seasonNumber })}
        hint={episodes.length === 1 ? t('1 Folge') : t('{n} Folgen', { n: episodes.length })}
      >
        <div className="dk-list">
          {episodes.slice(from, to).map((episode, offset) => {
            const number = from + offset + 1;
            const current = number === currentEpisode;
            return (
              <button
                key={episode.id}
                type="button"
                className={`dk-list__row${current ? ' dk-list__row--on' : ''}`}
                aria-current={current ? 'true' : undefined}
                onClick={() => !current && onOpen(number)}
              >
                <span className="dk-list__num">{number}</span>
                <span className="dk-list__name">
                  {episode.name || t('Folge {n}', { n: number })}
                </span>
                <span className="dk-list__state">
                  {episode.watched && <Check style={{ fontSize: 18 }} />}
                </span>
              </button>
            );
          })}
        </div>
      </RailSection>
    );
  }
);
SeasonEpisodeList.displayName = 'SeasonEpisodeList';
