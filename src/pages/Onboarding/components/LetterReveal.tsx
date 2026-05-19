import { motion } from 'framer-motion';
import { memo } from 'react';

interface Props {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
  /** When true, letters fall into place from above instead of rising from below. */
  fromTop?: boolean;
}

/**
 * Splits a string into words and per-word into letters. Each letter is an
 * inline motion span with a staggered slide-up reveal. Words don't break across
 * lines because we wrap each word in an inline-block span.
 */
export const LetterReveal = memo(
  ({ text, delay = 0, stagger = 0.04, className, style, fromTop = false }: Props) => {
    const words = text.split(' ');
    let counter = 0;
    return (
      <span className={className} style={style}>
        {words.map((word, wi) => (
          <span
            key={wi}
            style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
            aria-hidden={false}
          >
            {Array.from(word).map((char, ci) => {
              const i = counter++;
              return (
                <motion.span
                  key={`${wi}-${ci}`}
                  className="ob-letter"
                  initial={{ y: fromTop ? -40 : 40, opacity: 0, rotateZ: fromTop ? -4 : 4 }}
                  animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: delay + i * stagger,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                >
                  {char}
                </motion.span>
              );
            })}
            {wi < words.length - 1 && (
              <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>
            )}
          </span>
        ))}
      </span>
    );
  }
);
LetterReveal.displayName = 'LetterReveal';
