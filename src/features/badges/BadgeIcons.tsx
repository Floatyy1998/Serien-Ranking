import React, { useMemo } from 'react';
import type { SvgIconProps } from '@mui/material';
import { getBadgeIcon } from './getBadgeIcon';

// Component to render badge icon
export const BadgeIcon: React.FC<{ badgeId: string } & SvgIconProps> = ({ badgeId, ...props }) => {
  const iconComponent = useMemo(() => getBadgeIcon(badgeId), [badgeId]);
  return React.createElement(iconComponent, props);
};
