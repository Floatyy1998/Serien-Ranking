import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '../../App';
import { EarnedBadge } from './badgeDefinitions';
// activityBatchManager entfernt - Badge-Callbacks jetzt direkt über minimalActivityLogger
import BadgeNotification from './BadgeNotification';
import BadgeOverviewDialog from './BadgeOverviewDialog';

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
        setNewBadges((prev) => {
          const existingBadgeIds = new Set(prev.map((b) => b.id));
          const newUniqueBadges = badges.filter(
            (badge) => !existingBadgeIds.has(badge.id)
          );

          if (newUniqueBadges.length > 0) {
            return [...prev, ...newUniqueBadges];
          }
          return prev;
        });
      };

      // Event-Handler für Badge-Dialog-Opening (leert newBadges State)
      const handleBadgeDialogOpened = (event: CustomEvent) => {
        const { userId, newBadges: earnedBadges } = event.detail;
        if (userId === user.uid && earnedBadges?.length > 0) {
          setNewBadges([]);
          setCurrentBadgeIndex(0);
          setShowNotification(false);
        }
      };

      let cleanup: (() => void) | null = null;

      // Dynamischer Import um zirkuläre Abhängigkeiten zu vermeiden
      import('./minimalActivityLogger').then(
        ({ registerBadgeCallback, removeBadgeCallback }) => {
          registerBadgeCallback(user.uid, handleNewBadges);

          cleanup = () => {
            removeBadgeCallback(user.uid);
          };
        }
      );

      // Event-Listener für Badge-Dialog-Events
      window.addEventListener(
        'badgeDialogOpened',
        handleBadgeDialogOpened as EventListener
      );

      // Korrekte Cleanup-Funktion
      return () => {
        window.removeEventListener(
          'badgeDialogOpened',
          handleBadgeDialogOpened as EventListener
        );
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

  const showBadgeOverview = async () => {
    // Leere newBadges wenn der Dialog geöffnet wird
    setNewBadges([]);
    setCurrentBadgeIndex(0);
    setShowNotification(false);

    // Marathon-Woche überprüfen und neue erstellen falls nötig
    if (user) {
      try {
        const { badgeCounterService } = await import('./badgeCounterService');
        await badgeCounterService.ensureCurrentMarathonWeek(user.uid);
      } catch (error) {
        console.warn(
          'Marathon-Wochen-Überprüfung beim Dialog-Öffnen fehlgeschlagen:',
          error
        );
      }
    }

    // Cache invalidieren damit aktuelle Badge-Daten geladen werden
    if (user) {
      try {
        const { getOfflineBadgeSystem } = await import('./offlineBadgeSystem');
        const badgeSystem = getOfflineBadgeSystem(user.uid);
        badgeSystem.invalidateCache();
      } catch (error) {
        console.warn(
          'Cache-Invalidation beim Dialog-Öffnen fehlgeschlagen:',
          error
        );
      }
    }

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
    clearNewBadges,
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
