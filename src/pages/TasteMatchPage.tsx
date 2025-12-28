/**
 * TasteMatchPage - Geschmacks-Vergleich zwischen zwei Usern
 * Premium Design mit Tabs
 */

import {
  Category,
  CompareArrows,
  Favorite,
  Movie,
  Share,
  Star,
  Tv,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
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

// Stat Ring
const StatRing: React.FC<{
  icon: React.ReactNode;
  label: string;
  score: number;
  color: string;
  delay: number;
}> = ({ icon, label, score, color, delay }) => {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
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
            transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
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
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{score}%</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{label}</div>
      </div>
    </motion.div>
  );
};

// Genre Bar
const GenreBar: React.FC<{ genre: GenreComparison; index: number; userName: string; friendName: string }> = ({
  genre,
  index,
  userName,
  friendName,
}) => {
  const maxPct = Math.max(genre.userPercentage, genre.friendPercentage, 15);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      style={{
        marginBottom: '14px',
        padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: '12px' }}>
        {genre.genre}
      </div>

      {/* User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: 24, fontSize: 11, color: USER_COLOR, fontWeight: 500 }}>{userName.slice(0, 3)}</div>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.userPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.1, duration: 0.5 }}
            style={{
              height: '100%',
              background: USER_GRADIENT,
              borderRadius: 4,
            }}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: USER_COLOR, minWidth: 36, textAlign: 'right' }}>
          {genre.userPercentage}%
        </span>
      </div>

      {/* Friend Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 24, fontSize: 11, color: FRIEND_COLOR, fontWeight: 500 }}>{friendName.slice(0, 3)}</div>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.friendPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.15, duration: 0.5 }}
            style={{
              height: '100%',
              background: FRIEND_GRADIENT,
              borderRadius: 4,
            }}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: FRIEND_COLOR, minWidth: 36, textAlign: 'right' }}>
          {genre.friendPercentage}%
        </span>
      </div>
    </motion.div>
  );
};

// Shared Item Card
const SharedItemCard: React.FC<{ item: SharedItem; index: number; type: 'series' | 'movie' }> = ({
  item,
  index,
  type,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/${type === 'series' ? 'series' : 'movie'}/${item.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '10px',
      }}
    >
      {item.poster ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${item.poster}`}
          alt={item.title}
          style={{
            width: 50,
            height: 75,
            borderRadius: 10,
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: 50,
            height: 75,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {type === 'series' ? (
            <Tv style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }} />
          ) : (
            <Movie style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }} />
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </div>
        {item.userRating !== undefined && item.friendRating !== undefined && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: 13 }}>
            <span style={{ color: USER_COLOR, fontWeight: 600 }}>{item.userRating.toFixed(1)}</span>
            <span style={{ color: FRIEND_COLOR, fontWeight: 600 }}>{item.friendRating.toFixed(1)}</span>
          </div>
        )}
      </div>
      {item.ratingDiff !== undefined && item.ratingDiff < 1 && (
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Favorite style={{ fontSize: 18, color: '#ff6b6b' }} />
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
  const bgSurface = currentTheme.background.surface;
  const textPrimary = currentTheme.text.primary;
  const borderColor = currentTheme.border.default;
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

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <CompareArrows style={{ fontSize: 56, color: ACCENT_COLORS.match }} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 500 }}
        >
          Berechne Match...
        </motion.p>
      </div>
    );
  }

  if (!result) return null;

  const scoreColor = getScoreColor(result.overallMatch);

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
      <div style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <BackButton />

        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: textPrimary }}>Taste Match</h1>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: bgSurface,
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: textPrimary,
          }}
        >
          <Share style={{ fontSize: 20 }} />
        </motion.button>
      </div>

      {/* Score Section */}
      <div style={{ padding: '10px 20px 30px', textAlign: 'center', position: 'relative' }}>
        {/* Glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: scoreColor,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Avatars */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: USER_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              border: '3px solid rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </motion.div>

          <Favorite style={{ fontSize: 24, color: ACCENT_COLORS.match }} />

          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: FRIEND_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              border: '3px solid rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}
          >
            {friendPhoto ? (
              <img src={friendPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              friendName.charAt(0).toUpperCase()
            )}
          </motion.div>
        </div>

        {/* Names */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <span style={{ color: USER_COLOR, fontWeight: 600, fontSize: 14 }}>{userName}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>&</span>
          <span style={{ color: FRIEND_COLOR, fontWeight: 600, fontSize: 14 }}>{friendName}</span>
        </div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            <AnimatedCounter value={result.overallMatch} />
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>%</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color: 'white', fontSize: 16, fontWeight: 500, marginTop: '8px', position: 'relative', zIndex: 1 }}
        >
          {getScoreMessage(result.overallMatch)}
        </motion.p>
      </div>

      {/* Stat Rings */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 10px 24px' }}>
        <StatRing icon={<Tv style={{ fontSize: 22 }} />} label="Serien" score={result.seriesOverlap.score} color={ACCENT_COLORS.series} delay={0.1} />
        <StatRing icon={<Movie style={{ fontSize: 22 }} />} label="Filme" score={result.movieOverlap.score} color={ACCENT_COLORS.movies} delay={0.2} />
        <StatRing icon={<Category style={{ fontSize: 22 }} />} label="Genres" score={result.genreMatch.score} color={ACCENT_COLORS.genres} delay={0.3} />
        <StatRing icon={<Star style={{ fontSize: 22 }} />} label="Ratings" score={result.ratingMatch.score} color={ACCENT_COLORS.ratings} delay={0.4} />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px 16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'overview', label: 'Übersicht', color: primaryColor },
          { id: 'series', label: `Serien (${result.seriesOverlap.sharedSeries.length})`, color: ACCENT_COLORS.series },
          { id: 'movies', label: `Filme (${result.movieOverlap.sharedMovies.length})`, color: ACCENT_COLORS.movies },
          { id: 'genres', label: 'Genres', color: ACCENT_COLORS.genres },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 18px',
              borderRadius: '20px',
              border: activeTab === tab.id ? 'none' : `1px solid ${tab.color}40`,
              background: activeTab === tab.id ? tab.color : 'transparent',
              color: activeTab === tab.id ? 'white' : tab.color,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Shared Providers */}
              {result.providerMatch.sharedProviders.length > 0 && (
                <div
                  style={{
                    background: `${ACCENT_COLORS.providers}10`,
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px',
                    border: `1px solid ${ACCENT_COLORS.providers}30`,
                  }}
                >
                  <div style={{ fontSize: 13, color: ACCENT_COLORS.providers, marginBottom: '12px', fontWeight: 500 }}>
                    Gemeinsame Streaming-Dienste
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.providerMatch.sharedProviders.map((provider) => (
                      <span
                        key={provider}
                        style={{
                          padding: '6px 14px',
                          background: `${ACCENT_COLORS.providers}20`,
                          borderRadius: '20px',
                          fontSize: 13,
                          color: 'white',
                          border: `1px solid ${ACCENT_COLORS.providers}40`,
                        }}
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: `${ACCENT_COLORS.series}15`,
                    borderRadius: '16px',
                    padding: '18px',
                    textAlign: 'center',
                    border: `1px solid ${ACCENT_COLORS.series}40`,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT_COLORS.series }}>
                    {result.seriesOverlap.sharedSeries.length}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Gemeinsame Serien</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: `${ACCENT_COLORS.movies}15`,
                    borderRadius: '16px',
                    padding: '18px',
                    textAlign: 'center',
                    border: `1px solid ${ACCENT_COLORS.movies}40`,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT_COLORS.movies }}>
                    {result.movieOverlap.sharedMovies.length}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Gemeinsame Filme</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: `${ACCENT_COLORS.genres}15`,
                    borderRadius: '16px',
                    padding: '18px',
                    textAlign: 'center',
                    border: `1px solid ${ACCENT_COLORS.genres}40`,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT_COLORS.genres }}>
                    {result.genreMatch.sharedGenres.filter((g) => g.userPercentage > 0 && g.friendPercentage > 0).length}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Gemeinsame Genres</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: `${ACCENT_COLORS.ratings}15`,
                    borderRadius: '16px',
                    padding: '18px',
                    textAlign: 'center',
                    border: `1px solid ${ACCENT_COLORS.ratings}40`,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT_COLORS.ratings }}>
                    {result.ratingMatch.sameRatingCount}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Gleiche Bewertungen</div>
                </motion.div>
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
                result.seriesOverlap.sharedSeries.map((item, i) => (
                  <SharedItemCard key={item.id} item={item} index={i} type="series" />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.5)' }}>
                  <Tv style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }} />
                  <p>Keine gemeinsamen Serien</p>
                </div>
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
                result.movieOverlap.sharedMovies.map((item, i) => (
                  <SharedItemCard key={item.id} item={item} index={i} type="movie" />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.5)' }}>
                  <Movie style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }} />
                  <p>Keine gemeinsamen Filme</p>
                </div>
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
              {/* Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  marginBottom: '20px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 14, height: 8, borderRadius: 4, background: USER_GRADIENT }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{userName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 14, height: 8, borderRadius: 4, background: FRIEND_GRADIENT }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{friendName}</span>
                </div>
              </div>

              {result.genreMatch.sharedGenres
                .filter((g) => g.userPercentage > 0 || g.friendPercentage > 0)
                .slice(0, 12)
                .map((genre, i) => (
                  <GenreBar key={genre.genre} genre={genre} index={i} userName={userName} friendName={friendName} />
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
