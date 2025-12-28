/**
 * TasteMatchPage - Geschmacks-Vergleich zwischen zwei Usern
 * Premium Design mit Tabs - Enhanced Version
 */

import {
  Category,
  CompareArrows,
  Favorite,
  LocalFireDepartment,
  Movie,
  Share,
  Star,
  Tv,
  AutoAwesome,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateTasteMatch,
  GenreComparison,
  SharedItem,
  TasteMatchResult,
} from '../services/tasteMatchService';

// ==================== ACCENT COLORS ====================
const USER_COLOR = '#667eea';       // Lila für User
const USER_GRADIENT = 'linear-gradient(135deg, #667eea, #764ba2)';
const FRIEND_COLOR = '#f093fb';     // Pink für Friend
const FRIEND_GRADIENT = 'linear-gradient(135deg, #f093fb, #f5576c)';

// Weitere Accent-Farben für Variety
const ACCENT_COLORS = {
  series: '#667eea',      // Lila für Serien
  movies: '#f093fb',      // Pink für Filme
  genres: '#00cec9',      // Cyan für Genres
  ratings: '#fdcb6e',     // Gold für Ratings
  providers: '#00b894',   // Grün für Provider
  match: '#ff6b9d',       // Herz-Pink
};

// Premium gradient for compatibility score display
const getCompatibilityGradient = (score: number): string => {
  if (score >= 80) return 'linear-gradient(135deg, #00cec9, #00b894)';
  if (score >= 60) return 'linear-gradient(135deg, #fdcb6e, #f39c12)';
  if (score >= 40) return 'linear-gradient(135deg, #e17055, #d63031)';
  return 'linear-gradient(135deg, #636e72, #2d3436)';
};

// ==================== HELPER COMPONENTS ====================

// Animierter Counter
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
};

