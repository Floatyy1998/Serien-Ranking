/**
 * 🔄 Badge System Migration
 * 
 * Migriert vom Firebase-Activity-System zum Offline-First Badge-System.
 * Löscht keine bestehenden Badges, berechnet aber alle neu.
 */

import firebase from 'firebase/compat/app';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
import type { EarnedBadge } from './badgeDefinitions';

export interface MigrationResult {
  success: boolean;
  migratedBadges: number;
  newBadges: EarnedBadge[];
  errors: string[];
  cleanedActivities: number;
}

/**
 * 🚀 Haupt-Migration für einen User
 */
export async function migrateBadgeSystemForUser(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedBadges: 0,
    newBadges: [],
    errors: [],
    cleanedActivities: 0
  };

  try {
    console.log(`🔄 Starte Badge-Migration für User: ${userId}`);

    // 1. Hole aktuelle Badges
    const currentBadges = await getCurrentBadges(userId);
    result.migratedBadges = currentBadges.length;
    console.log(`📊 Aktuelle Badges: ${currentBadges.length}`);

    // 2. Berechne neue Badges mit Offline-System
    const offlineBadgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await offlineBadgeSystem.recalculateAllBadges();
    result.newBadges = newBadges;
    console.log(`🆕 Neue Badges gefunden: ${newBadges.length}`);

    // 3. Optional: Lösche BadgeActivities (nur wenn explizit gewünscht)
    // const cleanedCount = await cleanupBadgeActivities(userId);
    // result.cleanedActivities = cleanedCount;
    // console.log(`🧹 Badge-Activities gelöscht: ${cleanedCount}`);

    result.success = true;
    console.log(`✅ Migration erfolgreich für User: ${userId}`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    result.errors.push(errorMsg);
    console.error(`❌ Migration-Fehler für User ${userId}:`, error);
  }

  return result;
}

/**
 * 📊 Hole aktuelle Badges eines Users
 */
async function getCurrentBadges(userId: string): Promise<EarnedBadge[]> {
  try {
    const snapshot = await firebase.database().ref(`badges/${userId}`).once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error('Fehler beim Laden der Badges:', error);
    return [];
  }
}

/**
 * 🧹 Lösche Badge-Activities (Optional - nur bei expliziter Bestätigung)
 */
export async function cleanupBadgeActivities(userId: string): Promise<number> {
  try {
    const activitiesRef = firebase.database().ref(`badgeActivities/${userId}`);
    const snapshot = await activitiesRef.once('value');
    
    if (!snapshot.exists()) {
      return 0;
    }

    const activities = Object.keys(snapshot.val() || {});
    const count = activities.length;

    // Lösche alle Badge-Activities
    await activitiesRef.remove();
    
    console.log(`🧹 ${count} Badge-Activities gelöscht für User: ${userId}`);
    return count;
  } catch (error) {
    console.error('Fehler beim Löschen der Badge-Activities:', error);
    return 0;
  }
}

/**
 * 🔧 Test-Migration für Entwicklung
 */
export async function testMigration(userId: string): Promise<void> {
  console.log('🧪 Starte Test-Migration...');
  
  const result = await migrateBadgeSystemForUser(userId);
  
  console.log('📋 Migration-Ergebnis:');
  console.log(`- Erfolg: ${result.success}`);
  console.log(`- Migrierte Badges: ${result.migratedBadges}`);
  console.log(`- Neue Badges: ${result.newBadges.length}`);
  console.log(`- Fehler: ${result.errors.length}`);
  
  if (result.newBadges.length > 0) {
    console.log('🆕 Neue Badges:');
    result.newBadges.forEach(badge => {
      console.log(`  - ${badge.name}: ${badge.details}`);
    });
  }
  
  if (result.errors.length > 0) {
    console.log('❌ Fehler:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
}

/**
 * 🌊 Massen-Migration für alle User (vorsichtig verwenden!)
 */
export async function migrateAllUsers(): Promise<Map<string, MigrationResult>> {
  console.log('🌊 Starte Massen-Migration - VORSICHT!');
  
  const results = new Map<string, MigrationResult>();
  
  try {
    // Hole alle User-IDs aus badges-Branch
    const badgesSnapshot = await firebase.database().ref('badges').once('value');
    
    if (!badgesSnapshot.exists()) {
      console.log('Keine User mit Badges gefunden');
      return results;
    }
    
    const userIds = Object.keys(badgesSnapshot.val());
    console.log(`📊 Gefundene User: ${userIds.length}`);
    
    // Migriere jeden User einzeln (begrenzt auf 10 parallel)
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        const result = await migrateBadgeSystemForUser(userId);
        results.set(userId, result);
        return result;
      });
      
      await Promise.all(batchPromises);
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen`);
      
      // Kleine Pause zwischen Batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Fehler bei Massen-Migration:', error);
  }
  
  return results;
}

/**
 * 🎯 Badge-System-Status prüfen
 */
export async function checkBadgeSystemStatus(userId: string): Promise<{
  currentBadges: number;
  badgeActivities: number;
  newBadgesAvailable: number;
}> {
  try {
    // Aktuelle Badges
    const currentBadges = await getCurrentBadges(userId);
    
    // Badge-Activities zählen
    const activitiesSnapshot = await firebase.database()
      .ref(`badgeActivities/${userId}`)
      .once('value');
    const badgeActivities = activitiesSnapshot.exists() 
      ? Object.keys(activitiesSnapshot.val()).length 
      : 0;
    
    // Neue Badges testen
    const offlineBadgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await offlineBadgeSystem.checkForNewBadges();
    
    return {
      currentBadges: currentBadges.length,
      badgeActivities,
      newBadgesAvailable: newBadges.length
    };
  } catch (error) {
    console.error('Fehler beim Status-Check:', error);
    return {
      currentBadges: 0,
      badgeActivities: 0,
      newBadgesAvailable: 0
    };
  }
}

// Export für Browser-Konsole
declare global {
  interface Window {
    badgeMigration: {
      testMigration: (userId: string) => Promise<void>;
      migrateBadgeSystemForUser: (userId: string) => Promise<MigrationResult>;
      checkStatus: (userId: string) => Promise<any>;
      cleanupActivities: (userId: string) => Promise<number>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.badgeMigration = {
    testMigration,
    migrateBadgeSystemForUser,
    checkStatus: checkBadgeSystemStatus,
    cleanupActivities: cleanupBadgeActivities
  };
}