import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EvolvingPixelPet } from '../../components/pet';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { PetVisitScene } from '../../components/pet/stage/PetVisitScene';
import { useTheme } from '../../contexts/ThemeContext';
import { useOwnActivePet } from '../../hooks/pet/useOwnActivePet';
import { petService } from '../../services/pet/petService';
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
  /** Nur für die Vorschau: eigenes Pet statt aus der Datenbank. */
  ownPetOverride?: Pet | null;
}

function claimVisitBonus(friendUid: string): boolean {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const key = `petVisit:${friendUid}`;
  try {
    if (localStorage.getItem(key) === day) return false;
    localStorage.setItem(key, day);
    return true;
  } catch {
    return false;
  }
}

export const FriendPetCard = memo(function FriendPetCard({
  friendUid,
  pet,
  ownPetOverride,
}: Props) {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const loadedOwnPet = useOwnActivePet();
  const ownPet = ownPetOverride !== undefined ? ownPetOverride : loadedOwnPet;
  const [visiting, setVisiting] = useState(false);
  const [visitBonus, setVisitBonus] = useState(false);
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
  const place =
    (pet.equippedBackground && PET_BACKGROUNDS[pet.equippedBackground]) ||
    PET_BACKGROUNDS.picnicLawn;
  const canVisit = !isOwnPet && !!ownPet?.isAlive && pet.isAlive;

  const toggleVisit = () => {
    const next = !visiting;
    setVisiting(next);
    if (!next || !ownPet || !user?.uid || !claimVisitBonus(friendUid)) return;
    setVisitBonus(true);
    petService.cheerUpPet(user.uid, ownPet.id).catch(() => {});
  };
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

        {canVisit && ownPet && (
          <button
            type="button"
            onClick={toggleVisit}
            aria-expanded={visiting}
            className="fp-pet-visit-btn"
            style={{
              borderColor: `${currentTheme.primary}66`,
              color: currentTheme.text.primary,
            }}
          >
            {visiting ? t('Spieltreff beenden') : t('Spieltreff mit {name}', { name: ownPet.name })}
          </button>
        )}
      </div>

      <AnimatePresence>
        {visiting && ownPet && (
          <motion.div
            className="fp-pet-visit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: place.background, borderColor: currentTheme.border.default }}
          >
            <div className="fp-pet-visit-floor" aria-hidden="true" />
            <PetVisitScene guest={ownPet} host={pet} />
            <span className="fp-pet-visit-tag">
              {t('Spieltreff bei {name}', { name: pet.name })}
            </span>
            <p className="fp-pet-visit-note">
              {visitBonus
                ? t('{name} hat Spaß und bekommt bessere Laune', { name: ownPet.name })
                : t('{guest} und {host} spielen zusammen', {
                    guest: ownPet.name,
                    host: pet.name,
                  })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
