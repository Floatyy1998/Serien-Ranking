import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { Pet, PET_TYPES, PET_TYPE_NAMES, PET_COLORS, ACCESSORIES } from '../types/pet.types';
import { petService } from '../services/petService';
import { petMoodService } from '../services/petMoodService';
import { EvolvingPixelPet } from '../components/EvolvingPixelPet';
import { motion } from 'framer-motion';

export const PetsPage: React.FC = () => {
  const { getMobileHeaderStyle, currentTheme } = useTheme();
  const authContext = useAuth();
  const user = authContext?.user;
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [selectedType, setSelectedType] = useState<Pet['type']>('cat');
  const [activeColorBorder, setActiveColorBorder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPet();
    }
  }, [user]);

  const loadPet = async () => {
    if (!user) return;
    try {
      const userPet = await petService.getUserPet(user.uid);
      if (userPet) {
        const updatedPet = await petService.updatePetStatus(user.uid);
        const finalPet = updatedPet || userPet;
        setPet(finalPet);
        setActiveColorBorder(finalPet.color);
      } else {
        setShowCreateModal(true);
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPet = async () => {
    if (!user || !petName.trim()) return;
    try {
      const newPet = await petService.createPet(user.uid, petName.trim(), selectedType);
      setPet(newPet);
      setShowCreateModal(false);
      setPetName('');
    } catch (error) {
      console.error('Error creating pet:', error);
    }
  };

  const feedPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.feedPet(user.uid);
      if (updatedPet) setPet(updatedPet);
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const playWithPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.playWithPet(user.uid);
      if (updatedPet) setPet(updatedPet);
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  const revivePet = async () => {
    if (!user || !pet) return;
    try {
      const revivedPet = await petService.revivePet(user.uid);
      if (revivedPet) setPet(revivedPet);
    } catch (error) {
      console.error('Error reviving pet:', error);
    }
  };

  const changeColor = async (newColor: string) => {
    if (!user || !pet) return;

    // Sofort Border-State aktualisieren (nur ein Button selected)
    setActiveColorBorder(newColor);

    try {
      const updatedPet = await petService.changePetColor(user.uid, newColor);
      if (updatedPet) {
        setPet(updatedPet);
      }
    } catch (error) {
      console.error('Error changing color:', error);
      // Bei Fehler auf ursprüngliche Farbe zurücksetzen
      setActiveColorBorder(pet.color);
    }
  };

  const toggleAccessory = async (accessoryId: string) => {
    if (!user || !pet) return;

    // Optimistic update - sofort UI aktualisieren
    const currentAccessories = pet.accessories || [];
    const accessoryIndex = currentAccessories.findIndex(acc => acc.id === accessoryId);

    let newAccessories;
    if (accessoryIndex >= 0) {
      // Toggle existing accessory
      newAccessories = currentAccessories.map(acc =>
        acc.id === accessoryId ? { ...acc, equipped: !acc.equipped } : acc
      );
    } else {
      // Add new accessory
      const accessoryInfo = ACCESSORIES[accessoryId];
      if (accessoryInfo) {
        newAccessories = [...currentAccessories, {
          id: accessoryId,
          type: accessoryInfo.type,
          name: accessoryInfo.name,
          icon: accessoryInfo.icon,
          equipped: true
        }];
      } else {
        newAccessories = currentAccessories;
      }
    }

    const optimisticPet = { ...pet, accessories: newAccessories };
    setPet(optimisticPet);

    try {
      const updatedPet = await petService.toggleAccessory(user.uid, accessoryId);
      if (updatedPet) setPet(updatedPet);
    } catch (error) {
      console.error('Error toggling accessory:', error);
      // Revert on error
      setPet(pet);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        ...getMobileHeaderStyle(),
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${currentTheme.background.default} 0%, ${currentTheme.primary}20 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: '60px',
            height: '60px',
            border: `4px solid ${currentTheme.primary}`,
            borderTop: '4px solid transparent',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  }

  // Create Pet Modal
  if (showCreateModal) {
    return (
      <div style={{
        ...getMobileHeaderStyle(),
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${currentTheme.background.default} 0%, ${currentTheme.primary}20 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.background.card}f0 0%, ${currentTheme.background.card}e0 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${currentTheme.border}40`,
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: `0 20px 40px ${currentTheme.primary}20`,
          }}
        >
          <h2 style={{
            color: currentTheme.text.primary,
            fontSize: '28px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '30px',
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Erschaffe dein Pet! 🌟
          </h2>

          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Pet Name..."
            style={{
              width: '100%',
              padding: '16px 20px',
              backgroundColor: currentTheme.background.default + '60',
              border: `2px solid ${currentTheme.border}60`,
              borderRadius: '16px',
              color: currentTheme.text.primary,
              fontSize: '16px',
              marginBottom: '20px',
              outline: 'none',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentTheme.primary;
              e.target.style.boxShadow = `0 0 20px ${currentTheme.primary}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentTheme.border + '60';
              e.target.style.boxShadow = 'none';
            }}
          />

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              color: currentTheme.text.primary,
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              Wähle deinen Typ:
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {(Object.keys(PET_TYPES) as Pet['type'][]).map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '16px 8px',
                    backgroundColor: selectedType === type
                      ? `${currentTheme.primary}40`
                      : `${currentTheme.background.default}40`,
                    border: selectedType === type
                      ? `2px solid ${currentTheme.primary}`
                      : `2px solid ${currentTheme.border}40`,
                    borderRadius: '16px',
                    color: currentTheme.text.primary,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                >
                  {PET_TYPE_NAMES[type]}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createPet}
            disabled={!petName.trim()}
            style={{
              width: '100%',
              padding: '18px',
              background: petName.trim()
                ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                : currentTheme.background.default + '60',
              color: petName.trim() ? '#fff' : currentTheme.text.secondary,
              border: 'none',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: petName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: petName.trim() ? `0 10px 30px ${currentTheme.primary}40` : 'none'
            }}
          >
            Pet erschaffen! ✨
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!pet) return null;

  const currentMood = petMoodService.calculateCurrentMood(pet);
  const hungerPercentage = Math.max(0, 100 - pet.hunger);
  const happinessPercentage = pet.happiness;
  const experienceNeeded = pet.level * 100;
  const experiencePercentage = (pet.experience / experienceNeeded) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${currentTheme.background.default} 0%, ${currentTheme.primary}10 50%, ${currentTheme.accent}10 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          borderBottom: `1px solid ${currentTheme.border.default}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />

          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Mein Pet
            </h1>
          </div>
        </div>
      </header>
      {/* Animated Background Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        opacity: 0.1
      }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.1
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '4px',
              height: '4px',
              background: currentTheme.primary,
              borderRadius: '50%'
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '80px 20px 20px',
          textAlign: 'center'
        }}
      >
        <h1 style={{
          color: currentTheme.text.primary,
          fontSize: '48px',
          fontWeight: '900',
          margin: '0 0 8px',
          background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 30px ${currentTheme.primary}40`,
          letterSpacing: '1px'
        }}>
          {pet.name}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: `${currentTheme.primary}20`,
            color: currentTheme.primary,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '700',
            border: `1px solid ${currentTheme.primary}40`
          }}>
            Level {pet.level}
          </div>
          <div style={{
            background: `${currentTheme.accent}20`,
            color: currentTheme.accent,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '700',
            border: `1px solid ${currentTheme.accent}40`
          }}>
            {PET_TYPE_NAMES[pet.type]}
          </div>
          {pet.favoriteGenre && (
            <div style={{
              background: '#ffd70020',
              color: '#ffd700',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '700',
              border: '1px solid #ffd70040',
              position: 'relative'
            }}>
              ⭐ {pet.favoriteGenre}
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                background: currentTheme.background.card + 'dd',
                padding: '2px 6px',
                borderRadius: '8px',
                opacity: 0.8
              }}>
                Doppelte XP!
              </div>
            </div>
          )}
        </div>
        <p style={{
          color: currentTheme.text.secondary,
          fontSize: '14px',
          margin: pet.favoriteGenre ? '20px 0 0 0' : '0',
          opacity: 0.8
        }}>
          Erstellt: {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'Unbekannt'}
        </p>
        {pet.favoriteGenre && (
          <p style={{
            color: currentTheme.text.secondary,
            fontSize: '12px',
            margin: '8px 0 0 0',
            opacity: 0.7,
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            💡 Schaue {pet.favoriteGenre}-Serien für doppelte XP!
          </p>
        )}
      </motion.div>

      {/* Main Pet Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px'
        }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.background.card}f0 0%, ${currentTheme.background.card}e0 100%)`,
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '50px',
          border: `1px solid ${currentTheme.border}40`,
          boxShadow: `0 30px 60px ${currentTheme.primary}20`,
          position: 'relative',
          overflow: 'hidden',
          minWidth: '280px',
          minHeight: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Glow Effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${currentTheme.primary}20 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <EvolvingPixelPet
            pet={pet}
            size={180}
            animated={pet.isAlive}
          />

          {/* Status Indicators */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '8px'
          }}>
            {!pet.isAlive && (
              <div style={{
                background: '#ff4444',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                💀 Tot
              </div>
            )}
            <div style={{
              background: `${currentTheme.primary}40`,
              color: currentTheme.text.primary,
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {currentMood === 'happy' && '😊'}
              {currentMood === 'excited' && '🤩'}
              {currentMood === 'playful' && '🎮'}
              {currentMood === 'sleepy' && '😴'}
              {currentMood === 'hungry' && '🍖'}
              {currentMood === 'sad' && '😢'}
              {currentMood === 'festive' && '🎄'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '0 20px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}
      >
        {[
          { label: 'Hunger', value: hungerPercentage, color: '#ff6b6b', icon: '🍖', text: `${Math.round(hungerPercentage)}%` },
          { label: 'Glück', value: happinessPercentage, color: '#4ecdc4', icon: '😊', text: `${Math.round(happinessPercentage)}%` },
          { label: 'XP', value: experiencePercentage, color: '#45b7d1', icon: '⭐', text: `${pet.experience}/${experienceNeeded}` }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background.card}f0 0%, ${currentTheme.background.card}e0 100%)`,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '20px',
              border: `1px solid ${currentTheme.border}40`,
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}>
              {stat.icon}
            </div>
            <div style={{
              color: currentTheme.text.primary,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {stat.label}
            </div>
            <div style={{
              background: currentTheme.background.default + '60',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden',
              marginBottom: '4px'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.value}%` }}
                transition={{ duration: 1, delay: 0.2 * index }}
                style={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}80 100%)`,
                  borderRadius: '10px'
                }}
              />
            </div>
            <div style={{
              color: currentTheme.text.secondary,
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {stat.text}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '0 20px 40px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}
      >
        {pet.isAlive ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={feedPet}
              style={{
                flex: 1,
                padding: '16px',
                background: `linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 30px #ff6b6b40'
              }}
            >
              🍖 Füttern
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playWithPet}
              style={{
                flex: 1,
                padding: '16px',
                background: `linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 30px #4ecdc440'
              }}
            >
              🎮 Spielen
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={revivePet}
            style={{
              flex: 1,
              padding: '16px',
              background: `linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)`,
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 30px #9b59b640'
            }}
          >
            ✨ Wiederbeleben
          </motion.button>
        )}
      </motion.div>

      {/* Quick Customization */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '0 20px 40px'
        }}
      >
        <h3 style={{
          color: currentTheme.text.primary,
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          Farben
        </h3>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {Object.entries(PET_COLORS).map(([colorKey, colorValue]) => {
            // Verwende separaten Border-State für saubere UI-Kontrolle
            // Fallback auf pet.color wenn activeColorBorder noch null ist
            const currentActive = activeColorBorder || pet?.color || '';
            const isSelected = currentActive === colorKey;
            console.log('NEW VERSION - activeColorBorder:', activeColorBorder, 'pet.color:', pet?.color, 'currentActive:', currentActive, 'colorKey:', colorKey, 'isSelected:', isSelected);
            return (
              <motion.button
                key={`${colorKey}-${activeColorBorder}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeColor(colorKey)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: colorValue,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  // Nur aktive Buttons haben einen Border
                  border: isSelected ? `3px solid ${currentTheme.primary}` : 'none',
                  boxShadow: isSelected
                    ? `0 0 20px ${currentTheme.primary}60`
                    : `0 4px 12px ${colorValue}40`
                }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Accessories */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '0 20px 40px'
        }}
      >
        <h3 style={{
          color: currentTheme.text.primary,
          fontSize: '18px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          Accessoires
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          {Object.entries(ACCESSORIES).slice(0, 8).map(([accessoryId, accessory]) => {
            const isEquipped = pet.accessories?.some(acc => acc.id === accessoryId && acc.equipped);
            return (
              <motion.button
                key={`${accessoryId}-${isEquipped}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleAccessory(accessoryId)}
                style={{
                  padding: '12px',
                  background: isEquipped
                    ? `${currentTheme.primary}40`
                    : `${currentTheme.background.card}80`,
                  backdropFilter: 'blur(10px)',
                  // Nur ausgerüstete Accessoires haben einen Border
                  border: isEquipped ? `2px solid ${currentTheme.primary}` : 'none',
                  borderRadius: '16px',
                  color: currentTheme.text.primary,
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  textAlign: 'center'
                }}
              >
                {accessory.icon}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};