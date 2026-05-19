import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Confetti } from '../components/Confetti';
import { CoverWall } from '../components/CoverWall';
import { LetterReveal } from '../components/LetterReveal';

interface Props {
  seriesCount: number;
  movieCount: number;
  watchedSeriesCount: number;
  posters: string[];
  isCompleting: boolean;
  completionProgress: number;
  onFinish: () => void;
  onBack: () => void;
}

function useCountUp(target: number, durationMs: number = 900, start = false): number {
  const [v, setV] = useState(start ? 0 : target);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return v;
}

export const CompletionStep: React.FC<Props> = ({
  seriesCount,
  movieCount,
  watchedSeriesCount,
  posters,
  isCompleting,
  completionProgress,
  onFinish,
  onBack,
}) => {
  const series = useCountUp(seriesCount, 1100, !isCompleting);
  const movies = useCountUp(movieCount, 1100, !isCompleting);
  const watched = useCountUp(watchedSeriesCount, 1100, !isCompleting);

  if (isCompleting) {
    return (
      <motion.div
        className="ob-step"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 clamp(20px, 5vw, 56px)',
          textAlign: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 1,
              height: 50,
              background: 'rgba(244,237,224,0.4)',
              animation: 'ob-pulse 1.2s ease-in-out infinite',
            }}
          />
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.7)', fontSize: 11 }}>
            Setup läuft …
          </span>
          <h2
            className="ob-display"
            style={{
              fontSize: 'clamp(36px, 9vw, 56px)',
              margin: 0,
              color: 'var(--ob-paper)',
              maxWidth: 580,
              lineHeight: 0.9,
            }}
          >
            Wir bereiten
            <br />
            deine Bühne vor.
          </h2>
          <div
            style={{
              width: 'min(280px, 80vw)',
              height: 1,
              background: 'rgba(244,237,224,0.18)',
              position: 'relative',
              overflow: 'hidden',
              marginTop: 8,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--ob-paper)',
                transform: `scaleX(${completionProgress / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.45s cubic-bezier(0.7,0,0.2,1)',
              }}
            />
          </div>
          <span
            className="ob-mono"
            style={{ color: 'var(--ob-paper)', fontSize: 14, fontWeight: 700 }}
          >
            {String(completionProgress).padStart(2, '0')}
            <span style={{ opacity: 0.4 }}>/100</span>
          </span>
        </div>

        <style>{`
          @keyframes ob-pulse {
            0%, 100% { opacity: 0.3; transform: scaleY(0.6); }
            50% { opacity: 1; transform: scaleY(1); }
          }
        `}</style>
      </motion.div>
    );
  }

  return (
    <motion.div className="ob-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Atmospheric cover wall (same as the other steps) */}
      <CoverWall />

      {/* Confetti — physics-driven sway, not CSS */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <Confetti count={80} />
      </div>

      {/* Foreground */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(28px, 6vw, 60px)',
          textAlign: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 'clamp(20px, 5vw, 56px)',
            right: 'clamp(20px, 5vw, 56px)',
            paddingTop: 'clamp(18px, 3vw, 36px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            zIndex: 4,
          }}
        >
          <button onClick={onBack} className="ob-link" style={{ padding: '6px 0', fontSize: 11 }}>
            ← zurück
          </button>
          <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', opacity: 0.55 }}>
            04 — Premiere
          </span>
        </div>

        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ob-mono"
          style={{ color: 'rgba(244,237,224,0.55)' }}
        >
          Kapitel 04 — Premiere
        </motion.span>

        <h1
          className="ob-display"
          style={{
            fontSize: 'clamp(72px, 18vw, 180px)',
            margin: 0,
            color: 'var(--ob-paper)',
            lineHeight: 0.85,
            letterSpacing: '-0.05em',
          }}
        >
          <LetterReveal text="Vorhang" delay={0.15} stagger={0.05} />
          <br />
          <span
            style={{
              fontVariationSettings: "'opsz' 144, 'SOFT' 0",
              fontStyle: 'normal',
              fontWeight: 900,
            }}
          >
            <LetterReveal text="auf." delay={0.5} stagger={0.06} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          style={{
            fontFamily: 'var(--ob-font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'rgba(244,237,224,0.75)',
            maxWidth: 460,
            lineHeight: 1.5,
          }}
        >
          Deine Mediathek ist eingerichtet. Vom ersten Pilot bis zum letzten Abspann — alles ist
          bereit.
        </motion.p>

        {/* Stats — magazine style */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: watchedSeriesCount > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: 'clamp(16px, 3vw, 28px)',
            width: '100%',
            maxWidth: 540,
            paddingTop: 12,
            borderTop: '1px solid var(--ob-line)',
          }}
        >
          <StatCell value={series} label="Serien" />
          {watchedSeriesCount > 0 && <StatCell value={watched} label="fortgesetzt" />}
          <StatCell value={movies} label="Filme" />
        </motion.div>

        {/* Curtain-call: user's selected posters fly in */}
        {posters.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            style={{
              width: '100%',
              maxWidth: 720,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', fontSize: 10 }}>
              Deine Auswahl
            </span>
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'center',
                flexWrap: 'wrap',
                perspective: 1200,
              }}
            >
              {posters.slice(0, 10).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 60, opacity: 0, rotateX: -35, rotateZ: -8 + (i % 3) * 8 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    rotateZ: -6 + ((i * 5) % 12),
                  }}
                  transition={{
                    delay: 1.6 + i * 0.06,
                    duration: 0.7,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  style={{
                    width: 56,
                    aspectRatio: '2 / 3',
                    backgroundImage: `url(https://image.tmdb.org/t/p/w185${p})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 6,
                    boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
                    transformOrigin: 'center bottom',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.5 }}
          style={{ width: '100%', maxWidth: 380, marginTop: 8 }}
        >
          <button onClick={onFinish} className="ob-cta">
            <span className="ob-cta__inner">
              <span>los geht's</span>
            </span>
            <span className="ob-cta__arrow">→</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCell: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      textAlign: 'left',
    }}
  >
    <span
      className="ob-display"
      style={{
        fontSize: 'clamp(42px, 9vw, 76px)',
        color: 'var(--ob-paper)',
        lineHeight: 0.9,
        fontVariationSettings: "'opsz' 144, 'SOFT' 0",
        fontStyle: 'normal',
        fontWeight: 900,
        letterSpacing: '-0.04em',
      }}
    >
      {value}
    </span>
    <span
      className="ob-mono"
      style={{
        color: 'rgba(244,237,224,0.55)',
        fontSize: 10,
        marginTop: 6,
        letterSpacing: '0.18em',
      }}
    >
      {label}
    </span>
  </div>
);
