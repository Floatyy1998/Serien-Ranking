import React, { useEffect, useState } from 'react';
import { Box, keyframes, styled } from '@mui/material';

// ============= VINTAGE FILM ANIMATIONS =============

// Heavy film grain and scratches
const filmGrain = keyframes`
  0%, 100% {
    background-position: 0 0, 0 0, 0 0;
  }
  10% {
    background-position: -3% 5%, 5% -5%, -5% 3%;
  }
  20% {
    background-position: 3% -3%, -5% 5%, 5% -5%;
  }
  30% {
    background-position: -5% -3%, 3% 3%, -3% -3%;
  }
  40% {
    background-position: 5% 5%, -3% -3%, 3% 5%;
  }
  50% {
    background-position: -3% 0, 0 3%, -5% -5%;
  }
  60% {
    background-position: 3% -5%, 5% 0, 0 3%;
  }
  70% {
    background-position: 0 3%, -3% -5%, 5% 0;
  }
  80% {
    background-position: -5% 0, 0 -3%, 3% 5%;
  }
  90% {
    background-position: 5% -3%, -5% 3%, 0 0;
  }
`;

// Heavy flicker like old projectors
const vintageFlicker = keyframes`
  0% {
    opacity: 1;
    filter: brightness(1) contrast(1);
  }
  10% {
    opacity: 0.96;
    filter: brightness(1.1) contrast(1.05);
  }
  20% {
    opacity: 0.98;
    filter: brightness(0.95) contrast(1.02);
  }
  30% {
    opacity: 0.93;
    filter: brightness(1.05) contrast(0.98);
  }
  40% {
    opacity: 0.97;
    filter: brightness(0.98) contrast(1.03);
  }
  50% {
    opacity: 0.94;
    filter: brightness(1.02) contrast(0.97);
  }
  60% {
    opacity: 0.99;
    filter: brightness(0.97) contrast(1.01);
  }
  70% {
    opacity: 0.95;
    filter: brightness(1.03) contrast(0.99);
  }
  80% {
    opacity: 0.98;
    filter: brightness(0.99) contrast(1.02);
  }
  90% {
    opacity: 0.96;
    filter: brightness(1.01) contrast(0.98);
  }
  100% {
    opacity: 1;
    filter: brightness(1) contrast(1);
  }
`;

// Countdown circle wobble (faster rotation for 700ms)
const countdownWobble = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(0.98);
  }
  50% {
    transform: rotate(180deg) scale(1.02);
  }
  75% {
    transform: rotate(270deg) scale(0.99);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
`;

// Film burn effect
const filmBurn = keyframes`
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 0.03;
  }
`;

// Scratches animation
const scratchMove = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

// Film perforation scroll
const perforationScroll = keyframes`
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(50px);
  }
`;

// Vintage number appearance (dirty and worn)
const numberAppear = keyframes`
  0% {
    transform: scale(0.5) rotate(-8deg) skew(2deg, -2deg);
    opacity: 0;
    filter: blur(3px) brightness(0.5);
  }
  20% {
    transform: scale(1.4) rotate(5deg) skew(-1deg, 1deg);
    opacity: 0.9;
    filter: blur(0.5px) brightness(1.1);
  }
  40% {
    transform: scale(0.9) rotate(-2deg) skew(1deg, -1deg);
    opacity: 0.85;
    filter: blur(1px) brightness(0.9);
  }
  80% {
    transform: scale(0.95) rotate(-1deg) skew(-0.5deg, 0.5deg);
    opacity: 0.8;
    filter: blur(0.8px) brightness(0.95);
  }
  100% {
    transform: scale(0.7) rotate(4deg) skew(1deg, -1deg);
    opacity: 0;
    filter: blur(2px) brightness(0.6);
  }
`;

// Cinema curtain with wave effect
const curtainOpen = keyframes`
  0% {
    transform: scaleX(1) translateZ(0);
  }
  100% {
    transform: scaleX(0.05) translateZ(0);
  }
`;

// Subtle curtain wave
const curtainWave = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
`;

// Classic fade
const fadeToBlack = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

// Vignette pulse
const vignettePulse = keyframes`
  0%, 100% {
    box-shadow: inset 0 0 200px rgba(0, 0, 0, 0.9);
  }
  50% {
    box-shadow: inset 0 0 250px rgba(0, 0, 0, 0.95);
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
  background: #0a0a0a;
  animation: 
    ${vintageFlicker} 0.15s steps(10) infinite,
    ${vignettePulse} 4s ease-in-out infinite,
    ${props => props.isHiding ? fadeToBlack : 'none'} 0.8s ease-out forwards;
  overflow: hidden;
  box-shadow: inset 0 0 200px rgba(0, 0, 0, 0.9);
`;

