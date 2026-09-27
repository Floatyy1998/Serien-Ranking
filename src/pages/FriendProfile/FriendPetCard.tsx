import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EvolvingPixelPet } from '../../components/pet';
import { useTheme } from '../../contexts/ThemeContext';
import { petMoodService } from '../../services/pet/petMoodService';
import { canSendGiftTo, formatCooldownRemaining, sendPetGift } from '../../services/pet/petGifts';
import { t } from '../../services/i18n';
import { PET_TYPE_NAMES } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';

const MOOD_LABEL: Record<string, string> = {
  happy: t('Glücklich'),
  excited: t('Aufgedreht'),
  playful: t('Verspielt'),
  sleepy: t('Müde'),
  hungry: t('Hungrig'),
  sad: t('Traurig'),
  festive: t('Festlich'),
  scared: t('Ängstlich'),
  loved: t('Verliebt'),
};

interface Props {
  friendUid: string;
  pet: Pet;
}

export const FriendPetCard = memo(function FriendPetCard({ friendUid, pet }: Props) {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [sending, setSending] = useState(false);
  const [sentJustNow, setSentJustNow] = useState(false);
  const [cooldown, setCooldown] = useState(() => canSendGiftTo(friendUid));

  useEffect(() => {
    setCooldown(canSendGiftTo(friendUid));
    setSentJustNow(false);
  }, [friendUid]);

  const mood = petMoodService.calculateCurrentMood(pet);
  // Anzeige als Sättigung (100 = satt = gut), konsistent mit PetWidget/PetCard.
  const satietyPct = Math.round(Math.max(0, Math.min(100, 100 - pet.hunger)));
  const happinessPct = Math.round(Math.max(0, Math.min(100, pet.happiness)));

  const isOwnPet = user?.uid === friendUid;
  const canSend = !isOwnPet && cooldown.allowed && !sending && !sentJustNow && pet.isAlive;

  const handleSnack = async () => {
    if (!user?.uid || !canSend) return;
    setSending(true);
    try {
      const fromName =
        (user.displayName as string | undefined) ||
        (user.email as string | undefined) ||
        t('Ein Freund');
      await sendPetGift({
        fromUid: user.uid,
        fromName,
        toUid: friendUid,
        giftType: 'snack',
      });
      setSentJustNow(true);
      setCooldown(canSendGiftTo(friendUid));
    } catch (err) {
      console.error('[FriendPetCard] sendPetGift failed', err);
    } finally {
      setSending(false);
    }
  };

  const buttonLabel = (() => {
    if (sending) return t('Wird verschickt …');
    if (sentJustNow) return t('Snack unterwegs');
    if (!pet.isAlive) return t('Pet ist nicht mehr');
    if (!cooldown.allowed && cooldown.nextAvailableAt)
      return t('Schon verwöhnt — wieder {rest}', {
        rest: formatCooldownRemaining(cooldown.nextAvailableAt),
      });
    return t('Snack schicken');
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fp-card fp-pet-card"
      style={{
        background: `radial-gradient(120% 140% at 0% 0%, ${currentTheme.accent}1c, transparent 60%), var(--glass-subtle)`,
      }}
    >
      <div className="fp-pet-sprite">
        <EvolvingPixelPet pet={pet} size={104} animated={true} />
      </div>

      <div className="fp-pet-body">
        <div className="fp-pet-name" style={{ color: currentTheme.text.primary }}>
          {pet.name}
        </div>
        <div className="fp-pet-subline" style={{ color: currentTheme.text.muted }}>
          {PET_TYPE_NAMES[pet.type]} · Lvl {pet.level} · {MOOD_LABEL[mood ?? 'happy'] ?? '—'}
        </div>

        <div className="fp-pet-stats" style={{ color: currentTheme.text.secondary }}>
          <div className="fp-pet-stat">
            <div className="fp-pet-stat-label">
              <span style={{ color: currentTheme.text.muted }}>{t('Sättigung')}</span>
              <span>{satietyPct}%</span>
            </div>
            <div className="fp-pet-stat-track">
              <div
                className="fp-pet-stat-fill"
                style={{
                  width: `${satietyPct}%`,
                  background: satietyPct < 30 ? '#ff6b6b' : currentTheme.accent,
                }}
              />
            </div>
          </div>
          <div className="fp-pet-stat">
            <div className="fp-pet-stat-label">
              <span style={{ color: currentTheme.text.muted }}>{t('Glück')}</span>
              <span>{happinessPct}%</span>
            </div>
            <div className="fp-pet-stat-track">
              <div
                className="fp-pet-stat-fill"
                style={{
                  width: `${happinessPct}%`,
                  background: currentTheme.primary,
                }}
              />
            </div>
          </div>
        </div>

        <motion.button
          whileTap={canSend ? { opacity: 0.7 } : undefined}
          disabled={!canSend}
          onClick={handleSnack}
          className="fp-pet-snack-btn"
          style={{
            background: canSend
              ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
              : 'var(--glass-light)',
            color: canSend ? '#fff' : currentTheme.text.muted,
            cursor: canSend ? 'pointer' : 'default',
          }}
        >
          {buttonLabel}
        </motion.button>
      </div>
    </motion.div>
  );
});
