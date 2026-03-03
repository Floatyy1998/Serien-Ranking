import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  /** 'word' splits by spaces, 'character' splits per char */
  mode?: 'word' | 'character';
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Delay between each element in seconds */
  staggerDelay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (stagger: number) => ({
    opacity: 1,
    transition: {
      staggerChildren: stagger,
    },
  }),
};

const elementVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

/**
 * Reveals text word-by-word or character-by-character with stagger animation.
 * Falls back to static rendering when prefers-reduced-motion is set.
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  mode = 'word',
  delay = 0,
  staggerDelay = 0.04,
  as: Tag = 'span',
  style,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionTag = motion.create(Tag as 'span');

  if (shouldReduceMotion) {
    return (
      <Tag style={style} className={className}>
        {text}
      </Tag>
    );
  }

  const elements = mode === 'word' ? text.split(' ') : text.split('');

  return (
    <MotionTag
      style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={staggerDelay}
      transition={{ delayChildren: delay }}
    >
      {elements.map((el, i) => (
        <motion.span
          key={`${el}-${i}`}
          variants={elementVariants}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
          }}
        >
          {mode === 'word' ? (i < elements.length - 1 ? `${el}\u00A0` : el) : el}
        </motion.span>
      ))}
    </MotionTag>
  );
};