// Heavy grain overlay
const GrainOverlay = styled(Box)`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0.15;
  background-image: 
    repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.08) 1px, rgba(255, 255, 255, 0.08) 2px),
    repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255, 255, 255, 0.06) 1px, rgba(255, 255, 255, 0.06) 2px),
    repeating-radial-gradient(circle at 50% 50%, transparent 0, rgba(255, 255, 255, 0.05) 1px, transparent 2px);
  animation: ${filmGrain} 0.3s steps(5) infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
`;

// Film scratches
const Scratches = styled(Box)`
  position: absolute;
  width: 100%;
  height: 200%;
  opacity: 0.2;
  pointer-events: none;
  animation: ${scratchMove} 2s linear infinite;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 1px;
    height: 100%;
    background: rgba(255, 255, 255, 0.4);
  }
  
  &::before {
    left: 30%;
    transform: scaleY(0.6);
  }
  
  &::after {
    right: 45%;
    transform: scaleY(0.8);
  }
`;

// Film burn spots
const BurnSpots = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 70%;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(139, 69, 19, 0.3), transparent);
    border-radius: 50%;
    animation: ${filmBurn} 3s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 30%;
    right: 60%;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(101, 67, 33, 0.2), transparent);
    border-radius: 50%;
    animation: ${filmBurn} 5s ease-in-out infinite;
    animation-delay: 1.5s;
  }
`;

// Film perforations
const FilmPerforations = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'side',
})<{ side: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  ${props => props.side === 'left' ? 'left: 10px;' : 'right: 10px;'}
  width: 40px;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 200%;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 15px,
      #0a0a0a 15px,
      #0a0a0a 35px,
      transparent 35px,
      transparent 50px
    );
    animation: ${perforationScroll} 1s linear infinite;
  }
`;

// Vintage countdown
const CountdownContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isVisible',
})<{ isVisible: boolean }>`
  position: absolute;
  width: 350px;
  height: 350px;
  display: ${props => props.isVisible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const CountdownCircle = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 14px solid rgba(180, 170, 150, 0.25);
  border-radius: 50%;
  filter: blur(1px) brightness(0.9);
  opacity: 0.8;
  
  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: -14px;
    right: -14px;
    bottom: -14px;
    border-radius: 50%;
    border: 14px solid transparent;
    border-top-color: rgba(180, 170, 150, 0.6);
    border-right-color: rgba(180, 170, 150, 0.4);
    border-bottom-color: rgba(180, 170, 150, 0.2);
    animation: ${countdownWobble} 1s linear infinite;
    filter: blur(0.5px);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -28px;
    left: -28px;
    right: -28px;
    bottom: -28px;
    border-radius: 50%;
    border: 2px dashed rgba(160, 150, 130, 0.2);
    animation: ${countdownWobble} 1.5s linear reverse infinite;
  }
`;

const CountdownNumber = styled(Box)`
  font-size: 240px;
  font-weight: 900;
  color: rgba(180, 170, 150, 0.75);
  font-family: 'Times New Roman', serif;
  text-shadow: 
    4px 4px 15px rgba(0, 0, 0, 0.9),
    -3px -3px 12px rgba(0, 0, 0, 0.7),
    2px 2px 4px rgba(0, 0, 0, 0.8),
    -1px -1px 2px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(180, 170, 150, 0.2),
    0 0 80px rgba(0, 0, 0, 0.5);
  animation: ${numberAppear} 1s ease-out;
  user-select: none;
  filter: blur(0.8px) contrast(0.9) brightness(0.95);
  transform: rotate(-3deg) skew(-1deg, 1deg);
  opacity: 0.85;
  
  /* Gritty texture effect */
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 2px,
      rgba(0, 0, 0, 0.1) 3px
    );
  -webkit-background-clip: text;
  background-clip: text;
`;

// Target crosshair (dirty and worn)
const FilmTarget = styled(Box)`
  position: absolute;
  width: 250px;
  height: 250px;
  opacity: 0.35;
  filter: blur(0.3px);
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(160, 150, 130, 0.3),
      rgba(160, 150, 130, 0.2),
      rgba(160, 150, 130, 0.3),
      transparent
    );
  }
  
  &::before {
    top: 50%;
    left: 5%;
    right: 5%;
    height: 3px;
    transform: translateY(-50%) scaleY(0.8);
  }
  
  &::after {
    left: 50%;
    top: 5%;
    bottom: 5%;
    width: 3px;
    transform: translateX(-50%) scaleX(0.8);
  }
`;

