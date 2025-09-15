import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { Pet, PET_TYPES, PET_TYPE_NAMES } from '../types/pet.types';
import { petService } from '../services/petService';
import { EvolvingPixelPet } from '../components/EvolvingPixelPet';
import { motion, AnimatePresence } from 'framer-motion';

export const PetsPage: React.FC = () => {
  const { getMobileHeaderStyle, currentTheme } = useTheme();
  const authContext = useAuth();
  const user = authContext?.user;
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [selectedType, setSelectedType] = useState<Pet['type']>('cat');

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
        setPet(updatedPet || userPet);
      } else {
        setShowCreateModal(true);
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePet = async () => {
    if (!user || !petName.trim()) return;

    try {
      const newPet = await petService.createPet(user.uid, petName, selectedType);
      setPet(newPet);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating pet:', error);
    }
  };

  const handleFeed = async () => {
    if (!user || !pet) return;

    const updatedPet = await petService.feedPet(user.uid);
    if (updatedPet) {
      setPet(updatedPet);
    }
  };

  const handlePlay = async () => {
    if (!user || !pet) return;

    const updatedPet = await petService.playWithPet(user.uid);
    if (updatedPet) {
      setPet(updatedPet);
    }
  };

  const handleRevive = async () => {
    if (!user || !pet) return;

    const updatedPet = await petService.revivePet(user.uid);
    if (updatedPet) {
      setPet(updatedPet);
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    if (!user) return;
    await petService.deletePet(user.uid);
    setPet(null);
    setShowResetConfirm(false);
    setShowCreateModal(true);
  };

  const getMoodText = () => {
    if (!pet) return '';
    if (pet.happiness > 80) return 'Superglücklich!';
    if (pet.happiness > 50) return 'Zufrieden';
    if (pet.happiness > 20) return 'Gelangweilt';
    return 'Traurig';
  };

  const getHungerText = () => {
    if (!pet) return '';
    if (pet.hunger > 80) return 'Sehr hungrig!';
    if (pet.hunger > 50) return 'Hungrig';
    if (pet.hunger > 20) return 'Könnte essen';
    return 'Satt';
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${currentTheme.border}`,
            borderTop: `3px solid ${currentTheme.primary}`,
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: currentTheme.background.default }}>
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            color: currentTheme.text.primary,
          }}>
            Mein Pet
          </h1>
        </div>
      </header>

      {pet && (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          {/* Pet Hauptkarte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background.card} 0%, ${currentTheme.background.card}ee 100%)`,
              borderRadius: '28px',
              padding: '28px',
              marginBottom: '20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            }}
          >
            {/* Hintergrund Dekoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${currentTheme.primary}11 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-20%',
              width: '250px',
              height: '250px',
              background: `radial-gradient(circle, ${currentTheme.accent}11 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />

            {/* Pet Display */}
            <motion.div
              animate={pet.isAlive ? { y: [0, -10, 0] } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'relative',
                display: 'inline-block',
                padding: '20px',
                background: pet.isAlive
                  ? `linear-gradient(145deg, ${currentTheme.background.default}44, ${currentTheme.background.card}44)`
                  : `linear-gradient(145deg, #33333344, #00000044)`,
                borderRadius: '24px',
                border: `1px solid ${pet.isAlive ? currentTheme.border : '#444'}22`,
                marginBottom: '20px',
                filter: pet.isAlive ? 'none' : 'grayscale(100%)',
              }}
            >
              <EvolvingPixelPet pet={pet} size={180} animated={pet.isAlive} />

              {/* Tod/Stimmungs-Indikator */}
              <motion.div
                animate={pet.isAlive ? { scale: [1, 1.2, 1] } : { rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontSize: '24px',
                  background: currentTheme.background.card,
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {!pet.isAlive ? '💀' :
                 pet.happiness > 80 ? '😍' :
                 pet.happiness > 50 ? '😊' :
                 pet.happiness > 20 ? '😐' : '😢'}
              </motion.div>
            </motion.div>

            <h2 style={{
              color: pet.isAlive ? currentTheme.text.primary : '#888',
              margin: '0 0 12px',
              fontSize: '28px',
              fontWeight: '700',
              background: pet.isAlive
                ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                : 'linear-gradient(135deg, #666 0%, #444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {pet.name} {!pet.isAlive && '(†)'}
            </h2>

            {/* Tod-Info anzeigen wenn Pet tot ist */}
            {!pet.isAlive && pet.deathCause && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '12px 20px',
                marginBottom: '20px',
                color: '#ff6b6b',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                💔 Gestorben an: {
                  pet.deathCause === 'hunger' ? 'Verhungert' :
                  pet.deathCause === 'sadness' ? 'Traurigkeit' :
                  pet.deathCause === 'neglect' ? 'Vernachlässigung' :
                  'Unbekannt'
                }
                {pet.deathTime && (
                  <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                    ({new Date(pet.deathTime).toLocaleDateString()})
                  </span>
                )}
                {pet.reviveCount && pet.reviveCount > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
                    Bereits {pet.reviveCount}x wiederbelebt
                  </div>
                )}
              </div>
            )}

            {/* Info Badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}>
              <motion.span
                whileHover={{ scale: 1.05 }}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}22 0%, ${currentTheme.primary}33 100%)`,
                  color: currentTheme.primary,
                  padding: '8px 16px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${currentTheme.primary}44`,
                }}>
                <span style={{ fontSize: '16px' }}>⭐</span>
                Level {pet.level}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.accent}22 0%, ${currentTheme.accent}33 100%)`,
                  color: currentTheme.accent,
                  padding: '8px 16px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${currentTheme.accent}44`,
                }}>
                {PET_TYPES[pet.type]} {PET_TYPE_NAMES[pet.type]}
              </motion.span>
              {pet.personality && (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: currentTheme.background.default,
                    color: currentTheme.text.secondary,
                    padding: '8px 16px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    border: `1px solid ${currentTheme.border}44`,
                  }}>
                  {pet.personality === 'lazy' ? '😴 Faul' :
                   pet.personality === 'playful' ? '🎮 Verspielt' :
                   pet.personality === 'brave' ? '🦍 Mutig' :
                   pet.personality === 'shy' ? '😊 Schüchtern' :
                   '🧠 Schlau'}
                </motion.span>
              )}
            </div>

            {/* Status Bars mit besseren Styles */}
            <div style={{
              marginBottom: '24px',
              background: currentTheme.background.default + '66',
              borderRadius: '20px',
              padding: '20px',
            }}>
              {/* Happiness */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>😊</span>
                    <span style={{ color: currentTheme.text.primary, fontSize: '14px', fontWeight: '600' }}>
                      Stimmung
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: currentTheme.primary, fontSize: '16px', fontWeight: '700' }}>
                      {pet.happiness}%
                    </span>
                    <div style={{ color: currentTheme.text.secondary, fontSize: '11px' }}>
                      {getMoodText()}
                    </div>
                  </div>
                </div>
                <div style={{
                  height: '10px',
                  background: currentTheme.background.card,
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pet.happiness}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)`,
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'rgba(255,255,255,0.5)',
                      animation: 'pulse 2s infinite',
                    }} />
                  </motion.div>
                </div>
              </div>

              {/* Hunger */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🍖</span>
                    <span style={{ color: currentTheme.text.primary, fontSize: '14px', fontWeight: '600' }}>
                      Sättigung
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      color: pet.hunger > 70 ? '#FF5252' : pet.hunger > 40 ? '#FFA726' : '#4CAF50',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}>
                      {100 - pet.hunger}%
                    </span>
                    <div style={{ color: currentTheme.text.secondary, fontSize: '11px' }}>
                      {getHungerText()}
                    </div>
                  </div>
                </div>
                <div style={{
                  height: '10px',
                  background: currentTheme.background.card,
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - pet.hunger}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      height: '100%',
                      background: pet.hunger > 70
                        ? 'linear-gradient(90deg, #FF5252 0%, #FF867C 100%)'
                        : pet.hunger > 40
                        ? 'linear-gradient(90deg, #FFA726 0%, #FFCC80 100%)'
                        : 'linear-gradient(90deg, #66BB6A 0%, #81C784 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                      position: 'relative',
                    }}
                  >
                    {pet.hunger > 70 && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: 'rgba(255,255,255,0.5)',
                        animation: 'pulse 1s infinite',
                      }} />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>⭐</span>
                    <span style={{ color: currentTheme.text.primary, fontSize: '14px', fontWeight: '600' }}>
                      Erfahrung
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: currentTheme.accent, fontSize: '16px', fontWeight: '700' }}>
                      {pet.experience % 100}/100 XP
                    </span>
                    <div style={{ color: currentTheme.text.secondary, fontSize: '11px' }}>
                      Bis Level {pet.level + 1}
                    </div>
                  </div>
                </div>
                <div style={{
                  height: '10px',
                  background: currentTheme.background.card,
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pet.experience % 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${currentTheme.accent} 0%, ${currentTheme.primary} 100%)`,
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                    }}
                  />
                  {/* XP Teilstriche */}
                  {[25, 50, 75].map(mark => (
                    <div
                      key={mark}
                      style={{
                        position: 'absolute',
                        left: `${mark}%`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: currentTheme.border + '44',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Aktionen mit besseren Animationen */}
            {pet.isAlive ? (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <motion.button
                  whileHover={{ scale: pet.hunger >= 20 ? 1.03 : 1 }}
                  whileTap={{ scale: pet.hunger >= 20 ? 0.97 : 1 }}
                  onClick={handleFeed}
                  disabled={pet.hunger < 20}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: pet.hunger < 20
                      ? '#cccccc'
                      : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}dd 100%)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: pet.hunger < 20 ? 'not-allowed' : 'pointer',
                    opacity: pet.hunger < 20 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: pet.hunger < 20 ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {pet.hunger < 20 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
                    }} />
                  )}
                  <motion.span
                    animate={pet.hunger > 70 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: pet.hunger > 70 ? Infinity : 0, repeatDelay: 2 }}
                    style={{ fontSize: '20px' }}
                  >
                    🍖
                  </motion.span>
                  <span>Füttern</span>
                  {pet.hunger > 70 && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '8px',
                        height: '8px',
                        background: '#FF5252',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlay}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}dd 100%)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                    style={{ fontSize: '20px' }}
                  >
                    🎾
                  </motion.span>
                  <span>Spielen</span>
                </motion.button>
              </div>
            ) : (
              // Wiederbelebungs-Button für tote Pets
              <div style={{ marginBottom: '16px' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRevive}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)',
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: '24px' }}
                  >
                    💖
                  </motion.span>
                  <span>Wiederbeleben</span>
                  {pet.level > 1 && (
                    <span style={{ fontSize: '14px', opacity: 0.9 }}>
                      (verliert 1 Level)
                    </span>
                  )}
                </motion.button>
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: currentTheme.background.default + '66',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: currentTheme.text.secondary,
                  textAlign: 'center',
                }}>
                  ⚠️ Das Pet verliert beim Wiederbeleben 1 Level und startet mit 50% Hunger und Happiness
                </div>
              </div>
            )}
          </motion.div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}11 0%, ${currentTheme.primary}22 100%)`,
                borderRadius: '20px',
                padding: '20px',
                border: `1px solid ${currentTheme.primary}22`,
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: '28px',
                marginBottom: '8px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}>
                📺
              </div>
              <div style={{ color: currentTheme.text.secondary, fontSize: '12px', marginBottom: '4px' }}>
                Episoden geschaut
              </div>
              <div style={{
                color: currentTheme.primary,
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {pet.episodesWatched}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.accent}11 0%, ${currentTheme.accent}22 100%)`,
                borderRadius: '20px',
                padding: '20px',
                border: `1px solid ${currentTheme.accent}22`,
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: '28px',
                marginBottom: '8px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}>
                ⏰
              </div>
              <div style={{ color: currentTheme.text.secondary, fontSize: '12px', marginBottom: '4px' }}>
                Zuletzt gefüttert
              </div>
              <div style={{
                color: currentTheme.accent,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {new Date(pet.lastFed).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </motion.div>
          </div>

          {/* Zusätzliche Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: currentTheme.background.card,
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${currentTheme.border}22`,
            }}
          >
            <h3 style={{
              color: currentTheme.text.primary,
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              Erfolge
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {pet.level >= 5 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: currentTheme.background.default,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎉</div>
                  <div style={{ fontSize: '10px', color: currentTheme.text.secondary }}>Level 5</div>
                </div>
              )}
              {pet.level >= 10 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: currentTheme.background.default,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>👑</div>
                  <div style={{ fontSize: '10px', color: currentTheme.text.secondary }}>Level 10</div>
                </div>
              )}
              {pet.episodesWatched >= 10 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: currentTheme.background.default,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📺</div>
                  <div style={{ fontSize: '10px', color: currentTheme.text.secondary }}>10 Episoden</div>
                </div>
              )}
              {pet.episodesWatched >= 50 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: currentTheme.background.default,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎆</div>
                  <div style={{ fontSize: '10px', color: currentTheme.text.secondary }}>50 Episoden</div>
                </div>
              )}
              {pet.experience >= 500 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: currentTheme.background.default,
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>✨</div>
                  <div style={{ fontSize: '10px', color: currentTheme.text.secondary }}>500 XP</div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: currentTheme.text.secondary,
              border: `1px solid ${currentTheme.border}44`,
              borderRadius: '16px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = currentTheme.primary;
              e.currentTarget.style.color = currentTheme.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = currentTheme.border + '44';
              e.currentTarget.style.color = currentTheme.text.secondary;
            }}
          >
            <span style={{ fontSize: '16px' }}>🔄</span>
            Neues Pet adoptieren
          </motion.button>
        </div>
      )}

      {/* Create Modal mit besserem Design */}
      <AnimatePresence>
        {showCreateModal && (
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
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.background.card} 0%, ${currentTheme.background.card}ee 100%)`,
                borderRadius: '28px',
                padding: '32px',
                maxWidth: '440px',
                width: '100%',
                border: `1px solid ${currentTheme.border}44`,
                boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Hintergrund Dekoration */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-30%',
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${currentTheme.primary}22 0%, transparent 70%)`,
                borderRadius: '50%',
              }} />
              <h2 style={{
                color: currentTheme.text.primary,
                marginBottom: '24px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: '700',
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                position: 'relative',
              }}>
                Wähle dein Pet!
              </h2>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  fontSize: '48px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
              >
                🥚
              </motion.div>

              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <label style={{
                  display: 'flex',
                  color: currentTheme.text.primary,
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '16px' }}>✏️</span>
                  Name deines Pets
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="z.B. Fluffy, Max, Luna..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: currentTheme.background.default,
                    border: `2px solid ${currentTheme.border}44`,
                    borderRadius: '12px',
                    color: currentTheme.text.primary,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = currentTheme.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${currentTheme.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = currentTheme.border + '44';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'flex',
                  color: currentTheme.text.primary,
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '16px' }}>🐾</span>
                  Wähle deine Tierart
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 400 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {Object.entries(PET_TYPES).map(([type, emoji]) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedType(type as Pet['type'])}
                      style={{
                        padding: '16px',
                        background: selectedType === type
                          ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                          : currentTheme.background.default,
                        color: selectedType === type ? '#fff' : currentTheme.text.primary,
                        border: `2px solid ${selectedType === type ? currentTheme.primary : currentTheme.border}44`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontSize: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: selectedType === type ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {selectedType === type && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                          }}
                        >
                          ✓
                        </motion.div>
                      )}
                      <motion.span
                        animate={selectedType === type ? { y: [0, -5, 0] } : {}}
                        transition={{ duration: 0.5, repeat: selectedType === type ? Infinity : 0, repeatDelay: 2 }}
                      >
                        {emoji}
                      </motion.span>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: selectedType === type ? '600' : '500',
                      }}>
                        {PET_TYPE_NAMES[type as Pet['type']]}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: petName.trim() ? 1.02 : 1 }}
                whileTap={{ scale: petName.trim() ? 0.98 : 1 }}
                onClick={handleCreatePet}
                disabled={!petName.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: petName.trim()
                    ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                    : '#cccccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: petName.trim() ? 'pointer' : 'not-allowed',
                  opacity: petName.trim() ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: petName.trim() ? '0 4px 16px rgba(0,0,0,0.1)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {petName.trim() && (
                  <motion.div
                    animate={{ x: [-100, 400] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '100px',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                )}
                <span>Pet adoptieren!</span>
                <motion.span
                  animate={petName.trim() ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 1, repeat: petName.trim() ? Infinity : 0 }}
                  style={{ fontSize: '20px' }}
                >
                  🎉
                </motion.span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Bestätigung Modal */}
      <AnimatePresence>
        {showResetConfirm && (
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
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1001
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: currentTheme.background.card,
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
              <h3 style={{
                color: currentTheme.text.primary,
                marginBottom: '12px',
                fontSize: '20px'
              }}>
                Wirklich ein neues Pet?
              </h3>
              <p style={{
                color: currentTheme.text.secondary,
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                {pet?.name} wird dich vermissen! Alle Fortschritte gehen verloren.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: currentTheme.background.default,
                    color: currentTheme.text.primary,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Behalten
                </button>
                <button
                  onClick={confirmReset}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#FF5252',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Neues Pet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};