/**
 * PetsPage - Premium Virtual Pet Experience
 * Beautiful tamagotchi-style pet companion
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { GradientText, LoadingSpinner, PageHeader } from '../../components/ui';
import { EvolvingPixelPet } from '../../components/pet';
import { useTheme } from '../../contexts/ThemeContext';
import { petMoodService } from '../../services/petMoodService';
import { petService } from '../../services/petService';
import { ACCESSORIES, Pet, PET_COLORS, PET_TYPE_NAMES, PET_TYPES } from '../../types/pet.types';

export const PetsPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const authContext = useAuth();
  const user = authContext?.user;
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const [canAddSecondPet, setCanAddSecondPet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [selectedType, setSelectedType] = useState<Pet['type']>('cat');
  const [activeColorBorder, setActiveColorBorder] = useState<string | null>(null);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const pet = pets[selectedPetIndex] ?? null;

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  const loadPets = async () => {
    if (!user) return;
    try {
      const updatedPets = await petService.updateAllPetsStatus(user.uid);
      if (updatedPets.length > 0) {
        setPets(updatedPets);
        setActiveColorBorder(updatedPets[selectedPetIndex]?.color || updatedPets[0].color);

        // Aktives Pet aus DB laden und Index setzen
        const activePetId = await petService.getActivePetId(user.uid);
        if (activePetId) {
          const idx = updatedPets.findIndex((p) => p.id === activePetId);
          if (idx >= 0) setSelectedPetIndex(idx);
        }
      } else {
        setShowCreateModal(true);
      }

      const canAdd = await petService.canCreateSecondPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPet = async () => {
    if (!user || !petName.trim()) return;
    try {
      const newPet = await petService.createPet(user.uid, petName.trim(), selectedType);
      setPets((prev) => [...prev, newPet]);
      setSelectedPetIndex(pets.length); // neues Pet auswählen
      setShowCreateModal(false);
      setPetName('');
      const canAdd = await petService.canCreateSecondPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error creating pet:', error);
    }
  };

  const feedPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.feedPet(user.uid, pet.id);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const playWithPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.playWithPet(user.uid, pet.id);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  const revivePet = async () => {
    if (!user || !pet) return;
    try {
      const revivedPet = await petService.revivePet(user.uid, pet.id);
      if (revivedPet) setPets((prev) => prev.map((p) => (p.id === revivedPet.id ? revivedPet : p)));
    } catch (error) {
      console.error('Error reviving pet:', error);
    }
  };

  const releasePet = async () => {
    if (!user || !pet) return;
    try {
      await petService.deletePet(user.uid, pet.id);
      const remaining = pets.filter((p) => p.id !== pet.id);
      setPets(remaining);
      setShowReleaseConfirm(false);

      if (remaining.length > 0) {
        setSelectedPetIndex(0);
        setActiveColorBorder(remaining[0].color);
        await petService.setActivePetId(user.uid, remaining[0].id);
      } else {
        setSelectedPetIndex(0);
        setShowCreateModal(true);
      }

      const canAdd = await petService.canCreateSecondPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error releasing pet:', error);
    }
  };

  const changeColor = async (newColor: string) => {
    if (!user || !pet) return;
    setActiveColorBorder(newColor);

    try {
      const updatedPet = await petService.changePetColor(user.uid, pet.id, newColor);
      if (updatedPet) {
        setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
      }
    } catch (error) {
      console.error('Error changing color:', error);
      setActiveColorBorder(pet.color);
    }
  };

  const toggleAccessory = async (accessoryId: string) => {
    if (!user || !pet) return;

    const currentAccessories = pet.accessories || [];
    const accessoryIndex = currentAccessories.findIndex((acc) => acc.id === accessoryId);

    let newAccessories;
    if (accessoryIndex >= 0) {
      newAccessories = currentAccessories.map((acc) =>
        acc.id === accessoryId ? { ...acc, equipped: !acc.equipped } : acc
      );
    } else {
      const accessoryInfo = ACCESSORIES[accessoryId];
      if (accessoryInfo) {
        newAccessories = [
          ...currentAccessories,
          {
            id: accessoryId,
            type: accessoryInfo.type,
            name: accessoryInfo.name,
            icon: accessoryInfo.icon,
            equipped: true,
          },
        ];
      } else {
        newAccessories = currentAccessories;
      }
    }

    const optimisticPet = { ...pet, accessories: newAccessories };
    setPets((prev) => prev.map((p) => (p.id === pet.id ? optimisticPet : p)));

    try {
      const updatedPet = await petService.toggleAccessory(user.uid, pet.id, accessoryId);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error toggling accessory:', error);
      setPets((prev) => prev.map((p) => (p.id === pet.id ? pet : p)));
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner size={56} />
      </div>
    );
  }

  // Create Pet Modal
  if (showCreateModal) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
          position: 'relative',
        }}
      >
        {/* Decorative Background */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: `
              radial-gradient(ellipse 80% 50% at 50% 20%, #ec489930, transparent),
              radial-gradient(ellipse 60% 40% at 80% 60%, ${currentTheme.primary}20, transparent)
            `,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <GradientText as="h2" from="#ec4899" to={currentTheme.primary} style={{
                fontSize: '28px',
                fontWeight: 800,
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              Erschaffe dein Pet!
            </GradientText>

            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Pet Name..."
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: currentTheme.background.default,
                border: `2px solid ${currentTheme.border.default}`,
                borderRadius: '14px',
                color: currentTheme.text.primary,
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  color: currentTheme.text.primary,
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Wähle deinen Typ:
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                }}
              >
                {(Object.keys(PET_TYPES) as Pet['type'][]).map((type) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(type)}
                    style={{
                      padding: '14px 8px',
                      background:
                        selectedType === type
                          ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                          : currentTheme.background.default,
                      border:
                        selectedType === type ? 'none' : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '12px',
                      color: selectedType === type ? 'white' : currentTheme.text.primary,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow:
                        selectedType === type ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                    }}
                  >
                    {PET_TYPE_NAMES[type]}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={createPet}
              disabled={!petName.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: petName.trim()
                  ? `linear-gradient(135deg, #ec4899, #8b5cf6)`
                  : currentTheme.background.default,
                color: petName.trim() ? '#fff' : currentTheme.text.muted,
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: petName.trim() ? 'pointer' : 'not-allowed',
                boxShadow: petName.trim() ? '0 8px 24px rgba(236,72,153,0.4)' : 'none',
              }}
            >
              Pet erschaffen!
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const currentMood = petMoodService.calculateCurrentMood(pet);
  const hungerPercentage = Math.max(0, 100 - pet.hunger);
  const happinessPercentage = pet.happiness;
  const experienceNeeded = pet.level * 100;
  const experiencePercentage = (pet.experience / experienceNeeded) * 100;

  const moodEmojis: Record<string, string> = {
    happy: '😊',
    excited: '🤩',
    playful: '🎮',
    sleepy: '😴',
    hungry: '🍖',
    sad: '😢',
    festive: '🎄',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '500px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, #ec489935, transparent),
            radial-gradient(ellipse 60% 40% at 20% 20%, ${currentTheme.primary}25, transparent),
            radial-gradient(ellipse 50% 30% at 80% 30%, #8b5cf620, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <PageHeader
        title="Meine Pets"
        gradientFrom="#ec4899"
        gradientTo={currentTheme.primary}
      />

      {/* Pet Selector */}
      {pets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '8px 20px 0',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {pets.map((p, idx) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                setSelectedPetIndex(idx);
                setActiveColorBorder(p.color);
                if (user) await petService.setActivePetId(user.uid, p.id);
              }}
              style={{
                padding: '8px 18px',
                background:
                  idx === selectedPetIndex
                    ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                    : currentTheme.background.surface,
                border:
                  idx === selectedPetIndex ? 'none' : `1px solid ${currentTheme.border.default}`,
                borderRadius: '14px',
                color: idx === selectedPetIndex ? '#fff' : currentTheme.text.primary,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow:
                  idx === selectedPetIndex ? `0 4px 15px ${currentTheme.primary}40` : 'none',
              }}
            >
              {p.name}
              <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                Lv.{p.level}
              </span>
            </motion.button>
          ))}

          {/* Zweites Pet hinzufügen */}
          {pets.length < 2 &&
            (canAddSecondPet ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowCreateModal(true)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, #ec4899, #8b5cf6)`,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(236,72,153,0.35)',
                }}
              >
                +
              </motion.button>
            ) : (
              <div
                style={{
                  padding: '8px 14px',
                  background: currentTheme.background.surface,
                  border: `1px dashed ${currentTheme.border.default}`,
                  borderRadius: '14px',
                  color: currentTheme.text.muted,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                2. Pet ab Lv.15
              </div>
            ))}
        </motion.div>
      )}

      {/* Pet Name & Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          textAlign: 'center',
          padding: '10px 20px 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <GradientText as="h2" from={currentTheme.text.primary} to="#ec4899" style={{
            fontSize: '36px',
            fontWeight: 800,
            margin: '0 0 12px',
          }}
        >
          {pet.name}
        </GradientText>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
              border: `1px solid ${currentTheme.primary}40`,
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 700,
              color: currentTheme.primary,
            }}
          >
            Level {pet.level}
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, #ec489920, #ec489910)`,
              border: `1px solid #ec489940`,
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ec4899',
            }}
          >
            {PET_TYPE_NAMES[pet.type]}
          </div>
          {pet.favoriteGenre && (
            <div
              style={{
                background: `linear-gradient(135deg, #fbbf2420, #fbbf2410)`,
                border: `1px solid #fbbf2440`,
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fbbf24',
              }}
            >
              {pet.favoriteGenre}
            </div>
          )}
        </div>
      </motion.div>

      {/* Pet Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: `${currentTheme.background.surface}ee`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '32px',
            padding: '40px',
            border: `1px solid ${currentTheme.border.default}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '260px',
            minHeight: '260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '250px',
              height: '250px',
              background: `radial-gradient(circle, #ec489930, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          <EvolvingPixelPet pet={pet} size={160} animated={pet.isAlive} />

          {/* Mood Badge */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            {!pet.isAlive && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.status.error}, #ef4444)`,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Tot
              </div>
            )}
            <div
              style={{
                background: currentTheme.background.default,
                border: `1px solid ${currentTheme.border.default}`,
                padding: '6px 10px',
                borderRadius: '12px',
                fontSize: '16px',
              }}
            >
              {(currentMood && moodEmojis[currentMood]) || '😊'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '0 20px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {[
          {
            label: 'Hunger',
            value: hungerPercentage,
            color: '#ff6b6b',
            icon: '🍖',
            text: `${Math.round(hungerPercentage)}%`,
          },
          {
            label: 'Glück',
            value: happinessPercentage,
            color: '#4ecdc4',
            icon: '😊',
            text: `${Math.round(happinessPercentage)}%`,
          },
          {
            label: 'XP',
            value: experiencePercentage,
            color: '#8b5cf6',
            icon: '⭐',
            text: `${pet.experience}/${experienceNeeded}`,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + index * 0.05 }}
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '18px',
              padding: '16px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{stat.icon}</div>
            <div
              style={{
                color: currentTheme.text.primary,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                background: `${stat.color}20`,
                borderRadius: '6px',
                height: '6px',
                overflow: 'hidden',
                marginBottom: '6px',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.value}%` }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${stat.color}, ${stat.color}cc)`,
                  borderRadius: '6px',
                }}
              />
            </div>
            <div
              style={{
                color: stat.color,
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {stat.text}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          padding: '0 20px 24px',
          display: 'flex',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          {pet.isAlive ? (
            <>
              <motion.button
                key="feed"
                whileTap={{ scale: 0.95 }}
                onClick={feedPet}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: `linear-gradient(135deg, #ff6b6b, #ff5252)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255,107,107,0.35)',
                }}
              >
                🍖 Füttern
              </motion.button>
              <motion.button
                key="play"
                whileTap={{ scale: 0.95 }}
                onClick={playWithPet}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: `linear-gradient(135deg, #4ecdc4, #44a08d)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(78,205,196,0.35)',
                }}
              >
                🎮 Spielen
              </motion.button>
            </>
          ) : (
            <motion.button
              key="revive"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={revivePet}
              style={{
                flex: 1,
                padding: '16px',
                background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
              }}
            >
              Wiederbeleben
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Release Confirmation Modal */}
      <AnimatePresence>
        {showReleaseConfirm && pet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowReleaseConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '24px',
                padding: '28px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
              <h3
                style={{
                  color: currentTheme.text.primary,
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {pet.name} zur Adoption freigeben?
              </h3>
              <p
                style={{
                  color: currentTheme.text.muted,
                  fontSize: '14px',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                Dein Pet wird unwiderruflich entfernt. Level, XP und alle Fortschritte gehen
                verloren.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReleaseConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: '14px',
                    color: currentTheme.text.primary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Behalten
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={releasePet}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(239,68,68,0.35)',
                  }}
                >
                  Freigeben
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          padding: '0 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Colors */}
        <div
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              color: currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 700,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            Farben
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {Object.entries(PET_COLORS).map(([colorKey, colorValue]) => {
              const currentActive = activeColorBorder || pet?.color || '';
              const isSelected = currentActive === colorKey;
              return (
                <motion.button
                  key={`${colorKey}-${activeColorBorder}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeColor(colorKey)}
                  style={{
                    width: '44px',
                    height: '44px',
                    background: colorValue,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: isSelected
                      ? `3px solid ${currentTheme.primary}`
                      : `2px solid ${currentTheme.border.default}`,
                    boxShadow: isSelected
                      ? `0 0 20px ${currentTheme.primary}60, 0 4px 12px ${colorValue}40`
                      : `0 4px 12px ${colorValue}30`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Accessories */}
        <div
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <h3
            style={{
              color: currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 700,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            Accessoires
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
            }}
          >
            {Object.entries(ACCESSORIES)
              .slice(0, 8)
              .map(([accessoryId, accessory]) => {
                const isEquipped = pet.accessories?.some(
                  (acc) => acc.id === accessoryId && acc.equipped
                );
                return (
                  <motion.button
                    key={`${accessoryId}-${isEquipped}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleAccessory(accessoryId)}
                    style={{
                      padding: '12px',
                      background: isEquipped
                        ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}15)`
                        : currentTheme.background.default,
                      border: isEquipped
                        ? `2px solid ${currentTheme.primary}`
                        : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '14px',
                      color: currentTheme.text.primary,
                      fontSize: '20px',
                      cursor: 'pointer',
                      boxShadow: isEquipped ? `0 4px 12px ${currentTheme.primary}30` : 'none',
                    }}
                  >
                    {accessory.icon}
                  </motion.button>
                );
              })}
          </div>
        </div>
      </motion.div>

      {/* Release Button */}
      <div
        style={{
          padding: '24px 20px 0',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          onClick={() => setShowReleaseConfirm(true)}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            border: 'none',
            color: currentTheme.text.muted,
            fontSize: '12px',
            fontWeight: 400,
            cursor: 'pointer',
            opacity: 0.5,
          }}
        >
          Zur Adoption freigeben
        </button>
      </div>
    </div>
  );
};
