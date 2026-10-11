import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { usePetRoam } from '../../hooks/pet/usePetRoam';
import type { pickReaction } from '../../hooks/pet/usePetReactions';
import { usePetReactions, triggerPetReaction } from '../../hooks/pet/usePetReactions';
import { showToast } from '../../lib/interaction/toast';
import { t } from '../../services/i18n';
import { PET_CONFIG } from '../../services/pet/petConstants';
import { onPetDockChanged } from '../../services/pet/petEvents';
import { petMoodService } from '../../services/pet/petMoodService';
import { petService } from '../../services/pet/petService';
import { activeSeason } from '../../theme/seasonalThemes';
import type { Pet } from '../../types/pet.types';
import { PetHungerToast } from './PetHungerToast';
import { calculatePixelPosition } from './PetWidgetHelpers';
import { PetWidgetNoPet } from './PetWidgetNoPet';
import { PetStage } from './stage/PetStage';

interface PetWidgetProps {
  unwatchedToday?: number;
}

export const PetWidget = ({ unwatchedToday = 0 }: PetWidgetProps) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const navigate = useNavigate();
  const themeConfig = useContext(ThemeContext)?.userConfig;
  const roam = usePetRoam();
  const [pet, setPet] = useState<Pet | null>(null);
  const [companions, setCompanions] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(true);
  const [showHungerToast, setShowHungerToast] = useState(false);
  const [hungerToastLevel, setHungerToastLevel] = useState<'warning' | 'critical'>('warning');
  // Vorheriger Lebend-Status, um den Übergang lebend→tot exakt einmal zu melden.
  const prevAliveRef = useRef<boolean | null>(null);
  const reaction = usePetReactions(user?.uid);

  // Meldet den Tod eines Pets prominent (statt still im Hintergrund). Feuert nur
  // beim frischen Übergang lebend→tot, nicht bei einem bereits toten Pet beim
  // App-Start – sonst würde ein alter Tod bei jedem Öffnen nerven.
  const notifyIfDied = useCallback((updatedPet: Pet) => {
    const wasAlive = prevAliveRef.current;
    prevAliveRef.current = updatedPet.isAlive;
    if (wasAlive === true && !updatedPet.isAlive) {
      const causeText =
        updatedPet.deathCause === 'hunger'
          ? t('ist verhungert')
          : updatedPet.deathCause === 'sadness'
            ? t('ist vor Kummer gestorben')
            : t('wurde zu lange vernachlässigt');
      showToast(
        t('{name} {cause} – tippe es an, um es wiederzubeleben', {
          name: updatedPet.name || t('Dein Haustier'),
          cause: causeText,
        }),
        8000,
        'error'
      );
    }
  }, []);

  // DevTools-Zugang zum Ausprobieren der Reaktionen, z. B. petReactionsDebug.cheer()
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fire = (tone: Parameters<typeof pickReaction>[0], n?: number) => {
      triggerPetReaction({ tone, vars: n !== undefined ? { n } : {} });
    };
    (window as unknown as Record<string, unknown>).petReactionsDebug = {
      cheer: () => fire('cheer'),
      streak: (n = 7) => fire('streak', n),
      milestone: (n = 30) => fire('milestone', n),
      love: () => fire('love'),
      idle: () => fire('idle'),
      binge: () => fire('binge'),
      rewatch: () => fire('rewatch'),
      movie: () => fire('movie'),
      rated: () => fire('rated'),
      levelup: (n = 12) => fire('levelup', n),
    };
  }, []);

  const loadCompanions = useCallback(
    async (activeId: string) => {
      if (!user) return;
      try {
        const ids = (await petService.getDockPetIds(user.uid)).filter((id) => id !== activeId);
        const loaded = await Promise.all(ids.map((id) => petService.getUserPet(user.uid, id)));
        setCompanions(loaded.filter((p): p is Pet => !!p));
      } catch {
        setCompanions([]);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user || !pet) return;

    const checkHungerToast = (updatedPet: Pet) => {
      if (!updatedPet.isAlive || updatedPet.hunger < PET_CONFIG.STATUS_WARNING_HUNGER) return;

      const lastToast = localStorage.getItem('petHungerToastLast');
      const cooldown = 30 * 60 * 1000;
      if (lastToast && Date.now() - Number(lastToast) < cooldown) return;

      setHungerToastLevel(
        updatedPet.hunger >= PET_CONFIG.STATUS_CRITICAL_HUNGER ? 'critical' : 'warning'
      );
      setShowHungerToast(true);
      localStorage.setItem('petHungerToastLast', String(Date.now()));
    };

    // Hunger/Happiness ändern sich über Stunden — 30 Min reichen und sparen
    // die periodischen Firebase-Writes von updateAllPetsStatus.
    const interval = setInterval(
      async () => {
        try {
          await petService.updateAllPetsStatus(user.uid);
          const activePetId = await petService.getActivePetId(user.uid);
          if (activePetId) {
            const updatedPet = await petService.getUserPet(user.uid, activePetId);
            if (updatedPet) {
              setPet(updatedPet);
              notifyIfDied(updatedPet);
              checkHungerToast(updatedPet);
              loadCompanions(updatedPet.id);
            }
          }
        } catch (error) {
          console.error('Error updating pets status:', error);
        }
      },
      30 * 60 * 1000
    );

    checkHungerToast(pet);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pet?.id]);

  const loadPet = useCallback(async () => {
    if (!user) return;

    try {
      let petId = await petService.getActivePetId(user.uid);

      if (!petId) {
        const allPets = await petService.getUserPets(user.uid);
        if (allPets.length > 0) {
          petId = allPets[0].id;
          await petService.setActivePetId(user.uid, petId);
        }
      }

      if (petId) {
        const userPet = await petService.getUserPet(user.uid, petId);
        if (userPet) {
          const updatedPet = await petService.updatePetStatus(user.uid, petId);
          const resolvedPet = updatedPet || userPet;
          setPet(resolvedPet);
          loadCompanions(resolvedPet.id);
          // Baseline für die Tod-Erkennung setzen (feuert nicht beim ersten Mal).
          notifyIfDied(resolvedPet);
        }
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, notifyIfDied, loadCompanions]);

  // Async External-Sync (Firebase). Promise-Pfad ist fuer die Rule unsichtbar.
  useEffect(() => {
    if (user) loadPet();
  }, [user, loadPet]);

  // Auf der Pet-Seite gewechselt oder Begleiter geändert
  useEffect(() => onPetDockChanged(() => loadPet()), [loadPet]);

  const applyUpdate = useCallback((updated: Pet | null) => {
    if (!updated) return;
    setPet((current) => (current?.id === updated.id ? { ...updated } : current));
    setCompanions((list) => list.map((c) => (c.id === updated.id ? { ...updated } : c)));
  }, []);

  const handleFeed = useCallback(
    (petId: string) => {
      if (!user) return;
      petService
        .feedPet(user.uid, petId)
        .then(applyUpdate)
        .catch(() => {});
    },
    [user, applyUpdate]
  );

  const handlePlay = useCallback(
    (petId: string) => {
      if (!user) return;
      petService
        .cheerUpPet(user.uid, petId)
        .then(applyUpdate)
        .catch(() => {});
    },
    [user, applyUpdate]
  );

  if (!user || !showWidget || isLoading) return null;

  if (!pet) {
    return (
      <PetWidgetNoPet
        position={calculatePixelPosition({ edge: 'bottom-right', offsetX: 2, offsetY: 2 })}
        onNavigate={() => navigate('/pets')}
        onClose={() => setShowWidget(false)}
      />
    );
  }

  return (
    <>
      <PetHungerToast
        open={showHungerToast}
        onClose={() => setShowHungerToast(false)}
        petName={pet.name}
        level={hungerToastLevel}
        onFeed={() => {
          setShowHungerToast(false);
          navigate('/pets');
        }}
      />
      <PetStage
        pet={pet}
        companions={companions}
        mood={petMoodService.calculateCurrentMood(pet)}
        roam={roam}
        reaction={reaction}
        season={themeConfig ? activeSeason(themeConfig) : null}
        unwatchedToday={unwatchedToday}
        onOpenPets={() => navigate('/pets')}
        onOpenCalendar={() => navigate('/calendar')}
        onFeed={handleFeed}
        onPlay={handlePlay}
      />
    </>
  );
};
