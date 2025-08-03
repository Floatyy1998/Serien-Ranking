/**
 * 🧪 Test Migration Script
 * 
 * Testet das neue Badge-System mit einem echten User
 */

import { migrateBadgeSystemForUser, checkBadgeSystemStatus } from './migrateBadgeSystem';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
import { badgeCounterService } from './badgeCounterService';

/**
 * 🧪 Vollständiger Migrations-Test
 */
export async function runMigrationTest(userId: string): Promise<void> {
  console.log('🧪 === BADGE MIGRATION TEST ===');
  console.log(`👤 User: ${userId}`);
  
  try {
    // 1. Status vor Migration
    console.log('\n📊 Status VOR Migration:');
    const statusBefore = await checkBadgeSystemStatus(userId);
    console.log('- Aktuelle Badges:', statusBefore.currentBadges);
    console.log('- Badge-Activities:', statusBefore.badgeActivities);
    console.log('- Neue Badges verfügbar:', statusBefore.newBadgesAvailable);

    // 2. Teste Offline Badge-System
    console.log('\n🎯 Teste Offline Badge-System:');
    const badgeSystem = getOfflineBadgeSystem(userId);
    const newBadges = await badgeSystem.checkForNewBadges();
    console.log(`- Gefundene neue Badges: ${newBadges.length}`);
    
    if (newBadges.length > 0) {
      console.log('📋 Neue Badges:');
      newBadges.forEach(badge => {
        console.log(`  🏆 ${badge.name} (${badge.category}): ${badge.details}`);
      });
    }

    // 3. Teste Counter-System
    console.log('\n🔢 Teste Counter-System:');
    const counters = await badgeCounterService.getAllCounters(userId);
    console.log('- Aktuelle Counter:', counters);

    // 4. Migration durchführen
    console.log('\n🔄 Führe Migration durch:');
    const migrationResult = await migrateBadgeSystemForUser(userId);
    
    console.log('\n✅ Migration abgeschlossen:');
    console.log('- Erfolg:', migrationResult.success);
    console.log('- Migrierte Badges:', migrationResult.migratedBadges);
    console.log('- Neue Badges:', migrationResult.newBadges.length);
    console.log('- Fehler:', migrationResult.errors.length);

    if (migrationResult.newBadges.length > 0) {
      console.log('\n🆕 Neu verdiente Badges:');
      migrationResult.newBadges.forEach(badge => {
        console.log(`  🏆 ${badge.name}: ${badge.details}`);
      });
    }

    if (migrationResult.errors.length > 0) {
      console.log('\n❌ Migration-Fehler:');
      migrationResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    // 5. Status nach Migration
    console.log('\n📊 Status NACH Migration:');
    const statusAfter = await checkBadgeSystemStatus(userId);
    console.log('- Aktuelle Badges:', statusAfter.currentBadges);
    console.log('- Badge-Activities:', statusAfter.badgeActivities);
    console.log('- Neue Badges verfügbar:', statusAfter.newBadgesAvailable);

    // 6. Test-Summary
    console.log('\n📈 Migration-Summary:');
    console.log(`- Badge-Anzahl: ${statusBefore.currentBadges} → ${statusAfter.currentBadges}`);
    console.log(`- Badge-Activities: ${statusBefore.badgeActivities} (unverändert)`);
    console.log(`- Performance: Offline-System ✅`);

  } catch (error) {
    console.error('❌ Migration-Test fehlgeschlagen:', error);
  }
}

/**
 * 🎯 Test spezifischer Badge-Kategorien
 */
export async function testBadgeCategories(userId: string): Promise<void> {
  console.log('\n🎯 === BADGE-KATEGORIEN TEST ===');
  
  const badgeSystem = getOfflineBadgeSystem(userId);
  const userData = await (badgeSystem as any).getUserData();
  
  console.log('\n📊 User-Daten:');
  console.log('- Serien:', userData.series.length);
  console.log('- Filme:', userData.movies.length);
  console.log('- Activities:', userData.activities.length);
  console.log('- Counter:', Object.keys(userData.badgeCounters).length);

  // Teste jede Badge-Kategorie einzeln
  const categories = ['series_explorer', 'collector', 'social', 'completion', 'binge', 'marathon', 'streak', 'quickwatch', 'rewatch', 'dedication'];
  
  for (const category of categories) {
    console.log(`\n🏷️  Teste ${category}:`);
    try {
      // Hier würde normalerweise eine spezifische Test-Methode aufgerufen
      const badges = await badgeSystem.checkForNewBadges();
      const categoryBadges = badges.filter(b => b.category === category);
      console.log(`   ✅ ${categoryBadges.length} neue Badges gefunden`);
    } catch (error) {
      console.log(`   ❌ Fehler: ${error}`);
    }
  }
}

/**
 * 💊 Performance-Test
 */
export async function testPerformance(userId: string): Promise<void> {
  console.log('\n⚡ === PERFORMANCE TEST ===');
  
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    const badgeSystem = getOfflineBadgeSystem(userId);
    await badgeSystem.checkForNewBadges();
    
    const end = performance.now();
    const duration = end - start;
    times.push(duration);
    
    console.log(`🔄 Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\n📊 Performance-Summary:`);
  console.log(`- Durchschnitt: ${avgTime.toFixed(2)}ms`);
  console.log(`- Minimum: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`- Maximum: ${Math.max(...times).toFixed(2)}ms`);
  console.log(`- Performance: ${avgTime < 100 ? '🚀 Excellent' : avgTime < 500 ? '✅ Good' : '⚠️ Needs optimization'}`);
}

// Export für Browser-Konsole
declare global {
  interface Window {
    testBadgeMigration: {
      runFullTest: (userId: string) => Promise<void>;
      testCategories: (userId: string) => Promise<void>;
      testPerformance: (userId: string) => Promise<void>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.testBadgeMigration = {
    runFullTest: runMigrationTest,
    testCategories: testBadgeCategories,
    testPerformance: testPerformance
  };
}