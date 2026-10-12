import { dateLocale, t } from '../../services/i18n';
import type { BookStatus } from '../../types/Book';

export const formatHours = (hours: number) =>
  hours < 1
    ? t('noch ~{n} min', { n: Math.max(5, Math.round(hours * 60)) })
    : t('noch ~{n} h', {
        n: (hours >= 10 ? Math.round(hours) : Math.round(hours * 2) / 2).toLocaleString(
          dateLocale()
        ),
      });

export const STATUS_LABELS: Record<BookStatus, () => string> = {
  reading: () => t('Lese ich'),
  planned: () => t('Will ich lesen'),
  completed: () => t('Gelesen'),
  paused: () => t('Pausiert'),
  dropped: () => t('Abgebrochen'),
};

export const bookPath = (id: string) => `/books/${encodeURIComponent(id)}`;

export const searchPath = (query: string) => `/books/search?q=${encodeURIComponent(query)}`;

export const MONTH_INITIALS = () =>
  Array.from({ length: 12 }, (_, m) =>
    new Date(2026, m, 15).toLocaleDateString(dateLocale(), { month: 'narrow' })
  );
