/**
 * Schmale, explizit importierte Icon-Auswahl für die Seitenhilfe. Einzel-Pfade
 * statt Sammel-Import, damit der Icons-Chunk nicht komplett mitgeladen wird.
 */

import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import Explore from '@mui/icons-material/Explore';
import FilterAlt from '@mui/icons-material/FilterAlt';
import History from '@mui/icons-material/History';
import IosShare from '@mui/icons-material/IosShare';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import QueryStats from '@mui/icons-material/QueryStats';
import Replay from '@mui/icons-material/Replay';
import Search from '@mui/icons-material/Search';
import StarBorder from '@mui/icons-material/StarBorder';
import SwapVert from '@mui/icons-material/SwapVert';
import Swipe from '@mui/icons-material/Swipe';
import Tune from '@mui/icons-material/Tune';
import ViewModule from '@mui/icons-material/ViewModule';

export const TOUR_ICONS: Record<string, ComponentType<SvgIconProps>> = {
  add: AddCircleOutline,
  bookmark: BookmarkBorder,
  calendar: CalendarMonth,
  check: CheckCircleOutline,
  explore: Explore,
  filter: FilterAlt,
  history: History,
  people: PeopleOutline,
  play: PlayCircleOutline,
  replay: Replay,
  search: Search,
  share: IosShare,
  sort: SwapVert,
  star: StarBorder,
  stats: QueryStats,
  streak: LocalFireDepartment,
  swipe: Swipe,
  tune: Tune,
  view: ViewModule,
  bell: NotificationsNone,
};

export const getTourIcon = (name: string): ComponentType<SvgIconProps> =>
  TOUR_ICONS[name] ?? TOUR_ICONS.explore;
