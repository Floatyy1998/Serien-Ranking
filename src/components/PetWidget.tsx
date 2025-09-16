import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { petService } from '../services/petService';
import { petMoodService } from '../services/petMoodService';
import { Pet } from '../types/pet.types';
import { EvolvingPixelPet } from './EvolvingPixelPet';

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
  // Drag & Drop State
  const [dragConstraints, setDragConstraints] = useState({
    left: 0,
    right: window.innerWidth - 70,
    top: 0,
    bottom: window.innerHeight - 70
  });
  const [position, setPosition] = useState({ x: 15, y: window.innerHeight - 200 });
  const [relativePosition, setRelativePosition] = useState({ xPercent: 2, yPercent: 80 }); // Default: 2% from left, 80% from top

  useEffect(() => {
    if (user) {
      loadPet();
      loadPosition();
    }
  }, [user]);

  const loadPosition = async () => {
    if (!user) return;

    try {
      const savedPosition = await petService.getPetWidgetPosition(user.uid);
      if (savedPosition && savedPosition.xPercent !== undefined && savedPosition.yPercent !== undefined) {
        setRelativePosition(savedPosition);
        // Convert percentage to pixels for current screen
        const screenWidth = window.innerWidth || 1920;
        const screenHeight = window.innerHeight || 1080;
        const pixelX = (savedPosition.xPercent / 100) * screenWidth;
        const pixelY = (savedPosition.yPercent / 100) * screenHeight;
        setPosition({ x: pixelX, y: pixelY });
      }
    } catch (error) {
      console.error('Error loading pet position:', error);
    }
  };

  const savePosition = async (newPosition: { x: number; y: number }) => {
    if (!user) return;

    try {
      // Ensure valid dimensions to avoid NaN
      const screenWidth = window.innerWidth || 1920;
      const screenHeight = window.innerHeight || 1080;

      // Convert pixels to percentage for cross-device compatibility
      // Account for widget size (70px) to prevent it from going off-screen
      const widgetSize = 70;
      const maxXPercent = ((screenWidth - widgetSize) / screenWidth) * 100;
      const maxYPercent = ((screenHeight - widgetSize) / screenHeight) * 100;

      const xPercent = Math.max(0, Math.min(maxXPercent, (newPosition.x / screenWidth) * 100));
      const yPercent = Math.max(0, Math.min(maxYPercent, (newPosition.y / screenHeight) * 100));

      // Validate percentages are not NaN
      if (isNaN(xPercent) || isNaN(yPercent)) {
        console.error('Invalid position percentages:', { xPercent, yPercent, newPosition, screenWidth, screenHeight });
        return;
      }

      const relativePos = { xPercent, yPercent };
      await petService.savePetWidgetPosition(user.uid, relativePos);
      setRelativePosition(relativePos);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error saving pet position:', error);
    }
  };

  // Auto-update Status alle 5 Minuten
  useEffect(() => {
    if (!user || !pet) return;

    const interval = setInterval(
      () => {
        petService.updatePetStatus(user.uid).then((updatedPet) => {
          if (updatedPet) setPet(updatedPet);
        });
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [user, pet]);

  // Update drag constraints and position on window resize
  useEffect(() => {
    const updateConstraintsAndPosition = () => {
      setDragConstraints({
        left: 0,
        right: window.innerWidth - 70,
        top: 0,
        bottom: window.innerHeight - 70
      });

      // Recalculate position based on stored percentage
      const screenWidth = window.innerWidth || 1920;
      const screenHeight = window.innerHeight || 1080;
      const pixelX = (relativePosition.xPercent / 100) * screenWidth;
      const pixelY = (relativePosition.yPercent / 100) * screenHeight;
      setPosition({ x: pixelX, y: pixelY });
    };

    window.addEventListener('resize', updateConstraintsAndPosition);
    return () => window.removeEventListener('resize', updateConstraintsAndPosition);
  }, [relativePosition]);

  const loadPet = async () => {
    if (!user) return;

    try {
      const userPet = await petService.getUserPet(user.uid);
      if (userPet) {
        // Update Status beim Laden
        const updatedPet = await petService.updatePetStatus(user.uid);
        setPet(updatedPet || userPet);
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !showWidget || isLoading) return null;

  // Zeige "Hol dir ein Pet" wenn kein Pet vorhanden
  if (!pet) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="pet-widget"
        style={{
          position: 'fixed',
          left: '15px',
          top: `${window.innerHeight - 200}px`,
          background: currentTheme.background.card + 'f0',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${currentTheme.border}44`,
          zIndex: 1001,
          cursor: 'pointer',
          maxWidth: '160px',
        }}
        onClick={() => navigate('/pets')}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowWidget(false);
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: currentTheme.background.default + 'ee',
            border: 'none',
            color: currentTheme.text.secondary,
            cursor: 'pointer',
            fontSize: '14px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              fontSize: '36px',
              marginBottom: '8px',
            }}
          >
            🥚
          </motion.div>
          <h4
            style={{
              color: currentTheme.text.primary,
              margin: '0 0 4px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Hol dir ein Pet!
          </h4>
          <p
            style={{
              color: currentTheme.text.secondary,
              fontSize: '11px',
              margin: 0,
              opacity: 0.8,
            }}
          >
            Tippe zum Starten
          </p>
        </div>
      </motion.div>
    );
  }

  // Pet Widget mit neuen Features
  const currentMood = petMoodService.calculateCurrentMood(pet);

  return (
    <AnimatePresence>
      {showWidget && (
        <motion.div
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.8, x: position.x, y: position.y }}
          animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileDrag={{ scale: 1.1, zIndex: 1000 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_event, info) => {
            setIsDragging(false);
            setRecentlyDragged(true);

            // Reset recently dragged after 100ms
            setTimeout(() => setRecentlyDragged(false), 100);

            const newPosition = {
              x: position.x + info.offset.x,
              y: position.y + info.offset.y
            };
            savePosition(newPosition);
          }}
          className="pet-widget"
          style={{
            position: 'fixed',
            zIndex: 1001,
            cursor: isDragging ? 'grabbing' : 'grab',
            filter: pet.isAlive ? 'none' : 'grayscale(100%)',
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
            {/* Animiertes Pet - einfache Animation */}
            <EvolvingPixelPet
              pet={pet}
              size={70}
              animated={pet.isAlive}
            />

            {/* Tod-Indikator für tote Pets */}
            {!pet.isAlive && (
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
            )}

            {/* Level Badge nur für lebende Pets */}
            {pet.isAlive && pet.level > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: currentTheme.primary,
                  color: '#fff',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                }}
              >
                {pet.level}
              </div>
            )}

            {/* Feed Indicator wenn hungrig (nur lebende Pets) */}
            {pet.isAlive && pet.hunger > 70 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  fontSize: '14px',
                }}
              >
                🍖
              </motion.div>
            )}

            {/* Mood Text unter dem Pet */}
            {pet.isAlive && currentMood && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
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
  );
};
