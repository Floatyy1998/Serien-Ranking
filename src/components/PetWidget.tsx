import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { Pet } from '../types/pet.types';
import { petService } from '../services/petService';
import { EvolvingPixelPet } from './EvolvingPixelPet';

export const PetWidget: React.FC = () => {
  const authContext = useAuth();
  const user = authContext?.user;
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(true);

  useEffect(() => {
    if (user) {
      loadPet();
    }
  }, [user]);

  // Auto-update Status alle 5 Minuten
  useEffect(() => {
    if (!user || !pet) return;

    const interval = setInterval(() => {
      petService.updatePetStatus(user.uid).then(updatedPet => {
        if (updatedPet) setPet(updatedPet);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, pet]);

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
          bottom: '90px',
          right: '15px',
          background: currentTheme.background.card + 'f0',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${currentTheme.border}44`,
          zIndex: 100,
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
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              fontSize: '36px',
              marginBottom: '8px',
            }}
          >
            🥚
          </motion.div>
          <h4 style={{
            color: currentTheme.text.primary,
            margin: '0 0 4px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Hol dir ein Pet!
          </h4>
          <p style={{
            color: currentTheme.text.secondary,
            fontSize: '11px',
            margin: 0,
            opacity: 0.8
          }}>
            Tippe zum Starten
          </p>
        </div>
      </motion.div>
    );
  }

  // Pet Widget - Nur das Pet
  return (
    <AnimatePresence>
      {showWidget && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          className="pet-widget"
          style={{
            position: 'fixed',
            bottom: '83px',
            right: '15px',
            zIndex: 100,
            cursor: 'pointer',
            filter: pet.isAlive ? 'none' : 'grayscale(100%)',
          }}
          onClick={() => navigate('/pets')}
        >
          <div style={{ position: 'relative' }}>
            {/* Pet anzeigen */}
            <motion.div
              animate={pet.isAlive ? { y: [0, -3, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <EvolvingPixelPet pet={pet} size={70} animated={pet.isAlive} />
            </motion.div>

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
              <div style={{
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
              }}>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};