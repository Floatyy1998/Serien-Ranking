import React, { useEffect, useState } from 'react';
import { Box, keyframes, styled } from '@mui/material';
import logoImg from '../../assets/logo.png';

// Epic fade out mit zoom
const fadeOut = keyframes`
  0% {
    opacity: 1;
    visibility: visible;
    filter: brightness(1) contrast(1);
  }
  50% {
    filter: brightness(1.2) contrast(1.1);
  }
  100% {
    opacity: 0;
    visibility: hidden;
    transform: scale(1.05) translateY(-20px);
    filter: brightness(2) contrast(1.5) blur(10px);
  }
`;

// Gradient animation für Background
const gradientShift = keyframes`
  0%, 100% {
    background-position: 0% 50%;
    filter: hue-rotate(0deg);
  }
  33% {
    background-position: 50% 100%;
    filter: hue-rotate(30deg);
  }
  66% {
    background-position: 100% 50%;
    filter: hue-rotate(-30deg);
  }
`;

// Logo entrance mit 3D flip
const logoEntrance = keyframes`
  0% {
    transform: scale(0) rotateY(720deg) rotateX(720deg);
    opacity: 0;
    filter: blur(20px);
  }
  40% {
    transform: scale(1.2) rotateY(360deg) rotateX(360deg);
    opacity: 1;
    filter: blur(0);
  }
  60% {
    transform: scale(0.9) rotateY(180deg) rotateX(180deg);
  }
  80% {
    transform: scale(1.05) rotateY(90deg) rotateX(90deg);
  }
  100% {
    transform: scale(1) rotateY(0) rotateX(0);
    opacity: 1;
    filter: blur(0);
  }
`;

// Logo Hover Effect
const logoHover = keyframes`
  0%, 100% {
    transform: translateY(0) rotateZ(0deg) scale(1);
    filter: drop-shadow(0 10px 30px rgba(255, 0, 128, 0.5));
  }
  25% {
    transform: translateY(-15px) rotateZ(2deg) scale(1.02);
    filter: drop-shadow(0 20px 40px rgba(121, 77, 254, 0.6));
  }
  50% {
    transform: translateY(-10px) rotateZ(-2deg) scale(1.04);
    filter: drop-shadow(0 15px 35px rgba(0, 255, 255, 0.5));
  }
  75% {
    transform: translateY(-18px) rotateZ(1deg) scale(1.01);
    filter: drop-shadow(0 25px 45px rgba(255, 0, 255, 0.6));
  }
`;

// Title Glitch Effect
const titleGlitch = keyframes`
  0%, 100% {
    text-shadow: 
      2px 2px 0 rgba(255, 0, 128, 0.8),
      -2px -2px 0 rgba(0, 255, 255, 0.8),
      0 0 30px rgba(255, 0, 128, 0.5);
    transform: translate(0);
  }
  20% {
    text-shadow: 
      -2px 2px 0 rgba(0, 255, 255, 0.8),
      2px -2px 0 rgba(255, 0, 255, 0.8),
      0 0 40px rgba(121, 77, 254, 0.6);
    transform: translate(2px, -1px);
  }
  40% {
    text-shadow: 
      2px -2px 0 rgba(255, 255, 0, 0.8),
      -2px 2px 0 rgba(121, 77, 254, 0.8),
      0 0 35px rgba(0, 255, 255, 0.5);
    transform: translate(-1px, 2px);
  }
  60% {
    text-shadow: 
      1px 1px 0 rgba(255, 0, 128, 0.8),
      -1px -1px 0 rgba(0, 255, 255, 0.8),
      0 0 45px rgba(255, 0, 255, 0.7);
    transform: translate(1px, -1px);
  }
  80% {
    text-shadow: 
      -1px -1px 0 rgba(121, 77, 254, 0.8),
      1px 1px 0 rgba(255, 255, 0, 0.8),
      0 0 50px rgba(255, 0, 128, 0.6);
    transform: translate(-2px, 0);
  }
`;

// Cyber lines animation
const cyberLine = keyframes`
  0% {
    transform: scaleX(0);
    transform-origin: left;
  }
  50% {
    transform: scaleX(1);
    transform-origin: left;
  }
  51% {
    transform-origin: right;
  }
  100% {
    transform: scaleX(0);
    transform-origin: right;
  }
`;

