import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Close, ExpandLess, ExpandMore, GroupAdd } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFriendAddToList } from '../../hooks/social/useFriendAddToList';
import { hapticSuccess, hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import { formatPlanTime, type PlanInvite } from '../../lib/watch/watchPlan';
import { dateLocale, t } from '../../services/i18n';
import {
  acceptPlanInvite,
  declinePlanInvite,
  planSenderName,
} from '../../services/watchPlan/watchPlanSharing';
import { getImageUrl } from '../../utils/imageUrl';

/** Ab dieser Anzahl klappen weitere Einladungen ein, damit die Woche sichtbar bleibt. */
const COLLAPSED_COUNT = 1;

const dayText = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dateLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const PlanInviteCards = ({
  invites,
  twelveHour,
}: {
  invites: PlanInvite[];
  twelveHour: boolean;
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isInOwnList, addToOwnList } = useFriendAddToList('watch_plan_invite');
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!invites.length) return null;

  const answer = async (invite: PlanInvite, accept: boolean) => {
    if (!user?.uid || busy) return;
    hapticTap();
    setBusy(invite.inviteId);
    try {
      const name = await planSenderName(user.uid, user.displayName, user.email);
      if (accept) {
        if (!isInOwnList(invite.kind, invite.itemId)) {
          await addToOwnList({ id: invite.itemId, title: invite.title }, invite.kind);
        }
        await acceptPlanInvite(user.uid, name, invite);
        hapticSuccess();
        showToast(t('Termin in deinen Plan übernommen'));
      } else {
        await declinePlanInvite(user.uid, name, invite);
        showToast(t('Einladung abgelehnt'));
      }
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="wp-invites" aria-label={t('Einladungen')}>
      <h2 className="wp-invites__head" style={{ color: currentTheme.text.secondary }}>
        <GroupAdd style={{ fontSize: 18, color: currentTheme.primary }} />
        {invites.length === 1 ? t('1 Einladung') : t('{n} Einladungen', { n: invites.length })}
      </h2>
      {(expanded ? invites : invites.slice(0, COLLAPSED_COUNT)).map((invite) => {
        const detail =
          invite.kind === 'movie'
            ? t('Film')
            : invite.seasonNumber && invite.episodeNumber
              ? `S${invite.seasonNumber} · E${invite.episodeNumber}`
              : t('Serie');
        const when = invite.time
          ? `${dayText(invite.date)} · ${formatPlanTime(invite.time, twelveHour)}`
          : dayText(invite.date);
        const pending = busy === invite.inviteId;
        return (
          <div
            key={invite.inviteId}
            className="wp-invite"
            style={{
              borderColor: `${currentTheme.primary}45`,
              background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 70%)`,
            }}
          >
            <img className="wp-poster" src={getImageUrl(invite.poster, 'w92')} alt="" />
            <div className="wp-invite__body">
              <span className="wp-invite__from" style={{ color: currentTheme.primary }}>
                {t('{name} lädt dich ein', { name: invite.hostName || t('Freund') })}
              </span>
              <span className="wp-entry__title" style={{ color: currentTheme.text.secondary }}>
                {invite.title}
              </span>
              <span className="wp-entry__detail" style={{ color: currentTheme.text.muted }}>
                {detail} · {when}
              </span>
              <div className="wp-invite__actions">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  className="wp-invite__btn"
                  disabled={pending}
                  onClick={() => void answer(invite, true)}
                  style={{
                    background: currentTheme.primary,
                    color: currentTheme.background.default,
                  }}
                >
                  <Check style={{ fontSize: 18 }} />
                  {t('Annehmen')}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  className="wp-invite__btn wp-invite__btn--ghost"
                  disabled={pending}
                  onClick={() => void answer(invite, false)}
                  style={{
                    borderColor: currentTheme.border.default,
                    color: currentTheme.text.secondary,
                  }}
                >
                  <Close style={{ fontSize: 18 }} />
                  {t('Ablehnen')}
                </motion.button>
              </div>
            </div>
          </div>
        );
      })}
      {invites.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="wp-invites__more"
          aria-expanded={expanded}
          onClick={() => {
            hapticTap();
            setExpanded((v) => !v);
          }}
          style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}40` }}
        >
          {expanded ? (
            <>
              <ExpandLess style={{ fontSize: 20 }} />
              {t('Weniger anzeigen')}
            </>
          ) : (
            <>
              <ExpandMore style={{ fontSize: 20 }} />
              {t('Alle {n} Einladungen anzeigen', { n: invites.length })}
            </>
          )}
        </button>
      )}
    </section>
  );
};
