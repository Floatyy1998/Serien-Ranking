import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { EarnedBadge } from '../../utils/badgeSystem';
import BadgeNotification from './BadgeNotification';

interface BadgeNotificationManagerProps {
  children: React.ReactNode;
}

interface BadgeNotificationData {
  badge: EarnedBadge;
  timestamp: number;
}

const BadgeNotificationManager: React.FC<BadgeNotificationManagerProps> = ({
  children,
}) => {
  const { user } = useAuth()!;
  const [notifications, setNotifications] = useState<BadgeNotificationData[]>(
    []
  );
  const [currentNotification, setCurrentNotification] =
    useState<BadgeNotificationData | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Überwache neue Badges in Firebase
    const badgesRef = firebase.database().ref(`badges/${user.uid}`);
    const lastNotificationKey = `lastBadgeNotification_${user.uid}`;

    badgesRef.on('child_added', (snapshot) => {
      const badgeKey = snapshot.key;
      const badgeData = snapshot.val();

      if (!badgeKey || !badgeData) return;

      // Überprüfe, ob dies ein neues Badge ist (nach dem letzten Notification-Timestamp)
      const lastNotificationTime = parseInt(
        localStorage.getItem(lastNotificationKey) || '0'
      );
      const badgeEarnedTime = badgeData.earnedAt || Date.now();

      if (badgeEarnedTime > lastNotificationTime) {
        // Erstelle EarnedBadge-Objekt für Benachrichtigung
        const badge: EarnedBadge = {
          id: badgeKey,
          name: badgeData.name || 'Unbekanntes Badge',
          description: badgeData.description || '',
          emoji: badgeData.emoji || '🏆',
          category: badgeData.category || 'binge',
          tier: badgeData.tier || 'bronze',
          color: badgeData.color || '#00fed7',
          rarity: badgeData.rarity || 'common',
          requirements: badgeData.requirements || {},
          earnedAt: badgeEarnedTime,
        };

        // Füge zur Notifications-Queue hinzu
        const newNotification: BadgeNotificationData = {
          badge,
          timestamp: badgeEarnedTime,
        };

        setNotifications((prev) => [...prev, newNotification]);

        // Aktualisiere letzten Notification-Timestamp
        localStorage.setItem(lastNotificationKey, badgeEarnedTime.toString());
      }
    });

    return () => {
      badgesRef.off();
    };
  }, [user?.uid]);

  // Zeige Benachrichtigungen eine nach der anderen
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const nextNotification = notifications[0];
      setCurrentNotification(nextNotification);
      setNotifications((prev) => prev.slice(1));
    }
  }, [notifications, currentNotification]);

  const handleCloseNotification = () => {
    setCurrentNotification(null);
  };

  return (
    <>
      {children}

      {/* Schöne Badge-Benachrichtigung */}
      <BadgeNotification
        badge={currentNotification?.badge || null}
        open={!!currentNotification}
        onClose={handleCloseNotification}
      />
    </>
  );
};

export default BadgeNotificationManager;
