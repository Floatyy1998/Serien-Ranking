import { Notifications, Search } from '@mui/icons-material';
import { Badge, Chip } from '@mui/material';
import { Movie as MovieIcon, NewReleases, PlayCircle, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HorizontalScrollContainer } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { getGreeting } from '../../../lib/text/greetings';
import { LiveClock } from '../LiveClock';

interface GreetingSectionProps {
  displayName: string | undefined;
  photoURL: string | undefined;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  watchedEpisodes: number;
  totalMovies: number;
  progress: number;
  todayEpisodes: number;
}

export const GreetingSection = React.memo(function GreetingSection({
  displayName,
  photoURL,
  totalUnreadBadge,
  onNotificationsOpen,
  watchedEpisodes,
  totalMovies,
  progress,
  todayEpisodes,
}: GreetingSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [greetingInfo, setGreetingInfo] = useState<string | null>(null);

  const greeting = useMemo(() => getGreeting(currentHour), [currentHour]);

  // Update greeting only when hour changes
  useEffect(() => {
    const timer = setInterval(() => {
      const hour = new Date().getHours();
      setCurrentHour((prev) => (prev !== hour ? hour : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close tooltip when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.greeting-text') && !target.closest('.greeting-tooltip')) {
        setGreetingInfo(null);
      }
    };

    if (greetingInfo) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [greetingInfo]);

  return (
    <>
      {/* Tooltip - shows language info and is clickable */}
      {greetingInfo && (
        <div
          className="greeting-tooltip"
          onClick={async (e) => {
            e.stopPropagation();
            if (greeting.title && greeting.type) {
              try {
                const apiKey = import.meta.env.VITE_API_TMDB;
                const searchUrl = `https://api.themoviedb.org/3/search/${greeting.type}?api_key=${apiKey}&query=${encodeURIComponent(greeting.title)}&language=de-DE`;
                const response = await fetch(searchUrl);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                  const result = data.results[0];
                  const routeType = greeting.type === 'tv' ? 'series' : 'movie';
                  navigate(`/${routeType}/${result.id}`);
                  setGreetingInfo(null);
                }
              } catch (error) {
                console.error('Error searching TMDB:', error);
              }
            }
          }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: currentTheme.text.secondary,
            pointerEvents: 'auto',
            cursor: greeting.title ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: '#ffffff' }}>
            {greetingInfo}
            {greeting.title && ' \u2192'}
          </span>
        </div>
      )}

      {/* Premium Header */}
      <header
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}40 0%, ${currentTheme.primary}10 50%, transparent 100%)`,
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <GradientText
              as="h1"
              from={currentTheme.primary}
              to={currentTheme.accent}
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                margin: '0 0 4px 0',
              }}
            >
              <span
                className="greeting-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setGreetingInfo(greetingInfo ? null : greeting.lang);
                }}
                style={{
                  cursor: 'pointer',
                  textDecoration: greeting.title ? 'underline dotted' : 'none',
                  textDecorationColor: currentTheme.primary,
                  textUnderlineOffset: '3px',
                }}
              >
                {greeting.text}
              </span>
              , {displayName?.split(' ')[0] || 'User'}!
            </GradientText>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '15px',
                margin: 0,
              }}
            >
              <LiveClock />
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {totalUnreadBadge > 0 ? (
              <Badge
                badgeContent={totalUnreadBadge}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: `linear-gradient(135deg, ${currentTheme.status?.error || '#ef4444'} 0%, ${currentTheme.status?.error || '#ef4444'} 100%)`,
                  },
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onNotificationsOpen}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${currentTheme.primary}1A`,
                    border: `1px solid ${currentTheme.primary}33`,
                    color: currentTheme.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Notifications style={{ fontSize: '20px' }} />
                </motion.button>
              </Badge>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNotificationsOpen}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${currentTheme.primary}1A`,
                  border: `1px solid ${currentTheme.primary}33`,
                  color: currentTheme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Notifications style={{ fontSize: '20px' }} />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `url(${photoURL}) center/cover`,
                border: `2px solid ${currentTheme.primary}`,
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/search')}
          style={{
            background: `${currentTheme.background.surface}`,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Search style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          <span style={{ color: currentTheme.text.muted, fontSize: '15px' }}>
            Suche nach Serien oder Filmen
          </span>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <HorizontalScrollContainer
        gap={8}
        style={{
          padding: '0 20px',
          marginBottom: '20px',
        }}
      >
        <Chip
          icon={<PlayCircle />}
          label={`${watchedEpisodes} Eps. gesamt`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.status.success}1A`,
            border: `1px solid ${currentTheme.status.success}4D`,
            color: currentTheme.status.success,
          }}
        />
        <Chip
          icon={<MovieIcon />}
          label={`${totalMovies} Filme`}
          onClick={() => navigate('/ratings?tab=movies')}
          style={{
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}4D`,
            color: currentTheme.status.error,
          }}
        />
        <Chip
          icon={<TrendingUp />}
          label={`${progress}% aktive Serien`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.primary}1A`,
            border: `1px solid ${currentTheme.primary}4D`,
            color: currentTheme.primary,
          }}
        />
        {todayEpisodes > 0 && (
          <Chip
            icon={<NewReleases />}
            label={`${todayEpisodes} Heute`}
            onClick={() => navigate('/calendar')}
            style={{
              background: `${currentTheme.status.warning}1A`,
              border: `1px solid ${currentTheme.status.warning}4D`,
              color: currentTheme.status.warning,
            }}
          />
        )}
      </HorizontalScrollContainer>
    </>
  );
});
