/**
 * Wrapped Fun Facts - Fun-Fact-Generierung
 */

import type { TopSeriesEntry, MonthStats, TimeOfDayStats, FunFact } from '../../types/Wrapped';

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
    text: `Mit ${hours} Stunden könntest du ${Math.round(hours / 12)} Mal nach New York fliegen ✈️`,
    icon: '✈️',
  });

  facts.push({
    id: 'time_sleep',
    text: `Das entspricht ${days} Tagen durchgehend schauen - ohne Schlaf!`,
    icon: '😴',
  });

  // Top Serie
  if (ctx.topSeries.length > 0) {
    const top = ctx.topSeries[0];
    facts.push({
      id: 'top_series',
      text: `"${top.title}" war dein Favorit mit ${top.episodesWatched} Episoden`,
      icon: '🏆',
    });
  }

  // Aktivster Monat
  facts.push({
    id: 'active_month',
    text: `Dein aktivster Monat war ${ctx.mostActiveMonth.monthName} mit ${ctx.mostActiveMonth.episodesWatched + ctx.mostActiveMonth.moviesWatched} Titeln`,
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
    text: `Du schaust am liebsten ${ctx.favoriteTimeOfDay.label.toLowerCase()}`,
    icon: timeEmoji[ctx.favoriteTimeOfDay.timeOfDay],
  });

  return facts;
}
