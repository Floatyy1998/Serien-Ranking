import type { TasteMedia } from '../../lib/taste/tasteEngine';
import type { Recommendation } from '../../types/Recommendation';
import { dbGet, userPath } from '../db/ref';

export interface FriendPicks {
  picks: Map<number, string>;
  declined: Set<number>;
}

export async function fetchFriendPicks(
  uid: string | undefined,
  media: TasteMedia
): Promise<FriendPicks> {
  const picks = new Map<number, string>();
  const declined = new Set<number>();
  if (!uid) return { picks, declined };
  try {
    const data = await dbGet<Record<string, Omit<Recommendation, 'id'>>>(
      userPath(uid, 'recommendations')
    );
    for (const entry of Object.values(data || {})) {
      if (!entry || entry.mediaType !== media) continue;
      const id = Number(entry.mediaId);
      if (!Number.isFinite(id)) continue;
      if (entry.status === 'declined') declined.add(id);
      else if (entry.senderName && !picks.has(id)) picks.set(id, entry.senderName);
    }
  } catch {
    return { picks, declined };
  }
  return { picks, declined };
}
