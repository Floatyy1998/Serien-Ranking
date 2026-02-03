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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [edgePosition, setEdgePosition] = useState({
    edge: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    offsetX: 2,
    offsetY: 2
  });

  useEffect(() => {
    if (user) {
      loadPet();
      loadPosition();
    }
  }, [user]);

  const getNavbarHeight = () => {
    // Navbar: padding 8px top/bottom + safe-area-inset-bottom + icon container height (32px)
    const basePadding = 16; // 8px top + 8px bottom
    const iconContainerHeight = 32;
    const labelHeight = 14; // Approximate label height
    const safeAreaBottom = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
    return basePadding + iconContainerHeight + labelHeight + safeAreaBottom;
  };

  const loadPosition = async () => {
    if (!user) return;

    try {
      const savedPosition = await petService.getPetWidgetPosition(user.uid);
      if (savedPosition && 'edge' in savedPosition) {
        // If we have edge-based position saved
        setEdgePosition(savedPosition);
        calculateAndSetPixelPosition(savedPosition);
      } else if (savedPosition && 'xPercent' in savedPosition) {
        // Legacy percentage-based position - convert to edge-based
        const convertedEdge = convertPercentToEdge(savedPosition);
        setEdgePosition(convertedEdge);
        calculateAndSetPixelPosition(convertedEdge);
      } else {
        // Set default position on first load
        calculateAndSetPixelPosition(edgePosition);
      }
    } catch (error) {
      console.error('Error loading pet position:', error);
      calculateAndSetPixelPosition(edgePosition);
    }
  };

  const convertPercentToEdge = (percentPos: { xPercent: number; yPercent: number }) => {
    // Convert legacy percentage to edge-based
    const isLeft = percentPos.xPercent < 50;
    const isTop = percentPos.yPercent < 50;

    let edge: typeof edgePosition.edge;
    if (isTop && isLeft) edge = 'top-left';
    else if (isTop && !isLeft) edge = 'top-right';
    else if (!isTop && isLeft) edge = 'bottom-left';
    else edge = 'bottom-right';

    return {
      edge,
      offsetX: 2,
      offsetY: 2
    };
  };

  const calculateAndSetPixelPosition = (edgePos: typeof edgePosition) => {
    const screenWidth = window.innerWidth || 1920;
    const screenHeight = window.innerHeight || 1080;
    const widgetSize = 70;
    const navbarHeight = getNavbarHeight();

    let x: number, y: number;

    switch (edgePos.edge) {
      case 'top-left':
        x = edgePos.offsetX;
        y = edgePos.offsetY;
        break;
      case 'top-right':
        x = screenWidth - widgetSize - edgePos.offsetX;
        y = edgePos.offsetY;
        break;
      case 'bottom-left':
        x = edgePos.offsetX;
        y = screenHeight - navbarHeight - widgetSize - edgePos.offsetY;
        break;
      case 'bottom-right':
        x = screenWidth - widgetSize - edgePos.offsetX;
        y = screenHeight - navbarHeight - widgetSize - edgePos.offsetY;
        break;
    }

    setPosition({ x, y });
  };

  const savePosition = async (newPosition: { x: number; y: number }) => {
    if (!user) return;

    try {
      const screenWidth = window.innerWidth || 1920;
      const screenHeight = window.innerHeight || 1080;
      const widgetSize = 70;
      const navbarHeight = getNavbarHeight();

      // Determine which edge the widget is closest to
      const centerX = newPosition.x + widgetSize / 2;
      const centerY = newPosition.y + widgetSize / 2;

      const distanceToLeft = centerX;
      const distanceToRight = screenWidth - centerX;
      const distanceToTop = centerY;
      const distanceToBottom = screenHeight - centerY;

      const isCloserToLeft = distanceToLeft < distanceToRight;
      const isCloserToTop = distanceToTop < distanceToBottom;

      let edge: typeof edgePosition.edge;
      let offsetX: number;
      let offsetY: number;

      if (isCloserToTop && isCloserToLeft) {
        edge = 'top-left';
        offsetX = newPosition.x;
        offsetY = newPosition.y;
      } else if (isCloserToTop && !isCloserToLeft) {
        edge = 'top-right';
        offsetX = screenWidth - newPosition.x - widgetSize;
        offsetY = newPosition.y;
      } else if (!isCloserToTop && isCloserToLeft) {
        edge = 'bottom-left';
        offsetX = newPosition.x;
        offsetY = screenHeight - navbarHeight - newPosition.y - widgetSize;
      } else {
        edge = 'bottom-right';
        offsetX = screenWidth - newPosition.x - widgetSize;
        offsetY = screenHeight - navbarHeight - newPosition.y - widgetSize;
      }

      const newEdgePosition = { edge, offsetX, offsetY };

      await petService.savePetWidgetPosition(user.uid, newEdgePosition);
      setEdgePosition(newEdgePosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error saving pet position:', error);
    }
  };

  // Auto-update Status alle 5 Minuten für alle Pets, aktives Pet neu laden
  useEffect(() => {
    if (!user || !pet) return;

    const interval = setInterval(
      async () => {
        try {
          await petService.updateAllPetsStatus(user.uid);
          // Aktives Pet neu laden
          const activePetId = await petService.getActivePetId(user.uid);
          if (activePetId) {
            const updatedPet = await petService.getUserPet(user.uid, activePetId);
            if (updatedPet) setPet(updatedPet);
          }
        } catch (error) {
          console.error('Error updating pets status:', error);
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [user, pet]);

  // Update drag constraints and position on window resize
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
        bottom: screenHeight - navbarHeight - widgetSize
      });

      // Recalculate position based on stored edge position
      calculateAndSetPixelPosition(edgePosition);
    };

    window.addEventListener('resize', updateConstraintsAndPosition);
    // Run once on mount
    updateConstraintsAndPosition();

    return () => window.removeEventListener('resize', updateConstraintsAndPosition);
  }, [edgePosition]);

  const loadPet = async () => {
    if (!user) return;

    try {
      // Aktives Pet laden oder auf erstes Pet zurückfallen
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
          left: position.x || 15,
          top: position.y || window.innerHeight - 200,
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
