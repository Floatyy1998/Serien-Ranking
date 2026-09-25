import { useState } from 'react';
import { Close, GroupAdd, HourglassEmpty, CheckCircle, Cancel } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { hapticTap } from '../../lib/interaction/haptics';
import type { PlanGuestStatus } from '../../lib/watch/watchPlan';
import { t } from '../../services/i18n';
import { PlanInviteFriendsSheet } from './PlanInviteFriendsSheet';

/** Gäste eines eigenen Termins: Status je Freund, vorgemerkte Einladungen, Einladen-Knopf. */
export const PlanGuestsSection = ({
  guests,
  queued,
  onQueue,
  onUnqueue,
  onUninvite,
}: {
  guests: Record<string, PlanGuestStatus>;
  queued: string[];
  onQueue: (uids: string[]) => void;
  onUnqueue: (uid: string) => void;
  onUninvite: (uid: string, status: PlanGuestStatus) => void;
}) => {
  const { currentTheme } = useTheme();
  const { friends } = useOptimizedFriends();
  const [pickerOpen, setPickerOpen] = useState(false);

  const nameOf = (uid: string) => {
    const friend = friends.find((f) => f.uid === uid);
    return friend?.displayName || friend?.username || t('Freund');
  };

  const rows: { uid: string; status: PlanGuestStatus | 'q' }[] = [
    ...Object.entries(guests).map(([uid, status]) => ({ uid, status })),
    ...queued
      .filter((uid) => !guests[uid] || guests[uid] === 'd')
      .map((uid) => ({
        uid,
        status: 'q' as const,
      })),
  ];

  const statusIcon = (status: PlanGuestStatus | 'q') =>
    status === 'a' ? (
      <CheckCircle style={{ fontSize: 16, color: currentTheme.status.success }} />
    ) : status === 'd' ? (
      <Cancel style={{ fontSize: 16, color: currentTheme.text.muted }} />
    ) : (
      <HourglassEmpty style={{ fontSize: 16, color: currentTheme.status.warning }} />
    );

  const statusText = (status: PlanGuestStatus | 'q') =>
    status === 'a'
      ? t('zugesagt')
      : status === 'd'
        ? t('abgesagt')
        : status === 'p'
          ? t('eingeladen')
          : t('wird eingeladen');

  const invitedForPicker: Record<string, PlanGuestStatus> = { ...guests };
  for (const uid of queued) invitedForPicker[uid] = 'p';

  return (
    <div className="wp-guests" style={{ borderColor: currentTheme.border.default }}>
      <div className="wp-guests__head">
        <span className="wp-remind__title" style={{ color: currentTheme.text.secondary }}>
          {t('Mit Freunden')}
        </span>
        <button
          type="button"
          className="wp-link-btn wp-guests__add"
          onClick={() => {
            hapticTap();
            setPickerOpen(true);
          }}
          style={{ color: currentTheme.primary }}
        >
          <GroupAdd style={{ fontSize: 18 }} />
          {t('Einladen')}
        </button>
      </div>
      {rows.length === 0 ? (
        <span className="wp-remind__sub" style={{ color: currentTheme.text.muted }}>
          {t('Lade Freunde ein — wer annimmt, hat den Termin auch in seinem Plan.')}
        </span>
      ) : (
        <ul className="wp-guests__list">
          {rows.map(({ uid, status }) => (
            <li key={uid} className="wp-guest" style={{ borderColor: currentTheme.border.default }}>
              {statusIcon(status)}
              <span className="wp-guest__name" style={{ color: currentTheme.text.secondary }}>
                {nameOf(uid)}
              </span>
              <span className="wp-guest__status" style={{ color: currentTheme.text.muted }}>
                {statusText(status)}
              </span>
              <button
                type="button"
                className="wp-guest__remove"
                aria-label={t('{name} ausladen', { name: nameOf(uid) })}
                onClick={() => {
                  hapticTap();
                  if (status === 'q') onUnqueue(uid);
                  else onUninvite(uid, status);
                }}
                style={{ color: currentTheme.text.muted }}
              >
                <Close style={{ fontSize: 16 }} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <PlanInviteFriendsSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        invited={invitedForPicker}
        onConfirm={onQueue}
      />
    </div>
  );
};
