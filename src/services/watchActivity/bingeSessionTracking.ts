/**
 * Binge Session Tracking
 *
 * Erkennt und verwaltet Binge-Watching-Sessions basierend auf
 * dem zeitlichen Abstand zwischen Episoden.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { BingeSession } from '../../types/WatchActivity';
import { generateEventId, getBingeSessionsPath } from './shared';

const BINGE_BUFFER_MINUTES = 15;

export async function getActiveBingeSession(
  userId: string,
  seriesId: number
): Promise<BingeSession | null> {
  try {
    const year = new Date().getFullYear();
    const snapshot = await firebase
      .database()
      .ref(getBingeSessionsPath(userId, year))
      .orderByChild('seriesId')
      .equalTo(seriesId)
      .once('value');

    const sessions = snapshot.val() as Record<string, BingeSession> | null;
    if (!sessions) return null;

    for (const [id, session] of Object.entries(sessions)) {
      if (session.isActive) {
        return { ...session, id };
      }
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to get binge session: ${message}`);
    return null;
  }
}

export async function updateBingeSession(
  userId: string,
  seriesId: number,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  episodeRuntime: number = 45
): Promise<string | undefined> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const activeSession = await getActiveBingeSession(userId, seriesId);
    const bingeSessionsPath = getBingeSessionsPath(userId, year);

    if (activeSession) {
      const lastEpisode = activeSession.episodes[activeSession.episodes.length - 1];
      const lastWatchTime = new Date(lastEpisode.watchedAt);
      const minutesSince = (now.getTime() - lastWatchTime.getTime()) / 60000;
      const avgEpisodeLength = activeSession.totalMinutes / activeSession.episodes.length;
      const bingeThreshold = avgEpisodeLength + BINGE_BUFFER_MINUTES;

      if (minutesSince < bingeThreshold) {
        // Continue session
        activeSession.episodes.push({
          seasonNumber,
          episodeNumber,
          watchedAt: now.toISOString(),
        });
        activeSession.totalMinutes += episodeRuntime;

        await firebase.database().ref(`${bingeSessionsPath}/${activeSession.id}`).update({
          episodes: activeSession.episodes,
          totalMinutes: activeSession.totalMinutes,
        });

        return activeSession.id;
      } else {
        // End session
        await firebase.database().ref(`${bingeSessionsPath}/${activeSession.id}`).update({
          isActive: false,
          endedAt: lastEpisode.watchedAt,
        });
      }
    }

    // Start new session
    const newSessionId = generateEventId();
    const newSession: BingeSession = {
      id: newSessionId,
      startedAt: now.toISOString(),
      seriesId,
      seriesTitle,
      episodes: [
        {
          seasonNumber,
          episodeNumber,
          watchedAt: now.toISOString(),
        },
      ],
      totalMinutes: episodeRuntime,
      isActive: true,
    };

    await firebase.database().ref(`${bingeSessionsPath}/${newSessionId}`).set(newSession);

    return newSessionId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to update binge session: ${message}`);
    return undefined;
  }
}

export async function getBingeSessionsForYear(
  userId: string,
  year: number
): Promise<BingeSession[]> {
  try {
    const snapshot = await firebase
      .database()
      .ref(getBingeSessionsPath(userId, year))
      .once('value');

    const data = snapshot.val() as Record<string, BingeSession> | null;
    if (!data) return [];

    return Object.values(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to get binge sessions: ${message}`);
    return [];
  }
}
