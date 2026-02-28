/**
 * TopProvidersSlide - Zeigt die Top-Streaming-Dienste des Jahres mit Animationen
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TopProviderEntry } from '../../types/Wrapped';

interface TopProvidersSlideProps {
  topProviders: TopProviderEntry[];
  maxItems?: number;
}

// Provider-Logos von TMDB
const PROVIDER_LOGOS: Record<string, string> = {
  Netflix: 'https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
  'Amazon Prime Video': 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
  'Disney Plus': 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg',
  'Disney+': 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg',
  'Apple TV+': 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  'Apple TV Plus': 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  Crunchyroll: 'https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg',
  'HBO Max': 'https://image.tmdb.org/t/p/original/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg',
  Max: 'https://image.tmdb.org/t/p/original/6Q3ZYKV3x4mfyEjiHOFhUFoIwor.jpg',
  'Paramount+': 'https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg',
  'Paramount Plus': 'https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg',
  Sky: 'https://image.tmdb.org/t/p/original/1UrT2H9x6DuQ9ytNhsSCUFtTUwS.jpg',
  WOW: 'https://image.tmdb.org/t/p/original/1UrT2H9x6DuQ9ytNhsSCUFtTUwS.jpg',
  'RTL+': 'https://image.tmdb.org/t/p/original/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg',
  'Joyn Plus+': 'https://image.tmdb.org/t/p/original/2joD3S2goOB6lmepX2IqRpCRe6a.jpg',
  MagentaTV: 'https://image.tmdb.org/t/p/original/t2P3qlP2sYT3b91hnRMKMSX8XmH.jpg',
};

// Provider-Farben
const PROVIDER_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Amazon Prime Video': '#00A8E1',
  'Disney Plus': '#113CCF',
  'Disney+': '#113CCF',
  'Apple TV+': '#000000',
  Crunchyroll: '#F47521',
  'HBO Max': '#5822B4',
  Max: '#002BE7',
  'Paramount+': '#0064FF',
  Sky: '#0072CE',
  WOW: '#FF6B00',
  'RTL+': '#E3001B',
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Min`;
  if (mins === 0) return `${hours} Std`;
  return `${hours} Std ${mins} Min`;
}

export const TopProvidersSlide: React.FC<TopProvidersSlideProps> = ({
  topProviders,
  maxItems = 5,
}) => {
  const displayProviders = topProviders.slice(0, maxItems);

  if (displayProviders.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ fontSize: '4rem', marginBottom: '20px' }}
          >
            📺
          </motion.div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>Keine Streaming-Daten</h2>
          <p style={{ opacity: 0.6, marginTop: '10px' }}>
            Markiere Serien mit ihrem Streaming-Dienst
          </p>
        </div>
      </div>
    );
  }

  const topProvider = displayProviders[0];
  const hasLogo = PROVIDER_LOGOS[topProvider.name];
  const providerColor = PROVIDER_COLORS[topProvider.name] || '#667eea';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${providerColor}22 0%, #1a1a2e 50%, #0f0f1a 100%)`,
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Glow Background */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${providerColor}44 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          textAlign: 'center',
          fontSize: '0.9rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        Dein Lieblings-Streaming-Dienst
      </motion.p>

      {/* Top Provider - Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px',
          zIndex: 1,
        }}
      >
        {hasLogo ? (
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: `0 20px 60px ${providerColor}66, 0 0 40px ${providerColor}33`,
              marginBottom: '20px',
            }}
          >
            <img
              src={hasLogo}
              alt={topProvider.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              fontSize: '5rem',
              marginBottom: '20px',
            }}
          >
            📺
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            color: 'white',
            fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {topProvider.name}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginTop: '15px',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '10px 25px',
            }}
          >
            <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {formatMinutes(topProvider.minutesWatched)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginLeft: '8px' }}>
              gestreamt
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            {topProvider.episodeCount > 0 && `${topProvider.episodeCount} Episoden`}
            {topProvider.episodeCount > 0 && topProvider.movieCount > 0 && ' + '}
            {topProvider.movieCount > 0 && `${topProvider.movieCount} Filme`}
          </p>
        </motion.div>
      </motion.div>

      {/* Remaining Providers */}
      {displayProviders.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1,
          }}
        >
          {displayProviders.slice(1).map((provider, index) => {
            const logo = PROVIDER_LOGOS[provider.name];
            const color = PROVIDER_COLORS[provider.name] || '#667eea';

            return (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                {/* Rank Badge */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background:
                      index === 0 ? '#C0C0C0' : index === 1 ? '#CD7F32' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {index + 2}
                </div>

                {/* Logo */}
                {logo ? (
                  <img
                    src={logo}
                    alt={provider.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}
                  >
                    📺
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: 'white',
                      fontWeight: '500',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {provider.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>
                    {formatMinutes(provider.minutesWatched)}
                  </p>
                </div>

                {/* Percentage Bar */}
                <div
                  style={{
                    width: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                    {provider.percentage}%
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${provider.percentage}%` }}
                      transition={{ delay: 1.3 + index * 0.1, duration: 0.6 }}
                      style={{
                        height: '100%',
                        background: color,
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default TopProvidersSlide;
