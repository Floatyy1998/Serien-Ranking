import { motion } from 'framer-motion';
import { ACTS, type ActStep } from '../data/acts';
import { t } from '../../../services/i18n';

interface Props {
  currentStep: ActStep;
  /** Forces orientation. If omitted, CSS responsive. */
  variant?: 'horizontal' | 'vertical' | 'responsive';
  delay?: number;
}

export const TableOfContents: React.FC<Props> = ({
  currentStep,
  variant = 'responsive',
  delay = 0,
}) => {
  const currentIdx = ACTS.findIndex((a) => a.key === currentStep);

  return (
    <motion.ol
      className={`ob-toc ob-toc--${variant}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      {ACTS.map((a, i) => {
        const state = i < currentIdx ? 'done' : a.key === currentStep ? 'active' : 'next';
        return (
          <li key={a.key} className={`ob-toc__row ob-toc__row--${state}`}>
            <span className="ob-toc__num">{a.num}</span>
            <div className="ob-toc__body">
              <span className="ob-toc__label">{t(a.label)}</span>
              <span className="ob-toc__sub">{t(a.sub)}</span>
            </div>
            <span className="ob-toc__marker" aria-hidden>
              {state === 'done' ? '✓' : state === 'active' ? '●' : ''}
            </span>
          </li>
        );
      })}
    </motion.ol>
  );
};
