import { dbGet, dbRef, dbUpdate, paths, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';
import { queuePush } from '../notifications/pushQueue';
import {
  LOCALES,
  LOCALE_TAG,
  SOURCE_LOCALE,
  ensureAllDictionaries,
  tLocale,
  type Locale,
  type LocalizedMap,
} from '../i18n';
import {
  compactWatchPlanDraft,
  expandPlanGuests,
  expandPlanInvites,
  guestCopyKey,
  planInviteId,
  sharedPlanFields,
  type PlanGuestStatus,
  type PlanInvite,
  type StoredPlanInvite,
  type WatchPlanEntry,
} from '../../lib/watch/watchPlan';

type GuestMap = Record<string, PlanGuestStatus>;

export function subscribePlanInvites(
  uid: string,
  onChange: (invites: PlanInvite[]) => void
): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'planInvites')),
    (snap) => onChange(expandPlanInvites(snap.val())),
    { label: 'planInvites' }
  );
}

export function subscribePlanGuests(
  uid: string,
  onChange: (guests: Map<string, GuestMap>) => void
): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'watchPlanGuests')),
    (snap) => onChange(expandPlanGuests(snap.val())),
    { label: 'watchPlanGuests' }
  );
}

/** Name wie in Empfehlungen: DB-Profil vor Auth-Profil. */
export async function planSenderName(
  uid: string,
  authName?: string | null,
  email?: string | null
): Promise<string> {
  const dbName = await dbGet<string>(paths.displayName(uid)).catch(() => null);
  return (dbName || authName?.trim() || email?.split('@')[0] || '?').slice(0, 100);
}

