import { motion } from 'framer-motion';
import { hapticSelect } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import { SEASON_PALETTES, type SeasonId } from '../../theme/seasonalThemes';
import { SeasonScene } from './SeasonScenes';
import './SeasonCard.css';

interface SeasonCardProps {
  season: SeasonId;
  active: boolean;
  onToggle: (season: SeasonId, next: boolean) => void;
}

const COPY: Record<SeasonId, { title: () => string; sub: () => string; until: () => string }> = {
  spooky: {
    title: () => 'Spooky Season',
    sub: () => t('Spinnennetze, Skelette und Kürbisfarben in der ganzen App'),
    until: () => t('Bis 31. Oktober'),
  },
  christmas: {
    title: () => t('Weihnachten'),
    sub: () => t('Schneefall, Lichterketten und ein Rentierschlitten in der ganzen App'),
    until: () => t('Bis 26. Dezember'),
  },
  newyear: {
    title: () => t('Neujahr'),
    sub: () => t('Feuerwerk, Konfetti und Champagnergold in der ganzen App'),
    until: () => t('Bis 6. Januar'),
  },
};

export const SeasonCard = ({ season, active, onToggle }: SeasonCardProps) => {
  const palette = SEASON_PALETTES[season];
  const copy = COPY[season];
  const vars = {
    '--sc-primary': palette.primaryColor,
    '--sc-accent': palette.accentColor,
    '--sc-bg': palette.backgroundColor,
    '--sc-surface': palette.surfaceColor,
    '--sc-text': palette.textColor,
  } as React.CSSProperties;

  const toggle = () => {
    hapticSelect();
    onToggle(season, !active);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`season-card${active ? ' is-on' : ''}`}
      style={vars}
    >
      <div className={`season-card__scene season-scene--${season}`} aria-hidden="true">
        <SeasonScene season={season} />
        <span className="season-card__badge">{copy.until()}</span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        className="season-card__toggle"
        onClick={toggle}
      >
        <span className="season-card__text">
          <span className="season-card__title">{copy.title()}</span>
          <span className="season-card__sub">{copy.sub()}</span>
        </span>
        <span className="season-card__switch">
          <span className="season-card__knob" />
        </span>
      </button>
    </motion.div>
  );
};
