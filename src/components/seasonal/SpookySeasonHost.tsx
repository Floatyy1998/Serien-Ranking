import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { SpookyLayer } from './spooky/SpookyLayer';

export const SpookySeasonHost = () => {
  const spooky = useContext(ThemeContext)?.userConfig.spooky;
  return spooky ? <SpookyLayer /> : null;
};
