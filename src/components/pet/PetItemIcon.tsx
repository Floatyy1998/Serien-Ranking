import Cookie from '@mui/icons-material/Cookie';
import Healing from '@mui/icons-material/Healing';
import Inventory2 from '@mui/icons-material/Inventory2';
import Replay from '@mui/icons-material/Replay';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Toys from '@mui/icons-material/Toys';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import type { CSSProperties } from 'react';
import type { PetItemId } from './data/petItems';

const ICONS: Record<PetItemId, typeof Cookie> = {
  treat: Cookie,
  toy: Toys,
  feast: RestaurantMenu,
  extraSpin: Replay,
  bonusBox: Inventory2,
  streakPass: VerifiedUser,
  elixir: Healing,
};

export const PetItemIcon = ({ id, style }: { id: PetItemId; style?: CSSProperties }) => {
  const Icon = ICONS[id] ?? Inventory2;
  return <Icon style={style} />;
};
