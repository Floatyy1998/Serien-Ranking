import { motion } from 'framer-motion';
import { Bat, Cobweb, Pumpkin, Spider } from '../../components/seasonal/spooky/SpookyArt';
import { hapticSelect } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import { isSpookySeasonNow, SPOOKY_PALETTE } from '../../theme/spookyTheme';
import './SpookySeasonCard.css';

interface SpookySeasonCardProps {
  active: boolean;
  onToggle: (next: boolean) => void;
}

const sceneVars = {
  '--spk-primary': SPOOKY_PALETTE.primaryColor,
  '--spk-accent': SPOOKY_PALETTE.accentColor,
  '--spk-bg': SPOOKY_PALETTE.backgroundColor,
  '--spk-surface': SPOOKY_PALETTE.surfaceColor,
  '--spk-text': SPOOKY_PALETTE.textColor,
} as React.CSSProperties;

export const SpookySeasonCard = ({ active, onToggle }: SpookySeasonCardProps) => {
  const inSeason = isSpookySeasonNow();

  const toggle = () => {
    hapticSelect();
    onToggle(!active);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`spooky-card${active ? ' is-on' : ''}`}
      style={sceneVars}
    >
      <div className="spooky-card__scene" aria-hidden="true">
        <div className="spooky-card__moon" />
        <Cobweb seed={5} className="spooky-card__web" />
        <div className="spooky-card__dangler">
          <span className="spooky-card__thread" />
          <Spider className="spooky-card__spider" />
        </div>
        <Bat className="spooky-card__bat spooky-card__bat--a" />
        <Bat className="spooky-card__bat spooky-card__bat--b" />
        <svg
          className="spooky-card__graves"
          viewBox="0 0 360 90"
          preserveAspectRatio="xMidYMax slice"
        >
          <path d="M0 62Q50 46 110 56T230 52T360 58V90H0Z" className="spooky-card__hill--far" />
          <path d="M42 64V30M42 30l-9-10M42 38l11-12M42 26l-3-9M42 46l-13-6M53 26l6-3M33 20l-5 1" />
          <path d="M150 70v-15a8 8 0 0 1 16 0v15ZM176 72v-11a6 6 0 0 1 12 0v11ZM300 70V48h-6v-5h6v-6h5v6h6v5h-6v22Z" />
          <path d="M0 74Q70 62 150 70T300 66T360 70V90H0Z" />
        </svg>
        <Pumpkin className="spooky-card__pumpkin" />
        {inSeason && <span className="spooky-card__badge">{t('Jetzt Saison')}</span>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        className="spooky-card__toggle"
        onClick={toggle}
      >
        <span className="spooky-card__text">
          <span className="spooky-card__title">Spooky Season</span>
          <span className="spooky-card__sub">
            {t('Spinnennetze, Skelette und Kürbisfarben in der ganzen App')}
          </span>
        </span>
        <span className="spooky-card__switch">
          <span className="spooky-card__knob" />
        </span>
      </button>
    </motion.div>
  );
};
