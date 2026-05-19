import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface Props {
  label: string;
  index: number;
  posters: string[];
  selected: boolean;
  onToggle: () => void;
}

/**
 * Filmposter-style genre tile with subtle 3D tilt that tracks the cursor.
 * Numbered top-left (01, 02, …) like a magazine plate; large display-italic
 * label bottom-left; selected = paper border + ring + check medallion.
 */
export const GenreTile: React.FC<Props> = ({ label, index, posters, selected, onToggle }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxSpring = useSpring(rx, { stiffness: 200, damping: 18 });
  const rySpring = useSpring(ry, { stiffness: 200, damping: 18 });
  const transform = useTransform(
    [rxSpring, rySpring],
    ([x, y]) => `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`
  );

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rx.set(nx * 10);
    ry.set(-ny * 8);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const mosaic: (string | null)[] = posters.slice(0, 4);
  while (mosaic.length < 4) mosaic.push(null);

  return (
    <motion.button
      ref={ref}
      onClick={onToggle}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      className={`ob-genre-tile ${selected ? 'ob-genre-tile--selected' : ''}`}
      style={{ transform }}
    >
      <div className="ob-genre-tile__mosaic">
        {mosaic.map((p, i) => (
          <div
            key={i}
            style={{
              backgroundImage: p ? `url(https://image.tmdb.org/t/p/w185${p})` : undefined,
            }}
          />
        ))}
      </div>
      <div className="ob-genre-tile__veil" />

      <span className="ob-genre-tile__num ob-mono">{String(index + 1).padStart(2, '0')}</span>

      <span className="ob-genre-tile__name">{label}</span>

      <div className="ob-genre-tile__check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.button>
  );
};
