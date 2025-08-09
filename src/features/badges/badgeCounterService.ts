/**
 * 🔢 Badge Counter Service
 * 
 * Verwaltet einfache Counter für Badges ohne Activities zu speichern.
 * Nur für zeitkritische Badges wie Quickwatch die nicht aus Serien-Daten berechenbar sind.
 */

import firebase from 'firebase/compat/app';

class BadgeCounterService {
  /**
   * ⚡ Quickwatch-Counter erhöhen
   */
  async incrementQuickwatchCounter(userId: string): Promise<void> {
    try {
      const counterRef = firebase.database().ref(`badgeCounters/${userId}/quickwatchEpisodes`);
      await counterRef.transaction((current) => (current || 0) + 1);
    } catch (error) {
      console.error('Fehler beim Quickwatch-Counter:', error);
    }
  }

  /**
   * 🔄 Rewatch-Counter erhöhen (Fallback falls watchCount nicht verfügbar)
   */
  async incrementRewatchCounter(userId: string): Promise<void> {
    try {
      const counterRef = firebase.database().ref(`badgeCounters/${userId}/rewatchEpisodes`);
      await counterRef.transaction((current) => (current || 0) + 1);
    } catch (error) {
      console.error('Fehler beim Rewatch-Counter:', error);
    }
  }

  /**
   * 📊 Streak-Counter aktualisieren (basierend auf täglicher Aktivität)
   */
  async updateStreakCounter(userId: string): Promise<void> {
    try {
      const today = new Date().toDateString();
      const lastActivityRef = firebase.database().ref(`badgeCounters/${userId}/lastActivityDate`);
      const streakRef = firebase.database().ref(`badgeCounters/${userId}/currentStreak`);
      
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
      await Promise.all([
        lastActivityRef.set(today),
        streakRef.set(currentStreak)
      ]);
      
    } catch (error) {
      console.error('Fehler beim Streak-Counter:', error);
    }
  }

  /**
   * 🤝 Social Badge Counter erhöhen (echte Hinzufügungen)
   */
  async incrementSocialCounter(userId: string, type: 'series' | 'movie'): Promise<void> {
    try {
      const counterRef = firebase.database().ref(`badgeCounters/${userId}/itemsAdded`);
      await counterRef.transaction((current) => (current || 0) + 1);
      
      // Auch typ-spezifische Counter
      const typeCounterRef = firebase.database().ref(`badgeCounters/${userId}/${type}Added`);
      await typeCounterRef.transaction((current) => (current || 0) + 1);
    } catch (error) {
      console.error('Fehler beim Social-Counter:', error);
    }
  }

  /**
   * 🍿 Multi-Timeframe Binge-Session Counter mit 2-Step Process
   */
  async recordBingeEpisode(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const timeframes = [
        { key: '10hours', duration: 10 * 60 * 60 * 1000 },    // 10h für Binge-Sessions
        { key: '1day', duration: 24 * 60 * 60 * 1000 },       // 1 Tag
        { key: '2days', duration: 48 * 60 * 60 * 1000 }       // Wochenende
      ];

      // STEP 1: Erst alle abgelaufenen Sessions auf 0 setzen
      for (const timeframe of timeframes) {
        const bingeRef = firebase.database().ref(`badgeCounters/${userId}/bingeWindows/${timeframe.key}`);
        
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
        const bingeRef = firebase.database().ref(`badgeCounters/${userId}/bingeWindows/${timeframe.key}`);
        
        await bingeRef.transaction((current) => {
          if (!current) {
            // Keine aktive Session → neue Session mit erster Episode starten
            return {
              count: 1,
              windowEnd: now + timeframe.duration,
              startTime: now
            };
          } else {
            // Session läuft noch → Episode hinzufügen
            return {
              ...current,
              count: current.count + 1
            };
          }
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Multi-Timeframe-Binge-Counter:', error);
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
        const bingeRef = firebase.database().ref(`badgeCounters/${userId}/bingeWindows/${timeframe}`);
        const snapshot = await bingeRef.once('value');
        const current = snapshot.val();
        
        if (current?.windowEnd && now > current.windowEnd) {
          await bingeRef.remove(); // Abgelaufene Session entfernen
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Multi-Timeframe-Binge-Cleanup:', error);
    }
  }



  /**
   * 🏃 Marathon-Session Counter (wöchentlich)
   */
  async recordMarathonProgress(userId: string, episodeCount: number): Promise<void> {
    try {
      const weekKey = this.getWeekKey();
      const marathonRef = firebase.database().ref(`badgeCounters/${userId}/marathonWeeks/${weekKey}`);
      
      await marathonRef.transaction((current) => (current || 0) + episodeCount);
    } catch (error) {
      console.error('Fehler beim Marathon-Counter:', error);
    }
  }

  /**
   * Get current week key for grouping
   */
  private getWeekKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  /**
   * 🎯 Beliebigen Counter erhöhen
   */
  async incrementCounter(userId: string, counterName: string, amount: number = 1): Promise<void> {
    try {
      const counterRef = firebase.database().ref(`badgeCounters/${userId}/${counterName}`);
      await counterRef.transaction((current) => (current || 0) + amount);
    } catch (error) {
      console.error(`Fehler beim ${counterName}-Counter:`, error);
    }
  }

  /**
   * 📖 Counter lesen
   */
  async getCounter(userId: string, counterName: string): Promise<number> {
    try {
      const snapshot = await firebase.database().ref(`badgeCounters/${userId}/${counterName}`).once('value');
      return snapshot.val() || 0;
    } catch (error) {
      console.error(`Fehler beim Lesen des ${counterName}-Counters:`, error);
      return 0;
    }
  }

  /**
   * 📊 Alle Counter eines Users
   */
  async getAllCounters(userId: string): Promise<Record<string, number>> {
    try {
      const snapshot = await firebase.database().ref(`badgeCounters/${userId}`).once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('Fehler beim Lesen aller Counter:', error);
      return {};
    }
  }

  /**
   * 🧹 Counter zurücksetzen
   */
  async resetCounter(userId: string, counterName: string): Promise<void> {
    try {
      await firebase.database().ref(`badgeCounters/${userId}/${counterName}`).set(0);
    } catch (error) {
      console.error(`Fehler beim Zurücksetzen des ${counterName}-Counters:`, error);
    }
  }

  /**
   * 🗑️ Alle Counter löschen
   */
  async clearAllCounters(userId: string): Promise<void> {
    try {
      await firebase.database().ref(`badgeCounters/${userId}`).remove();
    } catch (error) {
      console.error('Fehler beim Löschen aller Counter:', error);
    }
  }
}

// Singleton Export
export const badgeCounterService = new BadgeCounterService();
export default badgeCounterService;