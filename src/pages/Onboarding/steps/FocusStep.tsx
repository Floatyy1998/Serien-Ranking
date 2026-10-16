import { motion } from 'framer-motion';
import { CoverWall } from '../components/CoverWall';
import { LetterReveal } from '../components/LetterReveal';
import { t } from '../../../services/i18n';
import type { AppFocus } from '../../../services/settings/appFocus';

interface Props {
  focus: AppFocus | null;
  onChange: (focus: AppFocus) => void;
  onNext: () => void;
}

const options = (): { focus: AppFocus; title: string; sub: string }[] => [
  {
    focus: 'watch',
    title: t('Serien & Filme'),
    sub: t('Folgen abhaken, Kalender, deine Streaming-Abos'),
  },
  {
    focus: 'read',
    title: t('Manga & Bücher'),
    sub: t('Lesestand, neue Kapitel, dein Bücherregal'),
  },
  { focus: 'both', title: t('Beides'), sub: t('Schauen und Lesen an einem Ort') },
];

/** Auftakt vor der Kuration: Wofür nutzt jemand TV-Rank? Steuert Akte und Startseite. */
export const FocusStep: React.FC<Props> = ({ focus, onChange, onNext }) => (
  <motion.div
    className="ob-step"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.45 }}
  >
    <CoverWall />

    <div
      className="ob-step__body"
      style={{
        padding: 'clamp(20px, 5vw, 56px) clamp(20px, 5vw, 56px) 0',
        gap: 'clamp(22px, 4vw, 36px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.55)' }}>
          {t('00 — Auftakt')}
        </span>
        <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
          tv-rank · onboarding
        </span>
      </div>

      <div>
        <h1
          className="ob-display"
          style={{
            fontSize: 'clamp(44px, 9vw, 120px)',
            margin: 0,
            color: 'var(--ob-paper)',
            maxWidth: '14ch',
          }}
        >
          <LetterReveal text={t('Wofür bist')} delay={0.15} stagger={0.04} />
          <br />
          <span style={{ fontStyle: 'normal', fontWeight: 900 }}>
            <LetterReveal text={t('du hier?')} delay={0.5} stagger={0.04} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="ob-mono"
          style={{
            color: 'var(--ob-text-mute)',
            marginTop: 14,
            fontSize: 12,
            textTransform: 'none',
            letterSpacing: '0.04em',
          }}
        >
          {t(
            'Danach richtet sich deine Startseite — umstellen kannst du jederzeit in den Einstellungen.'
          )}
        </motion.p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        {options().map((option, i) => {
          const selected = focus === option.focus;
          return (
            <motion.button
              key={option.focus}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.08, duration: 0.45 }}
              onClick={() => onChange(option.focus)}
              aria-pressed={selected}
              className={`ob-choice ${selected ? 'ob-choice--active' : ''}`}
            >
              <span className="ob-choice__index">{String(i + 1).padStart(2, '0')}</span>
              <div className="ob-choice__body">
                <p className="ob-choice__title">{option.title}</p>
                <p className="ob-choice__sub">{option.sub}</p>
              </div>
              <span className="ob-choice__arrow" aria-hidden>
                {selected ? '✓' : ''}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>

    <motion.div
      className="ob-step__foot"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3, duration: 0.5 }}
    >
      <button onClick={onNext} disabled={!focus} className="ob-cta">
        <span className="ob-cta__inner">
          <span>{t('weiter')}</span>
          <span style={{ opacity: 0.55, fontSize: 11 }}>·</span>
          <span style={{ opacity: 0.55, fontSize: 11 }}>
            {focus ? options().find((o) => o.focus === focus)?.title : t('wähle eins')}
          </span>
        </span>
        <span className="ob-cta__arrow">→</span>
      </button>
    </motion.div>
  </motion.div>
);
