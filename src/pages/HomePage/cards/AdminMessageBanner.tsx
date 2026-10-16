import Campaign from '@mui/icons-material/Campaign';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { dbRef } from '../../../services/db/ref';
import { onValue } from '../../../services/db/subscribeValue';
import { t } from '../../../services/i18n';

/** Persönliche Nachricht vom Team (`admin/userMessages/$uid/text`) oben auf der Startseite. */
export const AdminMessageBanner = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = dbRef(`admin/userMessages/${user.uid}/text`);
    onValue(ref, (snap) => setMessage(snap.val() || null));
    return () => ref.off('value');
  }, [user]);

  if (!message) return null;

  return (
    <motion.div
      className="home-top-banner"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        margin: '0 16px 16px',
        padding: '16px 18px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${currentTheme.primary}2E 0%, ${currentTheme.primary}12 45%, ${currentTheme.background.surface} 100%)`,
        border: `1.5px solid ${currentTheme.primary}66`,
        boxShadow: `0 8px 32px ${currentTheme.primary}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '12px',
          background: `${currentTheme.primary}26`,
          border: `1px solid ${currentTheme.primary}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Campaign style={{ color: currentTheme.primary, fontSize: 24 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: currentTheme.primary,
            marginBottom: '3px',
          }}
        >
          {t('Nachricht vom TV-Rank Team')}
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.text.secondary,
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          {message}
        </div>
      </div>
    </motion.div>
  );
};