// Energy wave
const energyWave = keyframes`
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
`;

// Pulse effect
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

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
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(121, 77, 254, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    linear-gradient(
      135deg,
      #000000 0%,
      #0d001f 25%,
      #000000 50%,
      #1f000d 75%,
      #000000 100%
    );
  background-size: 400% 400%;
  animation: 
    ${gradientShift} 20s ease infinite,
    ${props => props.isHiding ? fadeOut : 'none'} 0.6s ease-in-out forwards;
  overflow: hidden;
`;

// Cyber Grid mit Perspektive
const CyberGrid = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150%;
  height: 150%;
  transform: translate(-50%, -50%) perspective(500px) rotateX(60deg);
  background-image: 
    linear-gradient(rgba(255, 0, 128, 0.2) 2px, transparent 2px),
    linear-gradient(90deg, rgba(121, 77, 254, 0.2) 2px, transparent 2px);
  background-size: 50px 50px;
  opacity: 0.3;
  pointer-events: none;
`;

// Animated cyber lines
const CyberLines = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before, &::after {
    content: '';
    position: absolute;
    left: 0;
    height: 1px;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 0, 128, 0.8),
      rgba(121, 77, 254, 0.8),
      rgba(0, 255, 255, 0.8),
      transparent
    );
  }
  
  &::before {
    top: 20%;
    animation: ${cyberLine} 4s ease-in-out infinite;
  }
  
  &::after {
    bottom: 20%;
    animation: ${cyberLine} 4s ease-in-out infinite;
    animation-delay: 2s;
  }
`;

// Energy Wave
const EnergyWave = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 0, 128, 0.1),
      rgba(121, 77, 254, 0.1),
      rgba(0, 255, 255, 0.1),
      transparent
    );
    animation: ${energyWave} 3s linear infinite;
    transform: skewX(-15deg);
  }
`;

const LogoContainer = styled(Box)`
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 50px;
  animation: 
    ${logoEntrance} 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
    ${logoHover} 5s ease-in-out 1.5s infinite;
  transform-style: preserve-3d;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    border: 2px solid;
    border-radius: 20px;
    animation: ${pulse} 2s ease-out infinite;
  }
  
  &::before {
    border-color: rgba(255, 0, 128, 0.5);
    animation-delay: 0s;
  }
  
  &::after {
    border-color: rgba(121, 77, 254, 0.5);
    animation-delay: 1s;
  }
`;

const Logo = styled('img')`
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: 
    drop-shadow(0 0 30px rgba(255, 0, 128, 0.8))
    drop-shadow(0 0 60px rgba(121, 77, 254, 0.5))
    drop-shadow(0 0 90px rgba(0, 255, 255, 0.3));
  border-radius: 20px;
  position: relative;
  z-index: 2;
`;

const Title = styled('h1')`
  font-size: 5.5rem;
  font-weight: 900;
  margin: 0 0 15px 0;
  background: linear-gradient(
    45deg,
    #ff0080,
    #794dfe,
    #00ffff,
    #ff00ff,
    #ffff00,
    #ff0080
  );
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: 
    ${titleGlitch} 2s ease-in-out infinite,
    ${gradientShift} 3s linear infinite;
  text-transform: uppercase;
  letter-spacing: 10px;
  position: relative;
  
  &::after {
    content: 'TV-RANK';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-text-fill-color: transparent;
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
    z-index: -1;
    animation: ${titleGlitch} 2s ease-in-out infinite reverse;
  }
  
  @media (max-width: 768px) {
    font-size: 3.5rem;
    letter-spacing: 5px;
  }
`;

const Subtitle = styled('p')`
  font-size: 1.3rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 12px;
  margin-bottom: 50px;
  position: relative;
  
  &::before, &::after {
    content: '◆';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 0, 128, 0.6);
    font-size: 0.8rem;
  }
  
  &::before {
    left: -30px;
  }
  
  &::after {
    right: -30px;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    letter-spacing: 8px;
    
    &::before, &::after {
      display: none;
    }
  }
`;

