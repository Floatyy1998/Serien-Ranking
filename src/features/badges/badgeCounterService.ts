/**
 * 🔢 Badge Counter Service
 *
 * Verwaltet einfache Counter für Badges ohne Activities zu speichern.
 * Nur für zeitkritische Badges wie Quickwatch die nicht aus Serien-Daten berechenbar sind.
 */

import { dbRef, dbGet, userPath } from '../../lib/db/ref';

class BadgeCounterService {
  /**
   * ⚡ Quickwatch-Counter erhöhen
   */
  async incrementQuickwatchCounter(userId: string): Promise<void> {
    try {
      const counterRef = dbRef(userPath(userId, 'badgeCounters', 'quickwatchEpisodes'));
      await counterRef.transaction((current) => (current || 0) + 1);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🔄 Rewatch-Counter erhöhen (Fallback falls watchCount nicht verfügbar)
   */
  async incrementRewatchCounter(userId: string): Promise<void> {
    try {
      const counterRef = dbRef(userPath(userId, 'badgeCounters', 'rewatchEpisodes'));
      await counterRef.transaction((current) => (current || 0) + 1);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 📊 Streak-Counter aktualisieren (basierend auf täglicher Aktivität)
   */
  async updateStreakCounter(userId: string): Promise<void> {
    try {
      const today = new Date().toDateString();
      const lastActivityRef = dbRef(userPath(userId, 'badgeCounters', 'lastActivityDate'));
      const streakRef = dbRef(userPath(userId, 'badgeCounters', 'currentStreak'));

      const lastActivitySnapshot = await lastActivityRef.once('value');
      const lastActivityDate = lastActivitySnapshot.val();

      if (lastActivityDate === today) {
        // Bereits heute aktiv - Streak bleibt gleich
        return;
      }

      const currentStreakSnapshot = await streakRef.once('value');
      let currentStreak = currentStreakSnapshot.val() || 0;

      if (lastActivityDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActivityDate === yesterdayStr) {
          // Gestern war letzte Aktivität - Streak erhöhen
          currentStreak += 1;
        } else {
          // Lücke in der Streak - neu anfangen
          currentStreak = 1;
        }
      } else {
        // Erste Aktivität
        currentStreak = 1;
      }

      // Aktualisiere beide Werte
      await Promise.all([lastActivityRef.set(today), streakRef.set(currentStreak)]);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🤝 Social Badge Counter erhöhen (echte Hinzufügungen)
   */
  async incrementSocialCounter(userId: string, type: 'series' | 'movie'): Promise<void> {
    try {
      const counterRef = dbRef(userPath(userId, 'badgeCounters', 'itemsAdded'));
      await counterRef.transaction((current) => (current || 0) + 1);

      // Auch typ-spezifische Counter
      const typeCounterRef = dbRef(userPath(userId, 'badgeCounters', `${type}Added`));
      await typeCounterRef.transaction((current) => (current || 0) + 1);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🍿 Multi-Timeframe Binge-Session Counter mit 2-Step Process
   */
  async recordBingeEpisode(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const timeframes = [
        { key: '10hours', duration: 10 * 60 * 60 * 1000 }, // 10h für Binge-Sessions
        { key: '1day', duration: 24 * 60 * 60 * 1000 }, // 1 Tag
        { key: '2days', duration: 48 * 60 * 60 * 1000 }, // Wochenende
      ];

      // STEP 1: Erst alle abgelaufenen Sessions auf 0 setzen
      for (const timeframe of timeframes) {
        const bingeRef = dbRef(userPath(userId, 'badgeCounters', 'bingeWindows', timeframe.key));

        await bingeRef.transaction((current) => {
          if (!current) return current; // Keine Session vorhanden

          const windowEnd = current.windowEnd || 0;
          if (now > windowEnd) {
            // Session abgelaufen → auf 0 setzen (Session beenden)
            return null; // Session löschen = count 0
          }
          return current; // Session läuft noch, nichts ändern
        });
      }

      // STEP 2: Dann neue Episode hinzufügen (neue Session starten wenn nötig)
      for (const timeframe of timeframes) {
        const bingeRef = dbRef(userPath(userId, 'badgeCounters', 'bingeWindows', timeframe.key));

        await bingeRef.transaction((current) => {
          if (!current) {
            // Keine aktive Session → neue Session mit erster Episode starten
            return {
              count: 1,
              windowEnd: now + timeframe.duration,
              startTime: now,
            };
          } else {
            // Session läuft noch → Episode hinzufügen
            return {
              ...current,
              count: current.count + 1,
            };
          }
        });
      }
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🧹 Manuelle Cleanup-Funktion für abgelaufene Binge-Sessions
   */
  async finalizeBingeSession(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const timeframes = ['10hours', '1day', '2days'];

      for (const timeframe of timeframes) {
        const bingeRef = dbRef(userPath(userId, 'badgeCounters', 'bingeWindows', timeframe));
        const snapshot = await bingeRef.once('value');
        const current = snapshot.val();

        if (current?.windowEnd && now > current.windowEnd) {
          await bingeRef.remove(); // Abgelaufene Session entfernen
        }
      }
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🏃 Marathon-Session Counter (wöchentlich) - Ein Episode zur aktuellen Woche hinzufügen
   */
  async recordMarathonEpisode(userId: string): Promise<void> {
    try {
      const weekKey = this.getWeekKey();
      const marathonRef = dbRef(userPath(userId, 'badgeCounters', 'marathonWeeks', weekKey));

      await marathonRef.transaction((current) => {
        const newValue = (current || 0) + 1;
        return newValue;
      });
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🏃 Marathon-Session Counter (wöchentlich) - LEGACY: Mehrere Episoden hinzufügen
   */
  async recordMarathonProgress(userId: string, episodeCount: number): Promise<void> {
    try {
      const weekKey = this.getWeekKey();
      const marathonRef = dbRef(userPath(userId, 'badgeCounters', 'marathonWeeks', weekKey));

      await marathonRef.transaction((current) => (current || 0) + episodeCount);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 📊 Aktuelle Marathon-Statistiken für Timer-Anzeige
   */
  async getMarathonStats(userId: string): Promise<{
    currentWeekEpisodes: number;
    bestWeekEpisodes: number;
    timeRemainingInWeek: number;
    currentWeekKey: string;
  }> {
    try {
      const weekKey = this.getWeekKey();
      const marathonWeeksRef = dbRef(userPath(userId, 'badgeCounters', 'marathonWeeks'));
      const snapshot = await marathonWeeksRef.once('value');
      const marathonWeeks = snapshot.val() || {};

      const currentWeekEpisodes = marathonWeeks[weekKey] || 0;
      const allWeeklyEpisodes = Object.values(marathonWeeks) as number[];
      const bestWeekEpisodes = allWeeklyEpisodes.length > 0 ? Math.max(...allWeeklyEpisodes) : 0;

      return {
        currentWeekEpisodes,
        bestWeekEpisodes: Math.max(bestWeekEpisodes, currentWeekEpisodes),
        timeRemainingInWeek: this.getTimeRemainingInWeek(),
        currentWeekKey: weekKey,
      };
    } catch {
      return {
        currentWeekEpisodes: 0,
        bestWeekEpisodes: 0,
        timeRemainingInWeek: 0,
        currentWeekKey: this.getWeekKey(),
      };
    }
  }

  /**
   * 🕰️ Berechne verbleibende Zeit bis Wochenende
   */
  private getTimeRemainingInWeek(): number {
    const now = new Date();
    const endOfWeek = new Date(now);

    // Setze auf Sonntag 23:59:59
    const daysUntilSunday = 7 - now.getDay(); // 0 = Sonntag, 1 = Montag, etc.
    endOfWeek.setDate(now.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
    endOfWeek.setHours(23, 59, 59, 999);

    return Math.max(0, Math.ceil((endOfWeek.getTime() - now.getTime()) / 1000));
  }

  /**
   * Get current week key for grouping (ISO Week format)
   */
  private getWeekKey(): string {
    const now = new Date();

    // ISO Week Calculation (Monday = Start of week)
    const target = new Date(now.getTime());
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    target.setDate(now.getDate() - dayOfWeek + 3); // Thursday of current week

    const year = target.getFullYear();
    const firstThursday = new Date(year, 0, 4); // January 4th is always in week 1
    const weekNumber = Math.ceil(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000) + 1
    );

    return `${year}-W${weekNumber}`;
  }

  /**
   * 🎯 Beliebigen Counter erhöhen
   */
  async incrementCounter(userId: string, counterName: string, amount: number = 1): Promise<void> {
    try {
      const counterRef = dbRef(userPath(userId, 'badgeCounters', counterName));
      await counterRef.transaction((current) => (current || 0) + amount);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 📖 Counter lesen
   */
  async getCounter(userId: string, counterName: string): Promise<number> {
    try {
      return (await dbGet<number>(userPath(userId, 'badgeCounters', counterName))) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 📊 Alle Counter eines Users
   */
  async getAllCounters(userId: string): Promise<Record<string, number>> {
    try {
      return (await dbGet<Record<string, number>>(userPath(userId, 'badgeCounters'))) || {};
    } catch {
      return {};
    }
  }

  /**
   * 🧹 Counter zurücksetzen
   */
  async resetCounter(userId: string, counterName: string): Promise<void> {
    try {
      await dbRef(userPath(userId, 'badgeCounters', counterName)).set(0);
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🗑️ Alle Counter löschen
   */
  async clearAllCounters(userId: string): Promise<void> {
    try {
      await dbRef(userPath(userId, 'badgeCounters')).remove();
    } catch {
      /* ignore — non-critical write/read */
    }
  }

  /**
   * 🏃 Marathon-Woche überprüfen und neue erstellen falls nötig
   */
  async ensureCurrentMarathonWeek(userId: string): Promise<void> {
    try {
      const currentWeekKey = this.getWeekKey();
      const marathonWeeksRef = dbRef(userPath(userId, 'badgeCounters', 'marathonWeeks'));
      const snapshot = await marathonWeeksRef.once('value');
      const marathonWeeks = snapshot.val() || {};

      // Prüfe ob aktuelle Woche bereits existiert
      if (!marathonWeeks[currentWeekKey]) {
        // Neue Woche mit 0 Episoden erstellen
        await marathonWeeksRef.child(currentWeekKey).set(0);
      }
    } catch {
      /* ignore — non-critical write/read */
    }
  }
}

// Singleton Export
export const badgeCounterService = new BadgeCounterService();
export default badgeCounterService;
