/**
 * Wrapped Fun Facts - Fun-Fact-Generierung
 */

import type { TopSeriesEntry, MonthStats, TimeOfDayStats, FunFact } from '../../types/Wrapped';
import { t } from '../i18n';

export interface FunFactContext {
  totalMinutes: number;
  totalEpisodes: number;
  totalMovies: number;
  topSeries: TopSeriesEntry[];
  mostActiveMonth: MonthStats;
  favoriteTimeOfDay: TimeOfDayStats;
}

export function generateFunFacts(ctx: FunFactContext): FunFact[] {
  const facts: FunFact[] = [];
  const hours = Math.round(ctx.totalMinutes / 60);
  const days = Math.round((ctx.totalMinutes / 60 / 24) * 10) / 10;

  // Zeit-Vergleiche
  facts.push({
    id: 'time_flights',
    text: t('Mit {hours} Stunden könntest du {flights} Mal nach New York fliegen ✈️', {
      hours,
      flights: Math.round(hours / 12),
    }),
    icon: '✈️',
  });

  facts.push({
    id: 'time_sleep',
    text: t('Das entspricht {days} Tagen durchgehend schauen - ohne Schlaf!', { days }),
    icon: '😴',
  });

  // Top Serie
  if (ctx.topSeries.length > 0) {
    const top = ctx.topSeries[0];
    facts.push({
      id: 'top_series',
      text: t('"{title}" war dein Favorit mit {episodes} Episoden', {
        title: top.title,
        episodes: top.episodesWatched,
      }),
      icon: '🏆',
    });
  }

  // Aktivster Monat
  facts.push({
    id: 'active_month',
    text: t('Dein aktivster Monat war {month} mit {count} Titeln', {
      month: ctx.mostActiveMonth.monthName,
      count: ctx.mostActiveMonth.episodesWatched + ctx.mostActiveMonth.moviesWatched,
    }),
    icon: '📅',
  });

  // Tageszeit
  const timeEmoji = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙',
  };
  facts.push({
    id: 'time_of_day',
    text: t('Du schaust am liebsten {time}', {
      time: t(ctx.favoriteTimeOfDay.label).toLowerCase(),
    }),
    icon: timeEmoji[ctx.favoriteTimeOfDay.timeOfDay],
  });

  return facts;
}
