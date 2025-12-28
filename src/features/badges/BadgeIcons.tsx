import React from 'react';
import {
  LocalMovies,
  Weekend,
  Hotel,
  LiveTv,
  EmojiEvents,
  SportsEsports,
  LocalFireDepartment,
  Bolt,
  WbTwilight,
  GpsFixed,
  FlightTakeoff,
  Diamond,
  Link,
  Autorenew,
  Stars,
  Theaters,
  AccessTime,
  Map,
  Search,
  Public,
  Explore,
  Rocket,
  Star,
  StarBorder,
  Handshake,
  Groups,
  Language,
  LocalDining,
  FastForward,
  Whatshot,
  Loop,
  TravelExplore,
  Grade,
  People,
  AllInclusive,
  FlashOn,
  NightsStay,
  Timer,
  Replay,
  RateReview,
  ConnectWithoutContact,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

// Mapping von Badge IDs zu Icons
const badgeIconMap: Record<string, React.ComponentType<SvgIconProps>> = {
  // Binge badges - Snack/Couch themed
  'binge_bronze': LocalMovies,
  'binge_bronze_plus': LocalDining,
  'binge_silver': Weekend,
  'binge_silver_plus': Weekend,
  'binge_gold': Hotel,
  'binge_gold_plus': LiveTv,
  'binge_platinum': SportsEsports,
  'binge_diamond': EmojiEvents,
  'binge_diamond_plus': Diamond,
  
  // Quickwatch badges - Speed/Lightning themed
  'quickwatch_bronze': FlashOn,
  'quickwatch_silver': Bolt,
  'quickwatch_gold': FastForward,
  'quickwatch_platinum': LocalFireDepartment,
  'quickwatch_diamond': Whatshot,
  
  // Marathon badges - Time/Night themed
  'marathon_bronze': Timer,
  'marathon_silver': WbTwilight,
  'marathon_gold': NightsStay,
  'marathon_platinum': GpsFixed,
  'marathon_diamond': FlightTakeoff,
  
  // Streak badges - Fire/Continuous themed
  'streak_bronze': Whatshot,
  'streak_silver': LocalFireDepartment,
  'streak_gold': Diamond,
  'streak_platinum': Link,
  'streak_diamond': AllInclusive,
  
  // Rewatch badges - Replay/Loop themed
  'rewatch_bronze': Replay,
  'rewatch_silver': Loop,
  'rewatch_gold': Autorenew,
  'rewatch_platinum': Theaters,
  'rewatch_diamond': AccessTime,
  
  // Explorer badges - Map/Travel themed
  'explorer_bronze': Map,
  'explorer_silver': Search,
  'explorer_gold': Public,
  'explorer_platinum': TravelExplore,
  'explorer_diamond': Explore,
  'explorer_mythic': Rocket,
  
  // Collector badges - Star/Rating themed
  'collector_bronze': Star,
  'collector_silver': StarBorder,
  'collector_gold': Grade,
  'collector_platinum': Stars,
  'collector_diamond': RateReview,
  'collector_mythic': EmojiEvents,
  
  // Social badges - People/Connection themed
  'social_bronze': Handshake,
  'social_silver': People,
  'social_gold': Groups,
  'social_platinum': ConnectWithoutContact,
  'social_diamond': Language,
};

// Fallback Icon wenn Badge ID nicht gefunden wird
const FallbackIcon = EmojiEvents;

export const getBadgeIcon = (badgeId: string): React.ComponentType<SvgIconProps> => {
  return badgeIconMap[badgeId] || FallbackIcon;
};

// Component to render badge icon
export const BadgeIcon: React.FC<{ badgeId: string } & SvgIconProps> = ({ 
  badgeId, 
  ...props 
}) => {
  const Icon = getBadgeIcon(badgeId);
  return <Icon {...props} />;
};