// Cinema curtains (velvet red with subtle waves)
const Curtain = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'side' && prop !== 'isOpen',
})<{ side: 'left' | 'right'; isOpen: boolean }>`
  position: absolute;
  top: 0;
  width: 55%;
  height: 100%;
  ${props => props.side === 'left' ? 'left: 0;' : 'right: 0;'}
  transform-origin: ${props => props.side === 'left' ? 'left' : 'right'};
  animation: ${props => props.isOpen ? curtainOpen : 'none'} 1.5s ease-in-out forwards;
  animation-delay: 0.2s;
  z-index: 50;
  
  /* Velvet texture with subtle waves */
  background: 
    repeating-linear-gradient(
      88deg,
      #2d0808 0px,
      #3a0c0c 10px,
      #4a0e0e 20px,
      #3a0c0c 30px,
      #2d0808 40px
    );
  
  box-shadow: 
    ${props => props.side === 'left'
      ? 'inset -30px 0 60px rgba(0,0,0,0.9)'
      : 'inset 30px 0 60px rgba(0,0,0,0.9)'},
    0 0 50px rgba(0,0,0,0.8);
  
  /* Vertical fold lines for fabric texture */
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(0,0,0,0.2) 1px,
      transparent 2px,
      transparent 15px,
      rgba(255,255,255,0.01) 16px,
      transparent 17px,
      transparent 30px
    );
    animation: ${curtainWave} 6s ease-in-out infinite;
  }
`;

// Cinema seats silhouette
const SeatsRow = styled(Box)`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(0, 0, 0, 0.95)
  );
  z-index: 15;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60px;
    background: repeating-linear-gradient(
      90deg,
      #050505 0px,
      #050505 40px,
      #0a0a0a 40px,
      #0a0a0a 45px,
      #050505 45px,
      #050505 85px
    );
  }
`;

// SVG Logo with Cinema Gold color
const LogoSVG = styled('svg')`
  width: 100%;
  height: 100%;
  filter: 
    sepia(1) 
    saturate(1.5) 
    hue-rotate(35deg) 
    brightness(0.9)
    drop-shadow(0 0 30px rgba(181, 159, 107, 0.6));
`;

const LogoContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isVisible',
})<{ isVisible: boolean }>`
  position: relative;
  width: 220px;
  height: 220px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1.5s ease-in-out;
  z-index: 10;
`;

const Title = styled('h1', {
  shouldForwardProp: (prop) => prop !== 'isVisible',
})<{ isVisible: boolean }>`
  font-size: 4.5rem;
  font-weight: 700;
  margin: 30px 0 20px;
  color: #b59f6b;
  text-transform: uppercase;
  letter-spacing: 12px;
  font-family: 'Bebas Neue', 'Arial Black', sans-serif;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1.5s ease-in-out;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.9),
    0 0 20px rgba(181, 159, 107, 0.3),
    0 0 40px rgba(181, 159, 107, 0.2);
  z-index: 10;
  
  @media (max-width: 768px) {
    font-size: 3rem;
    letter-spacing: 8px;
  }
`;

const Subtitle = styled('p', {
  shouldForwardProp: (prop) => prop !== 'isVisible',
})<{ isVisible: boolean }>`
  font-size: 1rem;
  color: #8b7a5a;
  text-transform: uppercase;
  letter-spacing: 10px;
  margin: 0;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1.5s ease-in-out;
  font-family: 'Courier New', monospace;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  z-index: 10;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    letter-spacing: 6px;
  }
`;

// Leader marks (film alignment)
const LeaderMark = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'customPosition',
})<{ customPosition: string }>`
  position: absolute;
  width: 60px;
  height: 60px;
  border: 3px solid rgba(200, 190, 170, 0.15);
  border-radius: 50%;
  ${props => props.customPosition};
  opacity: 0.5;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
    background: rgba(200, 190, 170, 0.2);
    border-radius: 50%;
  }
`;

// Cinema screen border
const ScreenBorder = styled(Box)`
  position: absolute;
  width: 92%;
  height: 85%;
  border: 20px solid;
  border-image: linear-gradient(
    180deg,
    #1a1612,
    #2a2218,
    #1a1612
  ) 1;
  box-shadow: 
    inset 0 0 100px rgba(0, 0, 0, 0.95),
    0 0 50px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  z-index: 20;
`;

