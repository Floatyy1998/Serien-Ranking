import { useAppFocus } from '../../hooks/ui/useAppFocus';
import { readsFirst } from '../../services/settings/appFocus';
import { HomePage } from './HomePage';
import { ReadingHomePage } from './ReadingHomePage';

/** „/" je nach Schwerpunkt: Lese-Startseite oder Serien-Startseite. */
export const HomeRoute = () =>
  readsFirst(useAppFocus().focus) ? <ReadingHomePage /> : <HomePage />;