const LoadingContainer = styled(Box)`
  position: relative;
  width: 350px;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 0, 128, 0.2);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 
    inset 0 0 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(255, 0, 128, 0.2);
  
  @media (max-width: 768px) {
    width: 280px;
    height: 5px;
  }
`;

const LoadingBar = styled(Box)`
  height: 100%;
  background: linear-gradient(
    90deg,
    #ff0080,
    #794dfe,
    #00ffff,
    #ff00ff,
    #ff0080
  );
  background-size: 200% 100%;
  border-radius: 3px;
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 10px currentColor,
    inset 0 0 5px rgba(255, 255, 255, 0.5);
  animation: ${gradientShift} 2s linear infinite;
`;

const LoadingText = styled(Box)`
  margin-top: 25px;
  font-size: 13px;
  color: rgba(0, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 4px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
`;

const LoadingPercentage = styled('span')`
  color: rgba(255, 0, 128, 0.9);
  font-size: 15px;
  margin-left: 10px;
  text-shadow: 0 0 10px currentColor;
`;

// Tech Frame Corners
const TechCorner = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'cornerPosition'
})<{ cornerPosition: string }>`
  position: absolute;
  width: 100px;
  height: 100px;
  
  ${props => {
    const positions: Record<string, string> = {
      'top-left': 'top: 30px; left: 30px;',
      'top-right': 'top: 30px; right: 30px;',
      'bottom-left': 'bottom: 30px; left: 30px;',
      'bottom-right': 'bottom: 30px; right: 30px;'
    };
    return positions[props.cornerPosition] || '';
  }}
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: linear-gradient(
      45deg,
      rgba(255, 0, 128, 0.6),
      rgba(121, 77, 254, 0.6)
    );
  }
  
  &::before {
    width: 100%;
    height: 2px;
    ${props => props.cornerPosition.includes('top') ? 'top: 0;' : 'bottom: 0;'}
  }
  
  &::after {
    width: 2px;
    height: 100%;
    ${props => props.cornerPosition.includes('left') ? 'left: 0;' : 'right: 0;'}
  }
`;

interface SplashScreenProps {
  onComplete?: () => void;
  waitForCondition?: () => boolean;
  minDisplayTime?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  waitForCondition,
  minDisplayTime = 2000 
}) => {
  const [isHiding, setIsHiding] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('System wird initialisiert');

  useEffect(() => {
    const texts = [
      'System wird initialisiert',
      'Datenbank wird verbunden',
      'Inhalte werden synchronisiert',
      'Interface wird vorbereitet',
      'Fast fertig',
      'Starte'
    ];
    
    const interval = setInterval(() => {
      const index = Math.min(Math.floor((loadingProgress / 100) * texts.length), texts.length - 1);
      setLoadingText(texts[index]);
    }, 400);

    return () => clearInterval(interval);
  }, [loadingProgress]);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / minDisplayTime) * 100);
      
      setLoadingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [minDisplayTime]);

  useEffect(() => {
    const conditionsMet = waitForCondition ? waitForCondition() : true;
    
    if (loadingProgress >= 100 && conditionsMet) {
      setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }, 200);
    }
  }, [loadingProgress, waitForCondition, onComplete]);

  return (
    <SplashContainer isHiding={isHiding}>
      <CyberGrid />
      <CyberLines />
      <EnergyWave />
      
      {/* Tech Frame Corners */}
      <TechCorner cornerPosition="top-left" />
      <TechCorner cornerPosition="top-right" />
      <TechCorner cornerPosition="bottom-left" />
      <TechCorner cornerPosition="bottom-right" />
      
      <LogoContainer>
        <Logo src={logoImg} alt="TV-RANK Logo" />
      </LogoContainer>
      
      <Title>TV-RANK</Title>
      <Subtitle>Bewerte • Tracke • Teile</Subtitle>
      
      <LoadingContainer>
        <LoadingBar style={{ transform: `scaleX(${loadingProgress / 100})` }} />
      </LoadingContainer>
      
      <LoadingText>
        {loadingText}
        <LoadingPercentage>{Math.round(loadingProgress)}%</LoadingPercentage>
      </LoadingText>
    </SplashContainer>
  );
};