const formatDay = (date: string, locale: Locale) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE_TAG[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/** Meldung in allen Sprachen — das Datum formatiert jede Sprache selbst. */
async function localized(
  text: string,
  vars: (locale: Locale) => Record<string, string>
): Promise<{ source: string; map: LocalizedMap }> {
  await ensureAllDictionaries();
  const source = tLocale(SOURCE_LOCALE, text, vars(SOURCE_LOCALE));
  const map: LocalizedMap = {};
  for (const locale of LOCALES) {
    if (locale === SOURCE_LOCALE) continue;
    const value = tLocale(locale, text, vars(locale));
    if (value !== source) map[locale] = value;
  }
  return { source, map };
}

async function notifyUser(
  toUid: string,
  type: 'watch_plan_invite' | 'watch_plan_response',
  title: { source: string; map: LocalizedMap },
  message: { source: string; map: LocalizedMap },
  url: string
): Promise<void> {
  const titleL = Object.keys(title.map).length ? title.map : undefined;
  const messageL = Object.keys(message.map).length ? message.map : undefined;
  try {
    await dbRef(userPath(toUid, 'notifications')).push({
      type,
      title: title.source.slice(0, 500),
      message: message.source.slice(0, 2000),
      ...(titleL && { titleL }),
      ...(messageL && { messageL }),
      data: { navigateTo: url },
      timestamp: Date.now(),
      read: false,
    });
  } catch {
    // Glocke ist Zusatz — die Einladung selbst liegt schon
  }
  await queuePush(toUid, {
    title: title.source,
    body: message.source,
    ...(titleL && { titleL }),
    ...(messageL && { bodyL: messageL }),
    url,
  });
}

const PLAN_URL = '/calendar?mode=plan';

/** Lädt Freunde zu einem eigenen Termin ein; bereits Zugesagte bleiben unberührt. */
export async function sendPlanInvites(
  hostUid: string,
  hostName: string,
  entry: WatchPlanEntry,
  guestUids: string[],
  current: GuestMap = {}
): Promise<void> {
  const fresh = guestUids.filter((uid) => current[uid] !== 'a' && uid !== hostUid);
  if (!fresh.length) return;
  const invite: StoredPlanInvite = {
    ...sharedPlanFields(entry),
    f: hostUid,
    fn: hostName,
    hk: entry.key,
    ts: Date.now(),
  };
  const updates: Record<string, unknown> = {};
  for (const uid of fresh) {
    updates[userPath(uid, 'planInvites', planInviteId(hostUid, entry.key))] = invite;
    updates[userPath(hostUid, 'watchPlanGuests', entry.key, uid)] = 'p';
  }
  await dbUpdate(updates);

  const title = await localized('Einladung zum Schauen', () => ({}));
  const message = await localized('{name} lädt dich ein: {title} am {date}', (locale) => ({
    name: hostName,
    title: entry.title,
    date: formatDay(entry.date, locale),
  }));
  await Promise.all(
    fresh.map((uid) => notifyUser(uid, 'watch_plan_invite', title, message, PLAN_URL))
  );
}

/** Überträgt Tag/Uhrzeit/Folge an offene Einladungen und angenommene Kopien. */
export async function syncPlanGuests(
  hostUid: string,
  entry: WatchPlanEntry,
  guests: GuestMap
): Promise<void> {
  const shared = sharedPlanFields(entry);
  const updates: Record<string, unknown> = {};
  for (const [uid, status] of Object.entries(guests)) {
    if (status === 'p') {
      const base = userPath(uid, 'planInvites', planInviteId(hostUid, entry.key));
      for (const field of ['t', 'd', 'h', 's', 'e', 'x', 'p'] as const) {
        updates[`${base}/${field}`] = shared[field] ?? null;
      }
    } else if (status === 'a') {
      const base = userPath(uid, 'watchPlan', guestCopyKey(hostUid, entry.key));
      for (const field of ['t', 'd', 'h', 's', 'e', 'x', 'p'] as const) {
        updates[`${base}/${field}`] = shared[field] ?? null;
      }
      // Zeitpunkt neu: der Erinnerungs-Cron rechnet ihn in der Zeitzone des Gasts nach.
      updates[`${base}/ra`] = null;
      updates[`${base}/rs`] = null;
      if (!shared.h) updates[`${base}/r`] = null;
    }
  }
  if (Object.keys(updates).length) await dbUpdate(updates);
}

/** Host löscht den Termin: offene Einladungen und Kopien der Gäste gehen mit. */
export async function removePlanGuests(
  hostUid: string,
  hostKey: string,
  guests: GuestMap
): Promise<void> {
  const updates: Record<string, unknown> = {
    [userPath(hostUid, 'watchPlanGuests', hostKey)]: null,
  };
  for (const [uid, status] of Object.entries(guests)) {
    if (status === 'p')
      updates[userPath(uid, 'planInvites', planInviteId(hostUid, hostKey))] = null;
    if (status === 'a') updates[userPath(uid, 'watchPlan', guestCopyKey(hostUid, hostKey))] = null;
  }
  await dbUpdate(updates);
}

/** Einzelnen Gast wieder ausladen. */
export async function uninvitePlanGuest(
  hostUid: string,
  hostKey: string,
  guestUid: string,
  status: PlanGuestStatus
): Promise<void> {
  const updates: Record<string, unknown> = {
    [userPath(hostUid, 'watchPlanGuests', hostKey, guestUid)]: null,
  };
  if (status === 'p') {
    updates[userPath(guestUid, 'planInvites', planInviteId(hostUid, hostKey))] = null;
  }
  if (status === 'a') {
    updates[userPath(guestUid, 'watchPlan', guestCopyKey(hostUid, hostKey))] = null;
  }
  await dbUpdate(updates);
}

async function respond(
  guestName: string,
  hostUid: string,
  accepted: boolean,
  title: string
): Promise<void> {
  const titleText = await localized(
    accepted ? 'Zusage für deinen Termin' : 'Absage für deinen Termin',
    () => ({})
  );
  const message = await localized(
    accepted ? '{name} schaut {title} mit dir' : '{name} kann bei {title} nicht',
    () => ({ name: guestName, title })
  );
  await notifyUser(hostUid, 'watch_plan_response', titleText, message, PLAN_URL);
}

export async function acceptPlanInvite(
  guestUid: string,
  guestName: string,
  invite: PlanInvite
): Promise<void> {
  const copy = compactWatchPlanDraft(
    {
      kind: invite.kind,
      itemId: invite.itemId,
      title: invite.title,
      date: invite.date,
      time: invite.time,
      seasonNumber: invite.seasonNumber,
      episodeNumber: invite.episodeNumber,
      episodeId: invite.episodeId,
      poster: invite.poster,
      remindOffset: invite.time ? 15 : undefined,
      via: { hostUid: invite.hostUid, hostKey: invite.hostKey, hostName: invite.hostName },
    },
    Date.now()
  );
  await dbUpdate({
    [userPath(guestUid, 'watchPlan', guestCopyKey(invite.hostUid, invite.hostKey))]: copy,
    [userPath(guestUid, 'planInvites', invite.inviteId)]: null,
  });
  await dbRef(userPath(invite.hostUid, 'watchPlanGuests', invite.hostKey, guestUid))
    .set('a')
    .catch(() => undefined);
  await respond(guestName, invite.hostUid, true, invite.title);
}

export async function declinePlanInvite(
  guestUid: string,
  guestName: string,
  invite: PlanInvite
): Promise<void> {
  await dbRef(userPath(guestUid, 'planInvites', invite.inviteId)).remove();
  await dbRef(userPath(invite.hostUid, 'watchPlanGuests', invite.hostKey, guestUid))
    .set('d')
    .catch(() => undefined);
  await respond(guestName, invite.hostUid, false, invite.title);
}

/** Gast entfernt einen angenommenen Termin aus seinem Plan — gilt als Absage. */
export async function leavePlan(
  guestUid: string,
  guestName: string,
  entry: WatchPlanEntry
): Promise<void> {
  if (!entry.via) return;
  await dbRef(userPath(guestUid, 'watchPlan', entry.key)).remove();
  await dbRef(userPath(entry.via.hostUid, 'watchPlanGuests', entry.via.hostKey, guestUid))
    .set('d')
    .catch(() => undefined);
  await respond(guestName, entry.via.hostUid, false, entry.title);
}
