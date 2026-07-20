import type React from 'react';
import { t } from '../services/i18n';

/**
 * Einheitlicher Poster-Platzhalter (data-URI-SVG) + `onError`-Handler.
 * Konsolidiert drei zuvor byte-identische Kopien (RatingItemCard,
 * ProfileItemCard, discoverItemHelpers).
 *
 * Layer: lib/ (reine Konstante/Helfer, kein I/O).
 */
export const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'fill="#666" font-family="Arial" font-size="14">' +
    t('Kein Poster') +
    '</text></svg>'
)}`;

/**
 * `<img onError>`-Handler: setzt bei Ladefehler den Platzhalter. Guard gegen
 * Endlos-Loop, falls der Platzhalter selbst nicht lädt.
 */
export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  if (!target.src.includes('data:image/svg')) {
    target.src = PLACEHOLDER_SVG;
  }
};
