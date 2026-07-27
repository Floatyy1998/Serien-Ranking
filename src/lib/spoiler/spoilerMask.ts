import type { SpoilerLevel } from '../../services/spoilerMode';

export interface SpoilerMask {
  blurImage: boolean;
  hideText: boolean;
}

const NO_MASK: SpoilerMask = { blurImage: false, hideText: false };

/**
 * Entscheidet, was für eine Folge maskiert wird: nur ungesehene Folgen,
 * gesehene nie. Zukünftige Folgen sind die spoiler-trächtigsten und werden
 * genauso behandelt.
 */
export const episodeSpoilerMask = (level: SpoilerLevel, watched: boolean): SpoilerMask => {
  if (level === 0 || watched) return NO_MASK;
  return { blurImage: true, hideText: level === 2 };
};
