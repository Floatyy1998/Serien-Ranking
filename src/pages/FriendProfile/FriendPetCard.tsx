import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { EvolvingPixelPet } from '../../components/pet';
import { useTheme } from '../../contexts/ThemeContextDef';
import { petMoodService } from '../../services/pet/petMoodService';
import {
  canSendGiftTo,
  formatCooldownRemaining,
  sendPetGift,
} from '../../services/pet/petGifts';
import { PET_TYPE_NAMES } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';

const MOOD_LABEL: Record<string, string> = {
  happy: 'Glücklich',
  excited: 'Aufgedreht',
  playful: 'Verspielt',
  sleepy: 'Müde',
  hungry: 'Hungrig',
  sad: 'Traurig',
  festive: 'Festlich',
  scared: 'Ängstlich',
  loved: 'Verliebt',
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
  const hungerPct = Math.round(Math.max(0, Math.min(100, pet.hunger)));
  const happinessPct = Math.round(Math.max(0, Math.min(100, pet.happiness)));

  const isOwnPet = user?.uid === friendUid;
  const canSend = !isOwnPet && cooldown.allowed && !sending && !sentJustNow && pet.isAlive;

  const handleSnack = async () => {
    if (!user?.uid || !canSend) return;
    setSending(true);
    try {
      const fromName =
        (user.displayName as string | undefined) || (user.email as string | undefined) || 'Ein Freund';
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
    if (sending) return 'Wird verschickt …';
    if (sentJustNow) return 'Snack unterwegs';
    if (!pet.isAlive) return 'Pet ist nicht mehr';
    if (!cooldown.allowed && cooldown.nextAvailableAt)
      return `Schon verwöhnt — wieder ${formatCooldownRemaining(cooldown.nextAvailableAt)}`;
    return 'Snack schicken';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fp-pet-card"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.accent}15, ${currentTheme.primary}10)`,
        border: `1px solid ${currentTheme.accent}30`,
      }}
    >
      <div className="fp-pet-sprite">
        <EvolvingPixelPet pet={pet} size={96} animated={true} />
      </div>

      <div className="fp-pet-body">
        <div className="fp-pet-header">
          <span className="fp-pet-name">{pet.name}</span>
        </div>

        <div className="fp-pet-subline" style={{ color: currentTheme.text.muted }}>
          {PET_TYPE_NAMES[pet.type]} · Lvl {pet.level} · {MOOD_LABEL[mood ?? 'happy'] ?? '—'}
        </div>

        <div className="fp-pet-stats">
          <div className="fp-pet-stat">
            <div className="fp-pet-stat-label">
              <span>Hunger</span>
              <span>{hungerPct}%</span>
            </div>
            <div className="fp-pet-stat-track">
              <div
                className="fp-pet-stat-fill"
                style={{
                  width: `${hungerPct}%`,
                  background: hungerPct > 70 ? '#ff6b6b' : currentTheme.accent,
                }}
              />
            </div>
          </div>
          <div className="fp-pet-stat">
            <div className="fp-pet-stat-label">
              <span>Glück</span>
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
          whileTap={canSend ? { scale: 0.96 } : undefined}
          disabled={!canSend}
          onClick={handleSnack}
          className="fp-pet-snack-btn"
          style={{
            background: canSend
              ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
              : `${currentTheme.text.muted}25`,
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
