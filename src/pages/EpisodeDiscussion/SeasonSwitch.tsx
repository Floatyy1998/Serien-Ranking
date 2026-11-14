import { memo, useEffect, useRef } from 'react';
import { t } from '../../services/i18n';

export interface SeasonSwitchItem {
  /** 1-basiert, wie in der Adresse. */
  number: number;
  complete: boolean;
}

interface SeasonSwitchProps {
  seasons: SeasonSwitchItem[];
  current: number;
  onSelect: (seasonNumber: number) => void;
}

/** Staffel-Umschalter der Folgen-Seite: eine Reihe kurzer Marken, die aktuelle hervorgehoben. */
export const SeasonSwitch = memo(({ seasons, current, onSelect }: SeasonSwitchProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !active) return;
    row.scrollLeft =
      active.offsetLeft - row.offsetLeft - row.clientWidth / 2 + active.offsetWidth / 2;
  }, [current, seasons.length]);

  if (seasons.length < 2) return null;

  return (
    <div className="dk-seasons" role="group" aria-label={t('Staffel wechseln')} ref={rowRef}>
      {seasons.map((season) => {
        const active = season.number === current;
        return (
          <button
            key={season.number}
            type="button"
            className={`dk-season${active ? ' is-current' : ''}${season.complete ? ' is-complete' : ''}`}
            aria-current={active ? 'true' : undefined}
            aria-label={t('Staffel {n}', { n: season.number })}
            onClick={() => !active && onSelect(season.number)}
          >
            {t('S{n}', { n: season.number })}
          </button>
        );
      })}
    </div>
  );
});
SeasonSwitch.displayName = 'SeasonSwitch';
