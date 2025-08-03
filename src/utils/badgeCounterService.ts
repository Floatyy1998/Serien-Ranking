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
   * 🍿 Binge-Session Counter
   */
  async recordBingeSession(userId: string, episodeCount: number, timeframe: string): Promise<void> {
    try {
      console.log(`🍿 Recording binge session: ${episodeCount} episodes (${timeframe}) for user ${userId}`);
      
      const now = Date.now();
      const sessionRef = firebase.database().ref(`badgeCounters/${userId}/bingeSessions`).push();
      
      const sessionData = {
        episodeCount,
        timeframe,
        timestamp: now,
        expiresAt: now + (24 * 60 * 60 * 1000) // 24h TTL
      };
      
      console.log('🍿 Session data:', sessionData);
      await sessionRef.set(sessionData);
      console.log('✅ Binge session saved to Firebase');

      // Update max binge counter
      const maxBingeRef = firebase.database().ref(`badgeCounters/${userId}/maxBingeEpisodes`);
      const transactionResult = await maxBingeRef.transaction((current) => {
        const newMax = Math.max(current || 0, episodeCount);
        console.log(`📊 MaxBinge update: ${current || 0} -> ${newMax}`);
        return newMax;
      });
      
      if (transactionResult.committed) {
        console.log('✅ MaxBingeEpisodes updated successfully:', transactionResult.snapshot.val());
      } else {
        console.error('❌ MaxBingeEpisodes transaction failed');
      }
    } catch (error) {
      console.error('❌ Fehler beim Binge-Counter:', error);
      console.error('Error details:', error);
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