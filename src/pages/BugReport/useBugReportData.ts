import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { sendNotificationToUser } from '../../hooks/useDiscussionHelpers';
import type { BugTicket, TicketComment, TicketPriority, TicketType } from './types';

const ADMIN_UID = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';
const AUTO_DELETE_DAYS = 5;

export function useBugReportData() {
  const { user } = useAuth() || {};
  const [tickets, setTickets] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!user) return;

    const ref = firebase.database().ref('bugTickets');
    const handler = ref
      .orderByChild('createdBy')
      .equalTo(user.uid)
      .on('value', (snap) => {
        const val = snap.val();
        if (val) {
          const list = Object.values(val) as BugTicket[];
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTickets(list);
        } else {
          setTickets([]);
        }
        setLoading(false);
      });

    return () => ref.off('value', handler);
  }, [user]);

  const uploadScreenshot = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;
      try {
        const timestamp = Date.now();
        const storageRef = firebase
          .storage()
          .ref(`bugReports/${user.uid}/${timestamp}_${file.name}`);
        await storageRef.put(file);
        return storageRef.getDownloadURL();
      } catch (error) {
        console.error('Screenshot upload failed:', error);
        return null;
      }
    },
    [user]
  );

  const createTicket = useCallback(
    async (data: {
      ticketType: TicketType;
      title: string;
      description: string;
      stepsToReproduce: string;
      screenshots: string[];
      consoleErrors?: string;
      priority: TicketPriority;
    }): Promise<boolean> => {
      if (!user) return false;
      try {
        const ticketId = firebase.database().ref('bugTickets').push().key ?? crypto.randomUUID();
        const displayName = user.displayName || (await getUserDisplayName(user.uid)) || 'Unbekannt';
        const isBug = data.ticketType === 'bug';

        const ticket: BugTicket = {
          id: ticketId,
          ticketType: data.ticketType,
          title: data.title,
          description: data.description,
          stepsToReproduce: data.stepsToReproduce,
          screenshots: data.screenshots,
          status: 'open',
          priority: data.priority,
          createdBy: user.uid,
          createdByName: displayName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: {},
          device: navigator.userAgent,
          ...(data.consoleErrors ? { consoleErrors: data.consoleErrors } : {}),
        };

        await firebase.database().ref(`bugTickets/${ticketId}`).set(ticket);

        // Notification an Admin
        await sendNotificationToUser(ADMIN_UID, {
          type: 'bug_ticket_reply',
          title: isBug ? 'Neues Bug-Ticket' : 'Neuer Feature-Wunsch',
          message: `${displayName}: "${data.title}"`,
          data: { ticketId, ticketType: data.ticketType },
        });

        return true;
      } catch (error) {
        console.error('Ticket creation failed:', error);
        return false;
      }
    },
    [user]
  );

  const addComment = useCallback(
    async (ticketId: string, text: string): Promise<boolean> => {
      if (!user) return false;
      try {
        const commentId = firebase.database().ref().push().key ?? crypto.randomUUID();
        const displayName = user.displayName || (await getUserDisplayName(user.uid)) || 'Unbekannt';

        const comment: TicketComment = {
          id: commentId,
          authorUid: user.uid,
          authorName: displayName,
          isAdmin: false,
          text,
          createdAt: new Date().toISOString(),
        };

        await firebase.database().ref(`bugTickets/${ticketId}/comments/${commentId}`).set(comment);
        await firebase
          .database()
          .ref(`bugTickets/${ticketId}/updatedAt`)
          .set(new Date().toISOString());

        // Notification an Admin
        const ticketSnap = await firebase.database().ref(`bugTickets/${ticketId}`).once('value');
        const ticketData = ticketSnap.val();
        const ticketTitle = ticketData?.title || 'Ticket';
        const ticketType = ticketData?.ticketType || 'bug';
        await sendNotificationToUser(ADMIN_UID, {
          type: 'bug_ticket_reply',
          title: 'Neuer Kommentar',
          message: `${displayName} hat auf "${ticketTitle}" geantwortet`,
          data: { ticketId, ticketType },
        });

        return true;
      } catch (error) {
        console.error('Comment failed:', error);
        return false;
      }
    },
    [user]
  );

  const updateTicket = useCallback(
    async (
      ticketId: string,
      updates: { title?: string; description?: string }
    ): Promise<boolean> => {
      if (!user) return false;
      try {
        await firebase
          .database()
          .ref(`bugTickets/${ticketId}`)
          .update({ ...updates, updatedAt: new Date().toISOString() });
        return true;
      } catch (error) {
        console.error('Ticket update failed:', error);
        return false;
      }
    },
    [user]
  );

  return { tickets, loading, uploadScreenshot, createTicket, addComment, updateTicket };
}

/** Auto-Cleanup: abgeschlossene Tickets nach 5 Tagen löschen (inkl. Screenshots) */
export async function cleanupOldTickets() {
  try {
    const snap = await firebase.database().ref('bugTickets').once('value');
    const all = snap.val();
    if (!all) return;
    const cutoff = Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
    for (const [id, t] of Object.entries(all as Record<string, BugTicket>)) {
      if (
        ['done', 'rejected', 'obsolete'].includes(t.status) &&
        new Date(t.updatedAt).getTime() < cutoff
      ) {
        if (t.screenshots?.length) {
          for (const url of t.screenshots) {
            try {
              await firebase.storage().refFromURL(url).delete();
            } catch {
              // ignorieren
            }
          }
        }
        await firebase.database().ref(`bugTickets/${id}`).remove();
      }
    }
  } catch {
    // Silent fail
  }
}

async function getUserDisplayName(uid: string): Promise<string> {
  try {
    const snap = await firebase.database().ref(`users/${uid}/displayName`).once('value');
    return snap.val() || '';
  } catch {
    return '';
  }
}
