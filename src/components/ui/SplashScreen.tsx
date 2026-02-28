import { Box, keyframes, styled } from '@mui/material';
import { useEffect, useState } from 'react';

// ============= MODERN ANIMATIONS =============

// Smooth fade in
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Logo entrance animation
const logoEntrance = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(180deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) rotate(180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`;

// Subtle breathing effect
const breathe = keyframes`
  0%, 100% {
    transform: scale(1) rotate(180deg);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.03) rotate(180deg);
    filter: brightness(1.1);
  }
`;

// Fade out animation
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Removed unused gradientShift animation

// Glow pulse animation
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3),
                0 0 40px rgba(236, 72, 153, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.5),
                0 0 60px rgba(236, 72, 153, 0.2);
  }
`;

// Text reveal animation
const textReveal = keyframes`
  0% {
    opacity: 0;
    letter-spacing: 20px;
    filter: blur(10px);
  }
  50% {
    opacity: 0.5;
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    letter-spacing: 10px;
    filter: blur(0);
  }
`;

// Progress bar shine
const progressShine = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
`;

// Particle animation
const particleFloat = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
`;

// ============= STYLED COMPONENTS =============

const SplashContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isHiding',
})<{ isHiding: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    #0a0a0a 0%,
    #1a1a1a 25%,
    #0f0f0f 50%,
    #1a1a1a 75%,
    #0a0a0a 100%
  );
  animation: ${(props) => (props.isHiding ? fadeOut : fadeIn)}
    ${(props) => (props.isHiding ? '0.5s' : '0.8s')} ease-out forwards;
  overflow: hidden;
`;

// Static background with gradient mesh - no animation to prevent flickering
const BackgroundMesh = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(168, 85, 247, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.03) 0%, transparent 50%);
  pointer-events: none;
`;

// Floating particles
const Particle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'delay' && prop !== 'left',
})<{ delay: number; left: string }>`
  position: absolute;
  width: 2px;
  height: 2px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(236, 72, 153, 0.8));
  left: ${(props) => props.left};
  border-radius: 50%;
  animation: ${particleFloat} 15s linear infinite;
  animation-delay: ${(props) => props.delay}s;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
`;

// Modern logo container with glow
const LogoContainer = styled(Box)`
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
  }
`;

// Glowing orb behind logo
const LogoGlow = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(168, 85, 247, 0.3) 0%,
    rgba(236, 72, 153, 0.1) 40%,
    transparent 70%
  );
  filter: blur(20px);
  animation: ${glowPulse} 3s ease-in-out infinite;
