import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PET_CONFIG } from '../../services/pet/petConstants';
import { petService } from '../../services/petService';
import { petMoodService } from '../../services/pet/petMoodService';
import type { Pet } from '../../types/pet.types';
import { EvolvingPixelPet } from './EvolvingPixelPet';
import { PetHungerToast } from './PetHungerToast';
import type { EdgePosition } from './PetWidgetHelpers';
import {
  calculateEdgeFromPosition,
  calculatePixelPosition,
  convertPercentToEdge,
  getNavbarHeight,
  getStatusColor,
  isPetHealthy,
} from './PetWidgetHelpers';
import { PetWidgetNoPet } from './PetWidgetNoPet';

export const PetWidget: React.FC = () => {
  const authContext = useAuth();
  const user = authContext?.user;
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [recentlyDragged, setRecentlyDragged] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({
    left: 0,
    right: window.innerWidth - 70,
    top: 0,
    bottom: window.innerHeight - 70,
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [edgePosition, setEdgePosition] = useState<EdgePosition>({
    edge: 'bottom-right',
    offsetX: 2,
    offsetY: 2,
  });
  const [showHungerToast, setShowHungerToast] = useState(false);
  const [hungerToastLevel, setHungerToastLevel] = useState<'warning' | 'critical'>('warning');

  const loadPosition = useCallback(async () => {
    if (!user) return;

    try {
      const savedPosition = await petService.getPetWidgetPosition(user.uid);
      if (savedPosition && 'edge' in savedPosition) {
        setEdgePosition(savedPosition);
        setPosition(calculatePixelPosition(savedPosition));
      } else if (savedPosition && 'xPercent' in savedPosition) {
        const convertedEdge = convertPercentToEdge(savedPosition);
        setEdgePosition(convertedEdge);
        setPosition(calculatePixelPosition(convertedEdge));
      } else {
        setPosition(calculatePixelPosition(edgePosition));
      }
    } catch (error) {
      console.error('Error loading pet position:', error);
      setPosition(calculatePixelPosition(edgePosition));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const savePosition = async (newPosition: { x: number; y: number }) => {
    if (!user) return;

    try {
      const newEdgePosition = calculateEdgeFromPosition(newPosition);
      await petService.savePetWidgetPosition(user.uid, newEdgePosition);
      setEdgePosition(newEdgePosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error saving pet position:', error);
    }
  };

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

    const interval = setInterval(
      async () => {
        try {
          await petService.updateAllPetsStatus(user.uid);
          const activePetId = await petService.getActivePetId(user.uid);
          if (activePetId) {
            const updatedPet = await petService.getUserPet(user.uid, activePetId);
            if (updatedPet) {
              setPet(updatedPet);
              checkHungerToast(updatedPet);
            }
          }
        } catch (error) {
          console.error('Error updating pets status:', error);
        }
      },
      5 * 60 * 1000
    );

    checkHungerToast(pet);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pet?.id]);

  useEffect(() => {
    const updateConstraintsAndPosition = () => {
      const screenWidth = window.innerWidth || 1920;
      const screenHeight = window.innerHeight || 1080;
      const widgetSize = 70;
      const navbarHeight = getNavbarHeight();

      setDragConstraints({
        left: 0,
        right: screenWidth - widgetSize,
        top: 0,
        bottom: screenHeight - navbarHeight - widgetSize,
      });

      setPosition(calculatePixelPosition(edgePosition));
    };

    window.addEventListener('resize', updateConstraintsAndPosition);
    updateConstraintsAndPosition();

    return () => window.removeEventListener('resize', updateConstraintsAndPosition);
  }, [edgePosition]);

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
          setPet(updatedPet || userPet);
        }
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPet();
      loadPosition();
    }
  }, [user, loadPet, loadPosition]);

  if (!user || !showWidget || isLoading) return null;

  if (!pet) {
    return (
      <PetWidgetNoPet
        position={position}
        onNavigate={() => navigate('/pets')}
        onClose={() => setShowWidget(false)}
      />
    );
  }

  const currentMood = petMoodService.calculateCurrentMood(pet);
  const statusColor = getStatusColor(pet);
  const isCritical = pet.isAlive && pet.hunger >= PET_CONFIG.STATUS_CRITICAL_HUNGER;
  const healthy = isPetHealthy(pet);
  const hungerBarPercent = Math.max(0, 100 - pet.hunger);

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
      <AnimatePresence>
        {showWidget && (
          <motion.div
            drag
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y }}
            animate={{
              opacity: 1,
              scale: 1,
              x: position.x,
              y: position.y,
              ...(isCritical
                ? {
                    boxShadow: [
                      `0 0 8px ${statusColor}60`,
                      `0 0 16px ${statusColor}90`,
                      `0 0 8px ${statusColor}60`,
                    ],
                  }
                : {}),
            }}
            transition={
              isCritical
                ? {
                    boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }
                : undefined
            }
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 1000 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_event, info) => {
              setIsDragging(false);
              setRecentlyDragged(true);
              setTimeout(() => setRecentlyDragged(false), 100);

              const newPosition = {
                x: position.x + info.offset.x,
                y: position.y + info.offset.y,
              };
              savePosition(newPosition);
            }}
            className="pet-widget"
            style={{
              position: 'fixed',
              zIndex: 1001,
              cursor: isDragging ? 'grabbing' : 'grab',
              filter: pet.isAlive ? 'none' : 'grayscale(100%)',
              borderRadius: '16px',
            }}
          >
            <div
              style={{ position: 'relative' }}
              onClick={(_e) => {
                if (!isDragging && !recentlyDragged) {
                  navigate('/pets');
                }
              }}
            >
              <EvolvingPixelPet pet={pet} size={70} animated={pet.isAlive} />

              {pet.isAlive && (
                <Tooltip title={`Hunger: ${pet.hunger}%`} arrow>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '8px',
                      right: '8px',
                      height: '3px',
                      background: `${statusColor}30`,
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      animate={{ width: `${hungerBarPercent}%` }}
                      transition={{ duration: 0.5 }}
                      style={{
                        height: '100%',
                        background: statusColor,
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </Tooltip>
              )}

              {healthy && (
                <Tooltip title="Gesundes Pet: +50% XP-Bonus aktiv" arrow>
                  <motion.div
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '-4px',
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#22c55e',
                      background: currentTheme.background.card + 'ee',
                      padding: '1px 4px',
                      borderRadius: '6px',
                      lineHeight: 1.3,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    +XP
                  </motion.div>
                </Tooltip>
              )}

              {!pet.isAlive && (
                <Tooltip title="Pet ist verstorben – Tippe zum Wiederbeleben" arrow>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      fontSize: '18px',
                    }}
                  >
                    💀
                  </motion.div>
                </Tooltip>
              )}

              {pet.isAlive && pet.hunger > 70 && (
                <Tooltip title="Dein Pet hat Hunger!" arrow>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      fontSize: '15px',
                    }}
                  >
                    🍖
                  </motion.div>
                </Tooltip>
              )}

              {pet.isAlive && currentMood && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    color: currentTheme.text.secondary,
                    whiteSpace: 'nowrap',
                    background: currentTheme.background.card + 'dd',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}
                >
                  {currentMood === 'festive' && '🎄 Festlich'}
                  {currentMood === 'sleepy' && '😴 Müde'}
                  {currentMood === 'playful' && '🎮 Spielfreudig'}
                  {currentMood === 'excited' && '✨ Aufgeregt'}
                  {currentMood === 'happy' && '😊 Glücklich'}
                  {currentMood === 'hungry' && '🍖 Hungrig'}
                  {currentMood === 'sad' && '😢 Traurig'}
                  {currentMood === 'loved' && '💕 Geliebt'}
                  {currentMood === 'scared' && '😨 Ängstlich'}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
