import Check from '@mui/icons-material/Check';
import { memo, useEffect, useRef, type ReactNode } from 'react';
import { RailSection } from '../../components/detail/kit/DetailKit';
import { t } from '../../services/i18n';

interface SeasonEpisodeListProps {
  seasonNumber: number;
  /** 1-basiert. */
  currentEpisode: number;
  episodes: { id: number | string; name?: string; watched: boolean }[];
  onOpen: (episodeNumber: number) => void;
  /** Staffel-Umschalter unter der Überschrift. */
  switcher?: ReactNode;
}

/** Die Folgen der Staffel als kompakte Liste — die aktuelle hervorgehoben, ein Tipp wechselt die Folge. */
export const SeasonEpisodeList = memo(
  ({ seasonNumber, currentEpisode, episodes, onOpen, switcher }: SeasonEpisodeListProps) => {
    const listRef = useRef<HTMLDivElement>(null);

    // Die ganze Staffel steht in der Liste; lange Staffeln rollen in sich und starten bei der aktuellen Folge.
    useEffect(() => {
      const list = listRef.current;
      const row = list?.querySelector<HTMLElement>('[aria-current="true"]');
      if (!list || !row) return;
      list.scrollTop =
        row.offsetTop - list.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2;
    }, [currentEpisode, episodes.length]);

    if (episodes.length < 2) return null;

    return (
      <RailSection
        title={t('Staffel {n}', { n: seasonNumber })}
        hint={episodes.length === 1 ? t('1 Folge') : t('{n} Folgen', { n: episodes.length })}
      >
        {switcher}
        <div className="dk-list dk-list--scroll" ref={listRef}>
          {episodes.map((episode, index) => {
            const number = index + 1;
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