`;

// SVG Logo with animation
const LogoSVG = styled('svg')`
  width: 80%;
  height: 80%;
  position: relative;
  z-index: 1;
  animation:
    ${logoEntrance} 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
    ${breathe} 3s ease-in-out infinite;
  animation-delay: 0s, 1.2s;
  filter: drop-shadow(0 10px 40px rgba(168, 85, 247, 0.4));

  path {
    fill: url(#goldGradient);
  }
`;

// Modern title with static gradient - no animation to prevent flickering
const Title = styled('h1')`
  font-size: 4rem;
  font-weight: 200;
  margin: 0 0 15px 0;
  background: linear-gradient(
    135deg,
    #a855f7 0%,
    #ec4899 25%,
    #f97316 50%,
    #ec4899 75%,
    #a855f7 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  animation: ${textReveal} 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: 0.3s;
  opacity: 0;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

// Stylish subtitle
const Subtitle = styled('p')`
  font-size: 1rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 8px;
  margin: 0 0 80px 0;
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  animation: ${fadeIn} 1s ease-out 0.6s backwards;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #a855f7, transparent);
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
    letter-spacing: 5px;
  }
`;

// Modern progress container with glass effect
const ProgressWrapper = styled(Box)`
  position: relative;
  width: 350px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(168, 85, 247, 0.15);
  animation: ${fadeIn} 1s ease-out 0.8s backwards;

  @media (max-width: 768px) {
    width: 280px;
  }
`;

const ProgressContainer = styled(Box)`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'progress',
})<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #a855f7 100%);
  transform: scaleX(${(props) => props.progress});
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.6);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 50px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: ${progressShine} 2s linear infinite;
  }
`;

// Loading status with percentage
const LoadingStatus = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-family: 'Inter', sans-serif;
`;

const LoadingText = styled('p')`
  font-size: 0.75rem;
  color: #999;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0;
`;

const LoadingPercentage = styled('p')`
  font-size: 0.85rem;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 500;
  margin: 0;
  font-variant-numeric: tabular-nums;
`;

// Modern corner accents
const CornerAccent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'cornerPos',
})<{ cornerPos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }>`
  position: absolute;
  width: 60px;
  height: 60px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: linear-gradient(135deg, #a855f7, transparent);
    opacity: 0.3;
  }

  ${(props) => {
    switch (props.cornerPos) {
      case 'top-left':
        return `
          top: 30px;
          left: 30px;
          &::before {
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
          }
          &::after {
            top: 0;
            left: 0;
            width: 2px;
            height: 100%;
          }
        `;
      case 'top-right':
        return `
          top: 30px;
          right: 30px;
          &::before {
            top: 0;
            right: 0;
            width: 100%;
            height: 2px;
          }
          &::after {
            top: 0;
            right: 0;
            width: 2px;
            height: 100%;
          }
        `;
      case 'bottom-left':
        return `
          bottom: 30px;
          left: 30px;
          &::before {
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
          }
          &::after {
            bottom: 0;
            left: 0;
            width: 2px;
            height: 100%;
          }
        `;
      case 'bottom-right':
        return `
          bottom: 30px;
          right: 30px;
          &::before {
            bottom: 0;
            right: 0;
            width: 100%;
            height: 2px;
          }
          &::after {
            bottom: 0;
            right: 0;
            width: 2px;
            height: 100%;
          }
        `;
    }
  }}

  animation: ${fadeIn} 1s ease-out 1s backwards;
`;

interface SplashScreenProps {
  onComplete?: () => void;
  waitForCondition?: () => boolean;
  minDisplayTime?: number;
}

export const SplashScreen = ({ onComplete, waitForCondition }: SplashScreenProps) => {
  const [isHiding, setIsHiding] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initialisiere System');

  // Track real loading progress
  useEffect(() => {
    const startTime = Date.now();
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      clearInterval(checkProgress);
      setLoadingProgress(1);
      setLoadingText('Start');
      setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }, 400);
    };

    const checkProgress = setInterval(() => {
      const status = window.appReadyStatus || {};
      const totalSystems = 6;
      const readySystems = [
        status.theme,
        status.auth,
        status.firebase,
        status.emailVerification,
        status.initialData,
        status.homeConfig,
      ].filter(Boolean).length;

      const progress = readySystems / totalSystems;
      setLoadingProgress(progress);

      // Update loading text based on progress
      if (progress < 0.2) {
        setLoadingText('Initialisiere System');
      } else if (progress < 0.4) {
        setLoadingText('Lade Interface');
      } else if (progress < 0.6) {
        setLoadingText('Authentifizierung');
      } else if (progress < 0.8) {
        setLoadingText('Synchronisiere Daten');
      } else if (progress < 1) {
        setLoadingText('Finalisiere');
      } else {
        setLoadingText('Start');
      }

      // Complete when all systems ready
      if (progress >= 1) {
        finish();
        return;
      }

      // Complete when external condition is met (e.g. AppWithSplash fallback)
      if (waitForCondition?.()) {
        finish();
        return;
      }

      // Hard fallback: never hang longer than 4 seconds
      if (Date.now() - startTime > 4000) {
        finish();
      }
    }, 50);

    return () => clearInterval(checkProgress);
  }, [onComplete, waitForCondition]);

  return (
    <SplashContainer isHiding={isHiding}>
      <BackgroundMesh />

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <Particle key={i} delay={i * 3} left={`${20 + i * 15}%`} />
      ))}

      {/* Corner accents */}
      <CornerAccent cornerPos="top-left" />
      <CornerAccent cornerPos="top-right" />
      <CornerAccent cornerPos="bottom-left" />
      <CornerAccent cornerPos="bottom-right" />

      {/* Logo with glow */}
      <LogoContainer>
        <LogoGlow />
        <LogoSVG viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M388.3 902c-4-2.4-5.3-4.8-5.3-9.9 0-4.5-3.3-.3 38-48.1 14-16.2 27.9-32.3 30.8-35.7l5.3-6.2-3.1-3.9c-3.7-4.7-5.7-5.2-21.5-5.2-29.4 0-118.7-6-129-8.6-25.5-6.5-43.6-27.7-46.5-54.7-4.7-42.8-6.3-153.3-3-202.2 3.7-54.6 7-66.5 23-82.6 12.1-12.1 23.8-17.1 43.8-18.5 6.2-.5 9.2-1.1 9.2-1.9 0-.7-1.6-9.1-3.6-18.6-2.9-14.4-3.4-18-2.5-20.9 3.3-11.1 18.2-13.4 25.4-3.9 1.3 1.9 6.6 11.1 11.5 20.4 5 9.4 9.5 17.7 10 18.4.7 1.3 3.6 1.3 20.8.3 45.1-2.8 70.6-3.5 122.9-3.5 52.5-.1 97.2 1.4 126 4.2 6.5.7 9.3.6 10.1-.2.6-.7 5.7-9.7 11.3-20.2 12.1-22.6 13.9-24.7 21.4-25.3 6.5-.5 10.9 1.4 13.7 6.1 2.6 4.3 2.6 5.5-1.5 25.6-1.9 9.5-3.3 17.6-3 18 .2.5 3.9 1.1 8.2 1.5 18.1 1.6 32.8 7 42.6 15.7 9.7 8.5 18.2 23.6 20.8 37.2 5.4 27.9 7.4 137.5 4 211.2-2.1 43.5-3.2 50.4-10.2 63.6-8.4 15.6-25.1 27.4-44.8 31.4-10.6 2.2-60.9 5.3-118.9 7.4l-22.3.8-4.2 4.1c-3.1 3.1-3.9 4.6-3.2 5.6.6.7 16.8 19.5 36 41.6 19.3 22.1 35.5 41.2 36.2 42.4.7 1.1 1.2 3.8 1.3 5.9 0 3.1-.7 4.6-3.4 7.3-2.8 2.8-4.2 3.4-7.5 3.4-5.8 0-9.3-2.1-14.8-9-5.6-6.9-39.3-46.9-57.6-68.5-7.1-8.2-13.4-14.9-14-14.8-.7.1-5.7 1.1-11.2 2.3-12.5 2.7-31.7 2.3-43.2-.8l-7.3-2-9.2 11.2c-5 6.1-15.5 18.5-23.3 27.6-7.8 9.1-20.3 23.9-27.9 33-7.5 9.1-15.1 17.5-16.8 18.8-3.8 2.7-9.2 2.9-13.5.2zm164.2-148c31-1.4 64.3-3.9 69-5.1 15.5-4.2 28.1-18 30.5-33.5 4.7-30.4 4.7-183-.1-217.9-1.9-14.3-11.5-26.9-23.9-31.6-15.4-5.8-108.4-10.1-175.3-8-69.8 2.1-115.8 4.9-126.3 7.7-7.3 1.9-10.9 4.1-16.8 10.4-8.6 9.2-10.7 16.7-12.5 46-3.5 54.7-3 144.7 1 185 1.6 16.4 6.7 25.7 18.2 33.1 7.7 5 14.7 6.4 44.2 8.9 66 5.5 139.2 7.4 192 5zm168.2-53.1c4.1-2.5 9-9.7 9.9-14.5 1.5-8.2-3.9-18.5-11.9-22.5-5.8-3-14.8-3-20.4-.1-16.8 8.8-14 35 4.3 39.7 5.8 1.5 13.2.4 18.1-2.6zm-4-65c5.9-2.2 12.2-10.2 13.8-17.6 1-4.9-1.8-13.2-5.7-17-5.1-4.8-9-6.3-16.1-6.3-12.4 0-20.8 7.5-21.5 19.4-.3 4.9 0 7.1 1.6 10.2 2.5 4.8 6.6 8.8 11.2 10.8 4.1 1.8 12.7 2.1 16.7.5zm17.5-86.4c.8-1.9.8-3.1 0-5-1.3-2.8.5-2.7-31-2.7-17.6 0-19.2.4-19.2 5.1 0 5 .7 5.1 25.7 5.1l23.3 0 1.2-2.5zm-1-24.2c2.4-2.1 2.3-4.8-.2-7.3-1.9-1.9-3.3-2-23.7-2-23.7 0-25.3.4-25.3 6 0 4.8.8 5 24.9 5 19.5 0 22.7-.2 24.3-1.7zm0-24c2.2-2 2.3-5.1.1-7.5-1.5-1.6-3.6-1.8-23.6-1.8-19.1 0-22.3.2-23.9 1.7-2.3 2.1-2.4 6.9 0 8.2 1 .6 10.6 1.1 23.6 1.1 19 0 22.2-.2 23.8-1.7z" />
          <path d="M549.3 713.6l-2.8-2.4-.2-33.9c-.1-18.6.1-37.4.4-41.9l.6-8 7.6 1.4c11.7 2.2 27.2 0 43.4-6.3 1.6-.7 1.7 1.8 1.7 42.8 0 29.8-.4 44.4-1.1 46-1.9 4.2-4.7 4.7-26.4 4.7-20.1 0-20.4 0-23.2-2.4zM479.5 667.5l-2.5-2.4 0-80.9c0-78.2.1-81.1 1.9-83.3 1.8-2.2 2.8-2.4 12.5-2.7l10.7-.4-4.6 6.5c-16.9 24.3-19.4 55.1-6.4 81.4 6.8 13.8 19.5 27 32.5 34l5.6 3-.1 21.4-.1 21.4-2.6 2.3c-2.4 2.1-3.2 2.2-23.5 2.2-21 0-21 0-23.4-2.5zM411.2 628c-1.2-1.1-2.4-3.1-2.7-4.3-.3-1.2-.4-28.9-.3-61.5l.3-59.4 2.8-2.4c2.8-2.4 3.1-2.4 22.7-2.4 21.2 0 24 .5 25.9 4.7.8 1.7 1.1 20.6 1.1 62.4l0 60-2.5 2.4c-2.4 2.5-2.4 2.5-23.8 2.5-20 0-21.5-.1-23.5-2z" />
        </LogoSVG>
      </LogoContainer>

      {/* Title and subtitle */}
      <Title>TV-RANK</Title>
      <Subtitle>Serien & Filme im Blick</Subtitle>

      {/* Progress section with glass effect */}
      <ProgressWrapper>
        <ProgressContainer>
          <ProgressBar progress={loadingProgress} />
        </ProgressContainer>
        <LoadingStatus>
          <LoadingText>{loadingText}</LoadingText>
          <LoadingPercentage>{Math.round(loadingProgress * 100)}%</LoadingPercentage>
        </LoadingStatus>
      </ProgressWrapper>
    </SplashContainer>
  );
};