// Stat Ring - Premium Version
const StatRing: React.FC<{
  icon: React.ReactNode;
  label: string;
  score: number;
  color: string;
  delay: number;
  bgColor: string;
}> = ({ icon, label, score, color, delay, bgColor }) => {
  const size = 78;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 8px',
        borderRadius: '16px',
        background: bgColor,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${color}25`,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: '50%',
            background: color,
            filter: 'blur(20px)',
            opacity: 0.3,
          }}
        />
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.3, duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            zIndex: 2,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'white', textShadow: `0 0 20px ${color}50` }}>{score}%</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.3px' }}>{label}</div>
      </div>
    </motion.div>
  );
};

// Genre Bar - Premium Version
const GenreBar: React.FC<{ genre: GenreComparison; index: number; userName: string; friendName: string; bgColor: string }> = ({
  genre,
  index,
  userName,
  friendName,
  bgColor,
}) => {
  const maxPct = Math.max(genre.userPercentage, genre.friendPercentage, 15);
  const similarity = 100 - Math.abs(genre.userPercentage - genre.friendPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ scale: 1.01 }}
      style={{
        marginBottom: '12px',
        padding: '16px',
        background: bgColor,
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>
          {genre.genre}
        </div>
        {similarity >= 80 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05 * index + 0.3, type: 'spring' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '8px',
              background: 'rgba(0, 206, 201, 0.2)',
              border: '1px solid rgba(0, 206, 201, 0.3)',
            }}
          >
            <LocalFireDepartment style={{ fontSize: 12, color: '#00cec9' }} />
            <span style={{ fontSize: 10, color: '#00cec9', fontWeight: 600 }}>Match!</span>
          </motion.div>
        )}
      </div>

      {/* User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: 28,
          fontSize: 10,
          color: USER_COLOR,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {userName.slice(0, 3)}
        </div>
        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.userPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.1, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: USER_GRADIENT,
              borderRadius: 5,
              boxShadow: `0 0 10px ${USER_COLOR}50`,
            }}
          />
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: USER_COLOR, minWidth: 40, textAlign: 'right' }}>
          {genre.userPercentage}%
        </span>
      </div>

      {/* Friend Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 28,
          fontSize: 10,
          color: FRIEND_COLOR,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {friendName.slice(0, 3)}
        </div>
        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.friendPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.15, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: FRIEND_GRADIENT,
              borderRadius: 5,
              boxShadow: `0 0 10px ${FRIEND_COLOR}50`,
            }}
          />
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: FRIEND_COLOR, minWidth: 40, textAlign: 'right' }}>
          {genre.friendPercentage}%
        </span>
      </div>
    </motion.div>
  );
};

// Shared Item Card - Premium Version
const SharedItemCard: React.FC<{ item: SharedItem; index: number; type: 'series' | 'movie'; bgColor: string }> = ({
  item,
  index,
  type,
  bgColor,
}) => {
  const navigate = useNavigate();
  const hasMatchingRatings = item.ratingDiff !== undefined && item.ratingDiff < 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => navigate(`/${type === 'series' ? 'series' : 'movie'}/${item.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px',
        background: bgColor,
        borderRadius: '16px',
        cursor: 'pointer',
        border: hasMatchingRatings ? `1px solid ${ACCENT_COLORS.match}40` : '1px solid rgba(255,255,255,0.06)',
        marginBottom: '10px',
        boxShadow: hasMatchingRatings
          ? `0 4px 20px ${ACCENT_COLORS.match}20`
          : '0 4px 15px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Perfect match glow */}
      {hasMatchingRatings && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${USER_GRADIENT.split('(')[1].split(',')[1]}, ${FRIEND_COLOR})`,
          }}
        />
      )}

      {item.poster ? (
        <motion.img
          src={`https://image.tmdb.org/t/p/w92${item.poster}`}
          alt={item.title}
          style={{
            width: 52,
            height: 78,
            borderRadius: 12,
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 78,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {type === 'series' ? (
            <Tv style={{ fontSize: 26, color: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <Movie style={{ fontSize: 26, color: 'rgba(255,255,255,0.25)' }} />
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '6px',
          }}
        >
          {item.title}
        </div>
        {item.userRating !== undefined && item.friendRating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: `${USER_COLOR}20`,
              borderRadius: '6px',
            }}>
              <Star style={{ fontSize: 12, color: USER_COLOR }} />
              <span style={{ fontSize: 13, color: USER_COLOR, fontWeight: 700 }}>{item.userRating.toFixed(1)}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: `${FRIEND_COLOR}20`,
              borderRadius: '6px',
            }}>
              <Star style={{ fontSize: 12, color: FRIEND_COLOR }} />
              <span style={{ fontSize: 13, color: FRIEND_COLOR, fontWeight: 700 }}>{item.friendRating.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>
      {hasMatchingRatings && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `${ACCENT_COLORS.match}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Favorite style={{ fontSize: 18, color: ACCENT_COLORS.match }} />
        </motion.div>
      )}
    </motion.div>
  );
};

// ==================== MAIN COMPONENT ====================
export const TasteMatchPage: React.FC = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();

  // Theme-basierte Farben
  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const primaryColor = currentTheme.primary;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TasteMatchResult | null>(null);
  const [friendName, setFriendName] = useState('Friend');
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('Du');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'movies' | 'genres'>('overview');

  useEffect(() => {
    const loadData = async () => {
      if (!user || !friendId) return;

      try {
        setLoading(true);

        const [currentUserSnapshot, friendSnapshot] = await Promise.all([
          firebase.database().ref(`users/${user.uid}`).once('value'),
          firebase.database().ref(`users/${friendId}`).once('value'),
        ]);

        const currentUserData = currentUserSnapshot.val();
        setUserName(currentUserData?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Du');
        setUserPhoto(currentUserData?.photoURL || user.photoURL || null);

        const friendData = friendSnapshot.val();
        setFriendName(friendData?.displayName?.split(' ')[0] || 'Friend');
        setFriendPhoto(friendData?.photoURL || null);

        const matchResult = await calculateTasteMatch(user.uid, friendId);
        setResult(matchResult);
      } catch (error) {
        console.error('Error calculating taste match:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, friendId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00cec9';
    if (score >= 60) return '#fdcb6e';
    if (score >= 40) return '#e17055';
    return '#636e72';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Seelenverwandte!';
    if (score >= 60) return 'Starke Verbindung';
    if (score >= 40) return 'Interessante Mischung';
    return 'Gegensätze ziehen sich an';
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `Mein Taste Match mit ${friendName}: ${result.overallMatch}% - ${result.seriesOverlap.sharedSeries.length} gemeinsame Serien und ${result.movieOverlap.sharedMovies.length} gemeinsame Filme!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Taste Match', text });
      } catch (err) {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  // Premium loading state
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background gradients */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${USER_COLOR}30, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${FRIEND_COLOR}30, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />

        {/* Animated orbiting hearts */}
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <Favorite style={{ fontSize: 24, color: USER_COLOR }} />
            </motion.div>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <Favorite style={{ fontSize: 24, color: FRIEND_COLOR }} />
            </motion.div>
          </motion.div>

          {/* Center icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${USER_COLOR}40, ${FRIEND_COLOR}40)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CompareArrows style={{ fontSize: 32, color: 'white' }} />
          </motion.div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              color: textPrimary,
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              marginBottom: '8px',
            }}
          >
            Berechne Match...
          </motion.p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            Analysiere eure Geschmäcker
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const scoreColor = getScoreColor(result.overallMatch);
  const cardBg = `rgba(255, 255, 255, 0.04)`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bgDefault,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Decorative background gradients */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-20%',
            width: '60%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${USER_COLOR}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '-20%',
            width: '60%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${FRIEND_COLOR}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0%',
            left: '30%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${primaryColor}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div style={{ paddingBottom: '100px', position: 'relative', zIndex: 1 }}>
      {/* Premium Glassmorphism Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `${bgDefault}90`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <BackButton />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AutoAwesome style={{ fontSize: 18, color: ACCENT_COLORS.match }} />
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Taste Match
          </h1>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          style={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${primaryColor}20, ${ACCENT_COLORS.match}20)`,
            border: `1px solid ${primaryColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: textPrimary,
            boxShadow: `0 4px 15px ${primaryColor}20`,
          }}
        >
          <Share style={{ fontSize: 20 }} />
        </motion.button>
      </motion.div>

      {/* Premium Score Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '20px 20px 32px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Multi-layered glow */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: scoreColor,
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }}
        />

        {/* Premium Avatars with connecting line */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Connecting gradient line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '3px',
              background: `linear-gradient(90deg, ${USER_COLOR}, transparent, ${FRIEND_COLOR})`,
              borderRadius: '2px',
              opacity: 0.5,
            }}
          />

          <motion.div
            initial={{ x: -40, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: USER_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: 'white',
              border: '3px solid rgba(255,255,255,0.25)',
              overflow: 'hidden',
              boxShadow: `0 8px 30px ${USER_COLOR}50`,
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${ACCENT_COLORS.match}30, ${ACCENT_COLORS.match}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${ACCENT_COLORS.match}40`,
              boxShadow: `0 0 20px ${ACCENT_COLORS.match}40`,
            }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Favorite style={{ fontSize: 22, color: ACCENT_COLORS.match }} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ x: 40, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: FRIEND_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: 'white',
              border: '3px solid rgba(255,255,255,0.25)',
              overflow: 'hidden',
              boxShadow: `0 8px 30px ${FRIEND_COLOR}50`,
            }}
          >
            {friendPhoto ? (
              <img src={friendPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              friendName.charAt(0).toUpperCase()
            )}
          </motion.div>
        </div>

        {/* Names with gradient pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: '6px 14px',
              background: `${USER_COLOR}20`,
              borderRadius: '12px',
              color: USER_COLOR,
              fontWeight: 700,
              fontSize: 14,
              border: `1px solid ${USER_COLOR}30`,
            }}
          >
            {userName}
          </motion.span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>×</span>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: '6px 14px',
              background: `${FRIEND_COLOR}20`,
              borderRadius: '12px',
              color: FRIEND_COLOR,
              fontWeight: 700,
              fontSize: 14,
              border: `1px solid ${FRIEND_COLOR}30`,
            }}
          >
            {friendName}
          </motion.span>
        </div>

        {/* Premium Score Display */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          style={{ position: 'relative', zIndex: 1, marginBottom: '8px' }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              background: getCompatibilityGradient(result.overallMatch),
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              textShadow: `0 0 40px ${scoreColor}60`,
              filter: `drop-shadow(0 4px 20px ${scoreColor}50)`,
            }}
          >
            <AnimatedCounter value={result.overallMatch} />
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.5)',
              marginLeft: '2px',
            }}
          >
            %
          </span>
        </motion.div>

        {/* Score message with badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            background: `${scoreColor}15`,
            borderRadius: '20px',
            border: `1px solid ${scoreColor}30`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {result.overallMatch >= 60 && (
            <LocalFireDepartment style={{ fontSize: 18, color: scoreColor }} />
          )}
          <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>
            {getScoreMessage(result.overallMatch)}
          </span>
        </motion.div>
      </motion.div>

      {/* Premium Stat Rings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        padding: '0 12px 28px',
      }}>
        <StatRing icon={<Tv style={{ fontSize: 22 }} />} label="Serien" score={result.seriesOverlap.score} color={ACCENT_COLORS.series} delay={0.1} bgColor={cardBg} />
        <StatRing icon={<Movie style={{ fontSize: 22 }} />} label="Filme" score={result.movieOverlap.score} color={ACCENT_COLORS.movies} delay={0.2} bgColor={cardBg} />
        <StatRing icon={<Category style={{ fontSize: 22 }} />} label="Genres" score={result.genreMatch.score} color={ACCENT_COLORS.genres} delay={0.3} bgColor={cardBg} />
        <StatRing icon={<Star style={{ fontSize: 22 }} />} label="Ratings" score={result.ratingMatch.score} color={ACCENT_COLORS.ratings} delay={0.4} bgColor={cardBg} />
      </div>

      {/* Premium Tabs - Mobile Optimized */}
      <div style={{ padding: '0 16px 20px', overflow: 'visible' }}>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'visible',
          }}
        >
          {[
            { id: 'overview', label: 'Übersicht', color: primaryColor, icon: <Category style={{ fontSize: 16 }} /> },
            { id: 'series', label: `Serien (${result.seriesOverlap.sharedSeries.length})`, color: ACCENT_COLORS.series, icon: <Tv style={{ fontSize: 16 }} /> },
            { id: 'movies', label: `Filme (${result.movieOverlap.sharedMovies.length})`, color: ACCENT_COLORS.movies, icon: <Movie style={{ fontSize: 16 }} /> },
            { id: 'genres', label: 'Genres', color: ACCENT_COLORS.genres, icon: <Star style={{ fontSize: 16 }} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  flex: isActive ? 'none' : 1,
                  minWidth: isActive ? 'auto' : '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: isActive ? '10px 16px' : '10px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive
                    ? `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`
                    : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? `0 4px 12px ${tab.color}35` : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {tab.icon}
                {isActive && <span>{tab.label}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Premium Content */}
      <div style={{ padding: '0 16px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Shared Providers - Premium Card */}
              {result.providerMatch.sharedProviders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: cardBg,
                    borderRadius: '20px',
                    padding: '18px',
                    marginBottom: '16px',
                    border: `1px solid ${ACCENT_COLORS.providers}25`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.15)`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative glow */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-20%',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${ACCENT_COLORS.providers}20, transparent 70%)`,
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 14,
                    color: ACCENT_COLORS.providers,
                    marginBottom: '14px',
                    fontWeight: 700,
                    position: 'relative',
                  }}>
                    <Tv style={{ fontSize: 18 }} />
                    Gemeinsame Streaming-Dienste
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative' }}>
                    {result.providerMatch.sharedProviders.map((provider, idx) => (
                      <motion.span
                        key={provider}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          padding: '8px 16px',
                          background: `linear-gradient(135deg, ${ACCENT_COLORS.providers}25, ${ACCENT_COLORS.providers}15)`,
                          borderRadius: '12px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'white',
                          border: `1px solid ${ACCENT_COLORS.providers}35`,
                        }}
                      >
                        {provider}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Premium Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { value: result.seriesOverlap.sharedSeries.length, label: 'Gemeinsame Serien', color: ACCENT_COLORS.series, icon: <Tv style={{ fontSize: 20 }} />, delay: 0.1 },
                  { value: result.movieOverlap.sharedMovies.length, label: 'Gemeinsame Filme', color: ACCENT_COLORS.movies, icon: <Movie style={{ fontSize: 20 }} />, delay: 0.15 },
                  { value: result.genreMatch.sharedGenres.filter((g) => g.userPercentage > 0 && g.friendPercentage > 0).length, label: 'Gemeinsame Genres', color: ACCENT_COLORS.genres, icon: <Category style={{ fontSize: 20 }} />, delay: 0.2 },
                  { value: result.ratingMatch.sameRatingCount, label: 'Gleiche Bewertungen', color: ACCENT_COLORS.ratings, icon: <Star style={{ fontSize: 20 }} />, delay: 0.25 },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: stat.delay, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    style={{
                      background: cardBg,
                      borderRadius: '18px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      border: `1px solid ${stat.color}20`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.1)`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Subtle glow background */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${stat.color}15, transparent 70%)`,
                        filter: 'blur(10px)',
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: `${stat.color}20`,
                        color: stat.color,
                        marginBottom: '10px',
                      }}>
                        {stat.icon}
                      </div>
                      <div style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: stat.color,
                        lineHeight: 1,
                        marginBottom: '6px',
                        textShadow: `0 0 20px ${stat.color}40`,
                      }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'series' && (
            <motion.div
              key="series"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {result.seriesOverlap.sharedSeries.length > 0 ? (
                <>
                  {/* Section header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: cardBg,
                    borderRadius: '14px',
                    border: `1px solid ${ACCENT_COLORS.series}20`,
                  }}>
                    <Tv style={{ fontSize: 20, color: ACCENT_COLORS.series }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {result.seriesOverlap.sharedSeries.length} gemeinsame Serien
                    </span>
                    {result.seriesOverlap.sharedSeries.filter(s => s.ratingDiff !== undefined && s.ratingDiff < 1).length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: 12,
                        color: ACCENT_COLORS.match,
                        padding: '4px 10px',
                        background: `${ACCENT_COLORS.match}15`,
                        borderRadius: '8px',
                      }}>
                        <Favorite style={{ fontSize: 12 }} />
                        {result.seriesOverlap.sharedSeries.filter(s => s.ratingDiff !== undefined && s.ratingDiff < 1).length} perfekte Matches
                      </span>
                    )}
                  </div>
                  {result.seriesOverlap.sharedSeries.map((item, i) => (
                    <SharedItemCard key={item.id} item={item} index={i} type="series" bgColor={cardBg} />
                  ))}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 30px',
                    background: cardBg,
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `${ACCENT_COLORS.series}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Tv style={{ fontSize: 36, color: ACCENT_COLORS.series, opacity: 0.6 }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 500, margin: 0 }}>
                    Keine gemeinsamen Serien
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '8px 0 0' }}>
                    Schaut ihr verschiedene Serien?
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'movies' && (
            <motion.div
              key="movies"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {result.movieOverlap.sharedMovies.length > 0 ? (
                <>
                  {/* Section header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: cardBg,
                    borderRadius: '14px',
                    border: `1px solid ${ACCENT_COLORS.movies}20`,
                  }}>
                    <Movie style={{ fontSize: 20, color: ACCENT_COLORS.movies }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {result.movieOverlap.sharedMovies.length} gemeinsame Filme
                    </span>
                    {result.movieOverlap.sharedMovies.filter(m => m.ratingDiff !== undefined && m.ratingDiff < 1).length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: 12,
                        color: ACCENT_COLORS.match,
                        padding: '4px 10px',
                        background: `${ACCENT_COLORS.match}15`,
                        borderRadius: '8px',
                      }}>
                        <Favorite style={{ fontSize: 12 }} />
                        {result.movieOverlap.sharedMovies.filter(m => m.ratingDiff !== undefined && m.ratingDiff < 1).length} perfekte Matches
                      </span>
                    )}
                  </div>
                  {result.movieOverlap.sharedMovies.map((item, i) => (
                    <SharedItemCard key={item.id} item={item} index={i} type="movie" bgColor={cardBg} />
                  ))}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 30px',
                    background: cardBg,
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `${ACCENT_COLORS.movies}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Movie style={{ fontSize: 36, color: ACCENT_COLORS.movies, opacity: 0.6 }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 500, margin: 0 }}>
                    Keine gemeinsamen Filme
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '8px 0 0' }}>
                    Schaut ihr verschiedene Filme?
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'genres' && (
            <motion.div
              key="genres"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Premium Legend Card */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '32px',
                  marginBottom: '20px',
                  padding: '14px 20px',
                  background: cardBg,
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '8px',
                    background: USER_GRADIENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${USER_COLOR}40`,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>
                      {userName.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: USER_COLOR, fontWeight: 600 }}>{userName}</span>
                </div>
                <div style={{
                  width: 1,
                  height: 24,
                  background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '8px',
                    background: FRIEND_GRADIENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${FRIEND_COLOR}40`,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>
                      {friendName.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: FRIEND_COLOR, fontWeight: 600 }}>{friendName}</span>
                </div>
              </motion.div>

              {/* Genre comparison section header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '0 4px',
              }}>
                <Category style={{ fontSize: 18, color: ACCENT_COLORS.genres }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  Genre-Vergleich
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  {result.genreMatch.sharedGenres.filter((g) => g.userPercentage > 0 || g.friendPercentage > 0).length} Genres
                </span>
              </div>

              {result.genreMatch.sharedGenres
                .filter((g) => g.userPercentage > 0 || g.friendPercentage > 0)
                .slice(0, 12)
                .map((genre, i) => (
                  <GenreBar key={genre.genre} genre={genre} index={i} userName={userName} friendName={friendName} bgColor={cardBg} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
};

export default TasteMatchPage;
