import { Box, keyframes, styled } from '@mui/material';

// ============= MODERN ANIMATIONS =============

// Smooth fade in
export const fadeIn = keyframes`
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

// Glow pulse animation
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3),
                0 0 40px rgba(236, 72, 153, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.5),
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

export const SplashContainer = styled(Box, {
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
    #06090f 0%,
    #0e1420 25%,
    #080c14 50%,
    #0e1420 75%,
    #06090f 100%
  );
  animation: ${(props) => (props.isHiding ? fadeOut : fadeIn)}
    ${(props) => (props.isHiding ? '0.5s' : '0.8s')} ease-out forwards;
  overflow: hidden;
`;

// Static background with gradient mesh - no animation to prevent flickering
export const BackgroundMesh = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.04) 0%, transparent 50%);
  pointer-events: none;
`;

// Floating particles
export const Particle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'delay' && prop !== 'left',
})<{ delay: number; left: string }>`
  position: absolute;
  width: 2px;
  height: 2px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
  left: ${(props) => props.left};
  border-radius: 50%;
  animation: ${particleFloat} 15s linear infinite;
  animation-delay: ${(props) => props.delay}s;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
`;

// Modern logo container with glow
export const LogoContainer = styled(Box)`
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
export const LogoGlow = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(236, 72, 153, 0.1) 40%,
    transparent 70%
  );
  filter: blur(24px);
  animation: ${glowPulse} 3s ease-in-out infinite;
`;

// SVG Logo with animation
export const LogoSVG = styled('svg')`
  width: 80%;
  height: 80%;
  position: relative;
  z-index: 1;
  animation:
    ${logoEntrance} 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
    ${breathe} 3s ease-in-out infinite;
  animation-delay: 0s, 1.2s;
  filter: drop-shadow(0 10px 40px rgba(139, 92, 246, 0.4));

  path {
    fill: url(#goldGradient);
  }
`;

// Modern title with static gradient - no animation to prevent flickering
export const Title = styled('h1')`
  font-size: 4rem;
  font-weight: 800;
  margin: 0 0 15px 0;
  background: linear-gradient(
    135deg,
    #8b5cf6 0%,
    #ec4899 25%,
    #f97316 50%,
    #ec4899 75%,
    #8b5cf6 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  font-family: var(--font-display), 'Inter', 'Helvetica Neue', sans-serif;
  animation: ${textReveal} 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: 0.3s;
  opacity: 0;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

// Stylish subtitle
export const Subtitle = styled('p')`
  font-size: 1rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 8px;
  margin: 0 0 80px 0;
  font-family: var(--font-display), 'Inter', sans-serif;
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
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent);
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
    letter-spacing: 5px;
  }
`;

// Modern progress container with glass effect
export const ProgressWrapper = styled(Box)`
  position: relative;
  width: 350px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  animation: ${fadeIn} 1s ease-out 0.8s backwards;

  @media (max-width: 768px) {
    width: 280px;
  }
`;

export const ProgressContainer = styled(Box)`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

export const ProgressBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'progress',
})<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #8b5cf6 100%);
  transform: scaleX(${(props) => props.progress});
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);

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
export const LoadingStatus = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-family: var(--font-display), 'Inter', sans-serif;
`;

export const LoadingText = styled('p')`
  font-size: 0.75rem;
  color: #999;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0;
`;

export const LoadingPercentage = styled('p')`
  font-size: 0.85rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 500;
  margin: 0;
  font-variant-numeric: tabular-nums;
`;

// Modern corner accents
export const CornerAccent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'cornerPos',
})<{ cornerPos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }>`
  position: absolute;
  width: 60px;
  height: 60px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), transparent);
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
