/**
 * 🔍 Badge Validator
 * 
 * Überprüft alle bestehenden Badges rückwirkend und löscht ungültige.
 * Stellt sicher, dass nur verdiente Badges existieren.
 */

import firebase from 'firebase/compat/app';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
import { BADGE_DEFINITIONS, type EarnedBadge } from './badgeSystem';

export interface ValidationResult {
  validBadges: EarnedBadge[];
  invalidBadges: EarnedBadge[];
  deletedBadges: string[];
  errors: string[];
}

/**
 * 🔍 Haupt-Validierung: Prüfe alle Badges eines Users
 */
export async function validateUserBadges(userId: string, deleteInvalid: boolean = false): Promise<ValidationResult> {
  const result: ValidationResult = {
    validBadges: [],
    invalidBadges: [],
    deletedBadges: [],
    errors: []
  };

  try {
    console.log(`🔍 Validiere Badges für User: ${userId}`);

    // 1. Lade alle aktuellen Badges
    const currentBadges = await getCurrentBadges(userId);
    console.log(`📊 Gefundene Badges: ${currentBadges.length}`);

    // 2. Lade User-Daten für Validierung
    const badgeSystem = getOfflineBadgeSystem(userId);
    const userData = await (badgeSystem as any).getUserData();

    // 3. Validiere jedes Badge einzeln
    for (const earnedBadge of currentBadges) {
      const isValid = await validateSingleBadge(earnedBadge, userData, userId);
      
      if (isValid) {
        result.validBadges.push(earnedBadge);
        console.log(`✅ Badge gültig: ${earnedBadge.name}`);
      } else {
        result.invalidBadges.push(earnedBadge);
        console.log(`❌ Badge ungültig: ${earnedBadge.name} - ${earnedBadge.details}`);
        
        // Lösche ungültiges Badge falls gewünscht
        if (deleteInvalid) {
          await deleteBadge(userId, earnedBadge.id);
          result.deletedBadges.push(earnedBadge.id);
          console.log(`🗑️ Badge gelöscht: ${earnedBadge.name}`);
        }
      }
    }

    console.log(`✅ Validierung abgeschlossen:`);
    console.log(`  - Gültige Badges: ${result.validBadges.length}`);
    console.log(`  - Ungültige Badges: ${result.invalidBadges.length}`);
    console.log(`  - Gelöschte Badges: ${result.deletedBadges.length}`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    result.errors.push(errorMsg);
    console.error('❌ Validierung fehlgeschlagen:', error);
  }

  return result;
}

/**
 * 🎯 Validiere einzelnes Badge
 */
async function validateSingleBadge(earnedBadge: EarnedBadge, userData: any, userId: string): Promise<boolean> {
  try {
    // Finde Badge-Definition
    const badgeDefinition = BADGE_DEFINITIONS.find(b => b.id === earnedBadge.id);
    if (!badgeDefinition) {
      console.warn(`⚠️ Badge-Definition nicht gefunden: ${earnedBadge.id}`);
      return false;
    }

    // Erstelle temporäres Offline Badge System für Validierung
    const badgeSystem = getOfflineBadgeSystem(userId);
    const validationResult = await (badgeSystem as any).checkBadgeRequirement(badgeDefinition, userData);

    // Badge ist gültig wenn die Anforderungen erfüllt sind
    return validationResult && validationResult.earned === true;

  } catch (error) {
    console.error(`❌ Fehler bei Validierung von Badge ${earnedBadge.id}:`, error);
    return false;
  }
}

/**
 * 📊 Lade aktuelle Badges
 */
async function getCurrentBadges(userId: string): Promise<EarnedBadge[]> {
  try {
    const snapshot = await firebase.database().ref(`badges/${userId}`).once('value');
    if (!snapshot.exists()) {
      return [];
    }
    return Object.values(snapshot.val()) as EarnedBadge[];
  } catch (error) {
    console.error('Fehler beim Laden der Badges:', error);
    return [];
  }
}

/**
 * 🗑️ Lösche ungültiges Badge
 */
async function deleteBadge(userId: string, badgeId: string): Promise<void> {
  try {
    await firebase.database().ref(`badges/${userId}/${badgeId}`).remove();
  } catch (error) {
    console.error(`Fehler beim Löschen von Badge ${badgeId}:`, error);
    throw error;
  }
}

/**
 * 🔄 Massenvalidierung für alle User
 */
export async function validateAllUsers(deleteInvalid: boolean = false): Promise<Map<string, ValidationResult>> {
  console.log('🌊 Starte Massenvalidierung aller User');
  
  const results = new Map<string, ValidationResult>();
  
  try {
    // Hole alle User-IDs aus badges-Branch
    const badgesSnapshot = await firebase.database().ref('badges').once('value');
    
    if (!badgesSnapshot.exists()) {
      console.log('Keine User mit Badges gefunden');
      return results;
    }
    
    const userIds = Object.keys(badgesSnapshot.val());
    console.log(`📊 Validiere ${userIds.length} User`);
    
    // Validiere jeden User einzeln (begrenzt auf 5 parallel)
    const batchSize = 5;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        const result = await validateUserBadges(userId, deleteInvalid);
        results.set(userId, result);
        return result;
      });
      
      await Promise.all(batchPromises);
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} validiert`);
      
      // Kleine Pause zwischen Batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Fehler bei Massenvalidierung:', error);
  }
  
  return results;
}

/**
 * 📈 Validierungs-Statistiken
 */
export function getValidationStats(results: Map<string, ValidationResult>): {
  totalUsers: number;
  totalBadges: number;
  validBadges: number;
  invalidBadges: number;
  deletedBadges: number;
  errorUsers: number;
} {
  let totalBadges = 0;
  let validBadges = 0;
  let invalidBadges = 0;
  let deletedBadges = 0;
  let errorUsers = 0;

  for (const result of results.values()) {
    totalBadges += result.validBadges.length + result.invalidBadges.length;
    validBadges += result.validBadges.length;
    invalidBadges += result.invalidBadges.length;
    deletedBadges += result.deletedBadges.length;
    
    if (result.errors.length > 0) {
      errorUsers++;
    }
  }

  return {
    totalUsers: results.size,
    totalBadges,
    validBadges,
    invalidBadges,
    deletedBadges,
    errorUsers
  };
}

/**
 * 🎯 Spezifische Badge-Kategorie validieren
 */
export async function validateBadgeCategory(
  userId: string, 
  category: string, 
  deleteInvalid: boolean = false
): Promise<ValidationResult> {
  const result: ValidationResult = {
    validBadges: [],
    invalidBadges: [],
    deletedBadges: [],
    errors: []
  };

  try {
    const currentBadges = await getCurrentBadges(userId);
    const categoryBadges = currentBadges.filter(b => b.category === category);
    
    console.log(`🔍 Validiere ${category} Badges für User ${userId}: ${categoryBadges.length} gefunden`);

    const badgeSystem = getOfflineBadgeSystem(userId);
    const userData = await (badgeSystem as any).getUserData();

    for (const badge of categoryBadges) {
      const isValid = await validateSingleBadge(badge, userData, userId);
      
      if (isValid) {
        result.validBadges.push(badge);
      } else {
        result.invalidBadges.push(badge);
        
        if (deleteInvalid) {
          await deleteBadge(userId, badge.id);
          result.deletedBadges.push(badge.id);
        }
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * 🧪 Trockenlauf: Nur prüfen, nicht löschen
 */
export async function dryRunValidation(userId: string): Promise<ValidationResult> {
  return validateUserBadges(userId, false);
}

// Export für Browser-Konsole
declare global {
  interface Window {
    badgeValidator: {
      validateUser: (userId: string, deleteInvalid?: boolean) => Promise<ValidationResult>;
      validateAllUsers: (deleteInvalid?: boolean) => Promise<Map<string, ValidationResult>>;
      validateCategory: (userId: string, category: string, deleteInvalid?: boolean) => Promise<ValidationResult>;
      dryRun: (userId: string) => Promise<ValidationResult>;
      getStats: (results: Map<string, ValidationResult>) => any;
    };
  }
}

if (typeof window !== 'undefined') {
  window.badgeValidator = {
    validateUser: validateUserBadges,
    validateAllUsers: validateAllUsers,
    validateCategory: validateBadgeCategory,
    dryRun: dryRunValidation,
    getStats: getValidationStats
  };
}