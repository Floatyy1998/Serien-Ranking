import type React from 'react';
import { dateLocale } from '../../services/i18n';

export const fmt = (n: number): string => Math.round(n).toLocaleString(dateLocale());

export const tmdbImage = (path: string | undefined, size = 'w342'): string | undefined =>
  !path ? undefined : path.startsWith('http') ? path : `https://image.tmdb.org/t/p/${size}${path}`;

/** Verzögerungsstufe für den gestaffelten Auftritt. */
export const step = (i: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ '--i': i, ...extra }) as React.CSSProperties;