interface SplashScreenProps {
  onComplete?: () => void;
  waitForCondition?: () => boolean;
  minDisplayTime?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  waitForCondition
}) => {
  const [isHiding, setIsHiding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [showContent] = useState(true); // Logo always there, just hidden by curtain
  const [curtainsOpen, setCurtainsOpen] = useState(false);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setCurtainsOpen(true);
          }, 200);
          return null;
        }
        return prev - 1;
      });
    }, 1000); // Countdown - 1 second per number

    return () => clearInterval(countdownInterval);
  }, []);

  useEffect(() => {
    if (curtainsOpen) {
      const timer = setTimeout(() => {
        const conditionsMet = waitForCondition ? waitForCondition() : true;
        if (conditionsMet) {
          setIsHiding(true);
          setTimeout(() => {
            onComplete?.();
          }, 800);
        }
      }, 2000); // Show logo for 2 seconds after curtains open

      return () => clearTimeout(timer);
    }
  }, [curtainsOpen, waitForCondition, onComplete]);

  return (
    <SplashContainer isHiding={isHiding}>
      {/* Grain and damage effects */}
      <GrainOverlay />
      <Scratches />
      <BurnSpots />
      
      {/* Film perforations */}
      <FilmPerforations side="left" />
      <FilmPerforations side="right" />
      
      {/* Cinema screen frame */}
      <ScreenBorder />
      
      {/* Leader marks */}
      <LeaderMark customPosition="top: 40px; left: 40px;" />
      <LeaderMark customPosition="top: 40px; right: 40px;" />
      <LeaderMark customPosition="bottom: 40px; left: 40px;" />
      <LeaderMark customPosition="bottom: 40px; right: 40px;" />
      
      {/* Cinema seats */}
      <SeatsRow />
      
      {/* Curtains */}
      <Curtain side="left" isOpen={curtainsOpen} />
      <Curtain side="right" isOpen={curtainsOpen} />
      
      {/* Vintage countdown */}
      <CountdownContainer isVisible={countdown !== null}>
        <FilmTarget />
        <CountdownCircle />
        <CountdownNumber key={countdown}>
          {countdown}
        </CountdownNumber>
      </CountdownContainer>
      
      {/* Main content after countdown */}
      <LogoContainer isVisible={showContent}>
        <LogoSVG viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M388.3 902c-4-2.4-5.3-4.8-5.3-9.9 0-4.5-3.3-.3 38-48.1 14-16.2 27.9-32.3 30.8-35.7l5.3-6.2-3.1-3.9c-3.7-4.7-5.7-5.2-21.5-5.2-29.4 0-118.7-6-129-8.6-25.5-6.5-43.6-27.7-46.5-54.7-4.7-42.8-6.3-153.3-3-202.2 3.7-54.6 7-66.5 23-82.6 12.1-12.1 23.8-17.1 43.8-18.5 6.2-.5 9.2-1.1 9.2-1.9 0-.7-1.6-9.1-3.6-18.6-2.9-14.4-3.4-18-2.5-20.9 3.3-11.1 18.2-13.4 25.4-3.9 1.3 1.9 6.6 11.1 11.5 20.4 5 9.4 9.5 17.7 10 18.4.7 1.3 3.6 1.3 20.8.3 45.1-2.8 70.6-3.5 122.9-3.5 52.5-.1 97.2 1.4 126 4.2 6.5.7 9.3.6 10.1-.2.6-.7 5.7-9.7 11.3-20.2 12.1-22.6 13.9-24.7 21.4-25.3 6.5-.5 10.9 1.4 13.7 6.1 2.6 4.3 2.6 5.5-1.5 25.6-1.9 9.5-3.3 17.6-3 18 .2.5 3.9 1.1 8.2 1.5 18.1 1.6 32.8 7 42.6 15.7 9.7 8.5 18.2 23.6 20.8 37.2 5.4 27.9 7.4 137.5 4 211.2-2.1 43.5-3.2 50.4-10.2 63.6-8.4 15.6-25.1 27.4-44.8 31.4-10.6 2.2-60.9 5.3-118.9 7.4l-22.3.8-4.2 4.1c-3.1 3.1-3.9 4.6-3.2 5.6.6.7 16.8 19.5 36 41.6 19.3 22.1 35.5 41.2 36.2 42.4.7 1.1 1.2 3.8 1.3 5.9 0 3.1-.7 4.6-3.4 7.3-2.8 2.8-4.2 3.4-7.5 3.4-5.8 0-9.3-2.1-14.8-9-5.6-6.9-39.3-46.9-57.6-68.5-7.1-8.2-13.4-14.9-14-14.8-.7.1-5.7 1.1-11.2 2.3-12.5 2.7-31.7 2.3-43.2-.8l-7.3-2-9.2 11.2c-5 6.1-15.5 18.5-23.3 27.6-7.8 9.1-20.3 23.9-27.9 33-7.5 9.1-15.1 17.5-16.8 18.8-3.8 2.7-9.2 2.9-13.5.2zm164.2-148c31-1.4 64.3-3.9 69-5.1 15.5-4.2 28.1-18 30.5-33.5 4.7-30.4 4.7-183-.1-217.9-1.9-14.3-11.5-26.9-23.9-31.6-15.4-5.8-108.4-10.1-175.3-8-69.8 2.1-115.8 4.9-126.3 7.7-7.3 1.9-10.9 4.1-16.8 10.4-8.6 9.2-10.7 16.7-12.5 46-3.5 54.7-3 144.7 1 185 1.6 16.4 6.7 25.7 18.2 33.1 7.7 5 14.7 6.4 44.2 8.9 66 5.5 139.2 7.4 192 5zm168.2-53.1c4.1-2.5 9-9.7 9.9-14.5 1.5-8.2-3.9-18.5-11.9-22.5-5.8-3-14.8-3-20.4-.1-16.8 8.8-14 35 4.3 39.7 5.8 1.5 13.2.4 18.1-2.6zm-4-65c5.9-2.2 12.2-10.2 13.8-17.6 1-4.9-1.8-13.2-5.7-17-5.1-4.8-9-6.3-16.1-6.3-12.4 0-20.8 7.5-21.5 19.4-.3 4.9 0 7.1 1.6 10.2 2.5 4.8 6.6 8.8 11.2 10.8 4.1 1.8 12.7 2.1 16.7.5zm17.5-86.4c.8-1.9.8-3.1 0-5-1.3-2.8.5-2.7-31-2.7-17.6 0-19.2.4-19.2 5.1 0 5 .7 5.1 25.7 5.1l23.3 0 1.2-2.5zm-1-24.2c2.4-2.1 2.3-4.8-.2-7.3-1.9-1.9-3.3-2-23.7-2-23.7 0-25.3.4-25.3 6 0 4.8.8 5 24.9 5 19.5 0 22.7-.2 24.3-1.7zm0-24c2.2-2 2.3-5.1.1-7.5-1.5-1.6-3.6-1.8-23.6-1.8-19.1 0-22.3.2-23.9 1.7-2.3 2.1-2.4 6.9 0 8.2 1 .6 10.6 1.1 23.6 1.1 19 0 22.2-.2 23.8-1.7z"/>
          <path fill="currentColor" d="M549.3 713.6l-2.8-2.4-.2-33.9c-.1-18.6.1-37.4.4-41.9l.6-8 7.6 1.4c11.7 2.2 27.2 0 43.4-6.3 1.6-.7 1.7 1.8 1.7 42.8 0 29.8-.4 44.4-1.1 46-1.9 4.2-4.7 4.7-26.4 4.7-20.1 0-20.4 0-23.2-2.4zM479.5 667.5l-2.5-2.4 0-80.9c0-78.2.1-81.1 1.9-83.3 1.8-2.2 2.8-2.4 12.5-2.7l10.7-.4-4.6 6.5c-16.9 24.3-19.4 55.1-6.4 81.4 6.8 13.8 19.5 27 32.5 34l5.6 3-.1 21.4-.1 21.4-2.6 2.3c-2.4 2.1-3.2 2.2-23.5 2.2-21 0-21 0-23.4-2.5zM411.2 628c-1.2-1.1-2.4-3.1-2.7-4.3-.3-1.2-.4-28.9-.3-61.5l.3-59.4 2.8-2.4c2.8-2.4 3.1-2.4 22.7-2.4 21.2 0 24 .5 25.9 4.7.8 1.7 1.1 20.6 1.1 62.4l0 60-2.5 2.4c-2.4 2.5-2.4 2.5-23.8 2.5-20 0-21.5-.1-23.5-2zM552.8 617c-19-3.4-37.8-15.8-47.6-31.3-7-11-9.4-19.4-9.9-33.7-.8-22.2 4.1-35.5 18.6-50.1 13.8-13.9 29.3-20.3 48.6-20.3 11.9.1 22.3 2.6 33 8.1 9.8 5.1 23.8 19.2 28.3 28.7 4.9 10.1 7.2 20.2 7.2 31.5 0 11.7-1.7 18.9-7.2 30.1-5.3 10.9"/>
        </LogoSVG>
      </LogoContainer>
      
      <Title isVisible={showContent}>TV-RANK</Title>
      <Subtitle isVisible={showContent}>Est. 2024</Subtitle>
    </SplashContainer>
  );
};