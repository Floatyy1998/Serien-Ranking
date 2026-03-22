import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface PetWidgetNoPetProps {
  position: { x: number; y: number };
  onNavigate: () => void;
  onClose: () => void;
}

export const PetWidgetNoPet: React.FC<PetWidgetNoPetProps> = ({
  position,
  onNavigate,
  onClose,
}) => {
  const { currentTheme } = useTheme();

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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 1001,
        cursor: 'pointer',
        maxWidth: '160px',
      }}
      onClick={onNavigate}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: currentTheme.background.default + 'ee',
          border: 'none',
          color: currentTheme.text.secondary,
          cursor: 'pointer',
          fontSize: '15px',
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
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          Hol dir ein Pet!
        </h4>
        <p
          style={{
            color: currentTheme.text.secondary,
            fontSize: '12px',
            margin: 0,
            opacity: 0.8,
          }}
        >
          Tippe zum Starten
        </p>
      </div>
    </motion.div>
  );
};
