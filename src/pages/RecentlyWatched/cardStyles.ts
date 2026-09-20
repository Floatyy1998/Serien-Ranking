/** Gemeinsames Aussehen der Verlaufs-Karten: Druck-Animation und Oberflaeche. */

export const CARD_PRESS = { scale: 0.985 };
export const CARD_SPRING = { type: 'spring', stiffness: 520, damping: 34 } as const;

export const cardSurface = (theme: {
  background: { surface: string; card: string };
}): React.CSSProperties => ({
  background: `linear-gradient(140deg, ${theme.background.surface}, ${theme.background.card})`,
});

/** Kleine Glas-Pille; Farbe kommt vom Aufrufer, Form aus dem CSS. */
export const chipStyle = (color: string): React.CSSProperties => ({
  background: `color-mix(in srgb, ${color} 15%, transparent)`,
  border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
  color,
});
