import { t } from '../../services/i18n';

// Format timestamp to relative time
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t('gerade eben');
  if (minutes < 60) return t('vor {n} Min.', { n: minutes });
  if (hours < 24) return t('vor {n} Std.', { n: hours });
  if (days < 7) return t('vor {n} Tagen', { n: days });
  return new Date(timestamp).toLocaleDateString('de-DE');
};

// Extract image URLs from content
export const extractImageUrls = (content: string): { text: string; images: string[] } => {
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const images: string[] = [];
  const text = content
    .replace(imageRegex, (match) => {
      images.push(match);
      return '';
    })
    .trim();
  return { text, images };
};
