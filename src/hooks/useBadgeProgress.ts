/**
 * 🎯 Badge Progress Hook
 * 
 * Hook für real-time Badge-Fortschritt Updates
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { BadgeProgress } from '../utils/badgeDefinitions';
import { getOfflineBadgeSystem } from '../utils/offlineBadgeSystem';

export const useBadgeProgress = () => {
  const auth = useAuth();
  const user = auth?.user;
  const [progressData, setProgressData] = useState<Record<string, BadgeProgress>>({});
  const [loading, setLoading] = useState(false);

  const refreshProgress = useCallback(async (badgeIds?: string[]) => {
    if (!user) return;

    setLoading(true);
    try {
      const badgeSystem = getOfflineBadgeSystem(user.uid);
      const newProgressData: Record<string, BadgeProgress> = { ...progressData };

      if (badgeIds) {
        // Nur spezifische Badges aktualisieren
        for (const badgeId of badgeIds) {
          const progress = await badgeSystem.getBadgeProgress(badgeId);
          if (progress) {
            newProgressData[badgeId] = progress;
          } else {
            delete newProgressData[badgeId]; // Badge wurde erreicht
          }
        }
      } else {
        // Alle Fortschritte laden
        const { BADGE_DEFINITIONS } = await import('../utils/badgeDefinitions');
        const earnedBadges = await badgeSystem.getUserBadges();
        const earnedIds = new Set(earnedBadges.map(b => b.id));

        for (const badge of BADGE_DEFINITIONS) {
          if (!earnedIds.has(badge.id)) {
            const progress = await badgeSystem.getBadgeProgress(badge.id);
            if (progress) {
              newProgressData[badge.id] = progress;
            }
          }
        }
      }

      setProgressData(newProgressData);
    } catch (error) {
      console.error('Error refreshing badge progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, progressData]);

  const getProgressForBadge = useCallback((badgeId: string): BadgeProgress | undefined => {
    return progressData[badgeId];
  }, [progressData]);

  const getProgressForCategory = useCallback((category: string): BadgeProgress[] => {
    return Object.values(progressData).filter(p => 
      p.badgeId.includes(category) // Simple category check
    );
  }, [progressData]);

  // Listen for badge progress updates
  useEffect(() => {
    const handleProgressUpdate = (event: any) => {
      const { userId, type } = event.detail;
      if (user && userId === user.uid) {
        console.log('🔄 Badge progress update detected:', type);
        refreshProgress();
      }
    };

    window.addEventListener('badgeProgressUpdate', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('badgeProgressUpdate', handleProgressUpdate);
    };
  }, [user, refreshProgress]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshProgress();
    }
  }, [user]);

  return {
    progressData,
    loading,
    refreshProgress,
    getProgressForBadge,
    getProgressForCategory,
  };
};

export default useBadgeProgress;