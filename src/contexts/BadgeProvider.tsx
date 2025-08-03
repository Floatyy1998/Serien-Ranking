import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../App';
import { EarnedBadge } from '../utils/badgeDefinitions';
// activityBatchManager entfernt - Badge-Callbacks jetzt direkt über minimalActivityLogger
import BadgeNotification from '../components/badges/BadgeNotification';
import BadgeOverviewDialog from '../components/badges/BadgeOverviewDialog';

interface BadgeContextType {
  showBadgeOverview: () => void;
  newBadges: EarnedBadge[];
  clearNewBadges: () => void;
}

const BadgeContext = createContext<BadgeContextType | null>(null);

interface BadgeProviderProps {
  children: ReactNode;
}

export const BadgeProvider: React.FC<BadgeProviderProps> = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;

  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [showOverviewDialog, setShowOverviewDialog] = useState(false);

  // Registriere Badge-Callback beim minimalActivityLogger
  useEffect(() => {
    if (user) {
      const handleNewBadges = (badges: EarnedBadge[]) => {
        // Zusätzliche Duplikat-Filterung auf UI-Ebene
        setNewBadges(prev => {
          const existingBadgeIds = new Set(prev.map(b => b.id));
          const newUniqueBadges = badges.filter(badge => !existingBadgeIds.has(badge.id));
          
          if (newUniqueBadges.length > 0) {
            console.log('🎉 New badges received:', newUniqueBadges.map(b => b.name));
            return [...prev, ...newUniqueBadges];
          }
          return prev;
        });
      };

      let cleanup: (() => void) | null = null;

      // Dynamischer Import um zirkuläre Abhängigkeiten zu vermeiden
      import('../utils/minimalActivityLogger').then(({ registerBadgeCallback, removeBadgeCallback }) => {
        registerBadgeCallback(user.uid, handleNewBadges);
        console.log('🎯 Badge callback registered for user:', user.uid);

        cleanup = () => {
          removeBadgeCallback(user.uid);
          console.log('🎯 Badge callback removed for user:', user.uid);
        };
      });

      // Korrekte Cleanup-Funktion
      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [user]);

  // Zeige Badges nacheinander an
  useEffect(() => {
    if (newBadges.length > 0 && !showNotification) {
      if (currentBadgeIndex < newBadges.length) {
        setShowNotification(true);
      }
    }
  }, [newBadges, currentBadgeIndex, showNotification]);

  const handleCloseNotification = () => {
    setShowNotification(false);
    
    // Zeige nächstes Badge nach kurzer Verzögerung
    setTimeout(() => {
      const nextIndex = currentBadgeIndex + 1;
      if (nextIndex < newBadges.length) {
        setCurrentBadgeIndex(nextIndex);
      } else {
        // Alle Badges wurden gezeigt, reset
        setNewBadges([]);
        setCurrentBadgeIndex(0);
      }
    }, 500);
  };

  const showBadgeOverview = () => {
    setShowOverviewDialog(true);
  };

  const clearNewBadges = () => {
    setNewBadges([]);
    setCurrentBadgeIndex(0);
    setShowNotification(false);
  };

  const currentBadge = newBadges[currentBadgeIndex] || null;

  const contextValue: BadgeContextType = {
    showBadgeOverview,
    newBadges,
    clearNewBadges
  };

  return (
    <BadgeContext.Provider value={contextValue}>
      {children}
      
      {/* Badge Notification Popup */}
      <BadgeNotification
        badge={currentBadge}
        open={showNotification}
        onClose={handleCloseNotification}
        onViewAllBadges={showBadgeOverview}
      />

      {/* Badge Overview Dialog */}
      <BadgeOverviewDialog
        open={showOverviewDialog}
        onClose={() => setShowOverviewDialog(false)}
      />
    </BadgeContext.Provider>
  );
};

export const useBadges = (): BadgeContextType => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};

export default BadgeProvider;