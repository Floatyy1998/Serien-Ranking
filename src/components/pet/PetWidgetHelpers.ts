import { PET_CONFIG } from '../../services/pet/petConstants';
import type { Pet } from '../../types/pet.types';

export type EdgeType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface EdgePosition {
  edge: EdgeType;
  offsetX: number;
  offsetY: number;
}

export const getStatusColor = (pet: Pet): string => {
  if (!pet.isAlive) return '#6b7280';
  if (pet.hunger >= PET_CONFIG.STATUS_CRITICAL_HUNGER) return '#ef4444';
  if (pet.hunger >= PET_CONFIG.STATUS_WARNING_HUNGER) return '#f97316';
  if (
    pet.hunger >= PET_CONFIG.STATUS_GOOD_HUNGER ||
    pet.happiness <= PET_CONFIG.STATUS_GOOD_HAPPINESS
  )
    return '#eab308';
  return '#22c55e';
};

export const isPetHealthy = (pet: Pet): boolean => {
  return (
    pet.isAlive &&
    pet.hunger < PET_CONFIG.HEALTHY_HUNGER_THRESHOLD &&
    pet.happiness > PET_CONFIG.HEALTHY_HAPPINESS_THRESHOLD
  );
};

export const getNavbarHeight = () => {
  const basePadding = 16;
  const iconContainerHeight = 32;
  const labelHeight = 14;
  const safeAreaBottom = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
  return basePadding + iconContainerHeight + labelHeight + safeAreaBottom;
};

export const convertPercentToEdge = (percentPos: {
  xPercent: number;
  yPercent: number;
}): EdgePosition => {
  const isLeft = percentPos.xPercent < 50;
  const isTop = percentPos.yPercent < 50;

  let edge: EdgeType;
  if (isTop && isLeft) edge = 'top-left';
  else if (isTop && !isLeft) edge = 'top-right';
  else if (!isTop && isLeft) edge = 'bottom-left';
  else edge = 'bottom-right';

  return {
    edge,
    offsetX: 2,
    offsetY: 2,
  };
};

export const calculatePixelPosition = (edgePos: EdgePosition): { x: number; y: number } => {
  const screenWidth = window.innerWidth || 1920;
  const screenHeight = window.innerHeight || 1080;
  const widgetSize = 70;
  const navbarHeight = getNavbarHeight();

  let x: number, y: number;

  switch (edgePos.edge) {
    case 'top-left':
      x = edgePos.offsetX;
      y = edgePos.offsetY;
      break;
    case 'top-right':
      x = screenWidth - widgetSize - edgePos.offsetX;
      y = edgePos.offsetY;
      break;
    case 'bottom-left':
      x = edgePos.offsetX;
      y = screenHeight - navbarHeight - widgetSize - edgePos.offsetY;
      break;
    case 'bottom-right':
      x = screenWidth - widgetSize - edgePos.offsetX;
      y = screenHeight - navbarHeight - widgetSize - edgePos.offsetY;
      break;
  }

  return { x, y };
};

export const calculateEdgeFromPosition = (newPosition: { x: number; y: number }): EdgePosition => {
  const screenWidth = window.innerWidth || 1920;
  const screenHeight = window.innerHeight || 1080;
  const widgetSize = 70;
  const navbarHeight = getNavbarHeight();

  const centerX = newPosition.x + widgetSize / 2;
  const centerY = newPosition.y + widgetSize / 2;

  const distanceToLeft = centerX;
  const distanceToRight = screenWidth - centerX;
  const distanceToTop = centerY;
  const distanceToBottom = screenHeight - centerY;

  const isCloserToLeft = distanceToLeft < distanceToRight;
  const isCloserToTop = distanceToTop < distanceToBottom;

  let edge: EdgeType;
  let offsetX: number;
  let offsetY: number;

  if (isCloserToTop && isCloserToLeft) {
    edge = 'top-left';
    offsetX = newPosition.x;
    offsetY = newPosition.y;
  } else if (isCloserToTop && !isCloserToLeft) {
    edge = 'top-right';
    offsetX = screenWidth - newPosition.x - widgetSize;
    offsetY = newPosition.y;
  } else if (!isCloserToTop && isCloserToLeft) {
    edge = 'bottom-left';
    offsetX = newPosition.x;
    offsetY = screenHeight - navbarHeight - newPosition.y - widgetSize;
  } else {
    edge = 'bottom-right';
    offsetX = screenWidth - newPosition.x - widgetSize;
    offsetY = screenHeight - navbarHeight - newPosition.y - widgetSize;
  }

  return { edge, offsetX, offsetY };
};
