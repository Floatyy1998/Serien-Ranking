import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { activeSeason } from '../../theme/seasonalThemes';
import { ChristmasLayer } from './christmas/ChristmasLayer';
import { NewYearLayer } from './newyear/NewYearLayer';
import { SpookyLayer } from './spooky/SpookyLayer';

export const SeasonalHost = () => {
  const config = useContext(ThemeContext)?.userConfig;
  const season = config ? activeSeason(config) : null;
  if (season === 'spooky') return <SpookyLayer />;
  if (season === 'christmas') return <ChristmasLayer />;
  if (season === 'newyear') return <NewYearLayer />;
  return null;
};
