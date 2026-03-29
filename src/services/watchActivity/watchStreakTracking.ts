/**
 * Watch Streak Tracking
 *
 * Berechnet und verwaltet die tägliche Watch-Streak des Nutzers.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { WatchStreak } from '../../types/WatchActivity';
import { toLocalDateString } from '../../lib/date/date.utils';
import { getStreakPath } from './shared';

export async function updateWatchStreak(userId: string): Promise<void> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const today = toLocalDateString(now);
    const streakRef = firebase.database().ref(getStreakPath(userId, year));
    const snapshot = await streakRef.once('value');

    const currentStreak: WatchStreak = (snapshot.val() as WatchStreak | null) ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastWatchDate: '',
      streaks: [],
    };

    const lastDate = currentStreak.lastWatchDate;

    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    if (lastDate === yesterdayStr) {
      currentStreak.currentStreak += 1;
      if (currentStreak.currentStreak > currentStreak.longestStreak) {
        currentStreak.longestStreak = currentStreak.currentStreak;
      }
    } else if (lastDate) {
      if (currentStreak.currentStreak > 1) {
        const streakStart = new Date();
        streakStart.setDate(streakStart.getDate() - currentStreak.currentStreak);
        currentStreak.streaks.push({
          startDate: toLocalDateString(streakStart),
          endDate: lastDate,
          length: currentStreak.currentStreak,
        });
        if (currentStreak.streaks.length > 20) {
          currentStreak.streaks = currentStreak.streaks.slice(-20);
        }
      }
      currentStreak.currentStreak = 1;
    } else {
      currentStreak.currentStreak = 1;
    }

    currentStreak.lastWatchDate = today;
    await streakRef.set(currentStreak);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to update watch streak: ${message}`);
  }
}

export async function getWatchStreak(userId: string, year: number): Promise<WatchStreak | null> {
  try {
    const snapshot = await firebase.database().ref(getStreakPath(userId, year)).once('value');
    return snapshot.val() as WatchStreak | null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to get watch streak: ${message}`);
    return null;
  }
}
