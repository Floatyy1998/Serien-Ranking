/** Klassenname einer beschrifteten Aktion im Detail-Baukasten. */
export const actionClass = (state?: 'on' | 'danger') =>
  `dk-action${state ? ` dk-action--${state}` : ''}`;
