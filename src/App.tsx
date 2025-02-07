import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import Firebase from 'firebase/compat/app'; // Hinzugefügter Import für Firebase
import {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Helmet } from 'react-helmet';
import { InfinitySpin } from 'react-loader-spinner';
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import SharedSeriesList from './pages/SharedSeriesList';
import { theme } from './theme';

// Lazy-Imports für Komponenten
const Header = lazy(() => import('./components/layout/Header'));
const Legend = lazy(() => import('./components/common/Legend'));
const SearchFilters = lazy(() => import('./components/filters/SearchFilters'));
const SeriesGrid = lazy(() => import('./components/series/SeriesGrid'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const StartPage = lazy(() => import('./pages/StartPage'));

export const AuthContext = createContext<{
  user: Firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<Firebase.User | null>>;
  authStateResolved: boolean;
} | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Firebase.User | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [authStateResolved, setAuthStateResolved] = useState(false);

  useEffect(() => {
    // Dynamischer Import der Firebase-Initialisierung
    import('./firebase/initFirebase').then((module) => {
      module.initFirebase();
      // Initialisiere Firebase Auth und höre auf Auth-Statusänderungen
      Firebase.auth().onAuthStateChanged((user) => {
        setUser(user);
        setAuthStateResolved(true);
        // ... ggf. LocalStorage-Handling ...
      });
      setFirebaseInitialized(true);
    });
  }, []);

  if (!firebaseInitialized || !authStateResolved) {
    return (
      <Box className='flex justify-center items-center '>
        <InfinitySpin color='#00fed7' />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authStateResolved }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [, setIsStatsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleGenreChange = useCallback((value: string) => {
    setSelectedGenre(value);
  }, []);

  const handleProviderChange = useCallback((value: string) => {
    setSelectedProvider(value);
  }, []);

  return (
    <AuthProvider>
      <Helmet>
        <title>
          TV-RANK - Entdecke, bewerte und verwalte deine Lieblingsserien
        </title>
        <meta
          name='description'
          content='Entdecke, bewerte und verwalte deine Lieblingsserien mit TV-RANK. Finde neue Serien, führe deine Watchlist und verpasse keine Folge mehr.'
        />
        <meta
          name='keywords'
          content='Serien, TV, Bewertung, Watchlist, TV-RANK'
        />
        <meta
          property='og:title'
          content='TV-RANK - Entdecke, bewerte und verwalte deine Lieblingsserien'
        />
        <meta
          property='og:description'
          content='Entdecke, bewerte und verwalte deine Lieblingsserien mit TV-RANK. Finde neue Serien, führe deine Watchlist und verpasse keine Folge mehr.'
        />
        <meta property='og:image' content='/favicon.ico' />
        <meta property='og:url' content='https://tv-rank.de' />
        <meta name='twitter:card' content='summary_large_image' />
      </Helmet>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className=' w-full '>
            <Suspense
              fallback={
                <Box className='flex justify-center items-center '>
                  <InfinitySpin color='#00fed7'></InfinitySpin>
                </Box>
              }
            >
              <Header
                isNavOpen={isNavOpen}
                setIsNavOpen={setIsNavOpen}
                setIsStatsOpen={setIsStatsOpen}
              />
              <main className='w-full px-4 py-6'>
                <div className=' mx-auto'>
                  <Link to='/' className='mb-12' aria-label='Zur Startseite'>
                    {/* Fügen Sie hier ein Logo oder einen Text hinzu, um den Link erkennbar zu machen */}
                    <span className='sr-only'>Zur Startseite</span>
                  </Link>
                  <Routes>
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/register' element={<RegisterPage />} />
                    <Route
                      path='/'
                      element={
                        <AuthContext.Consumer>
                          {(auth) =>
                            auth?.user ? (
                              <>
                                <SearchFilters
                                  onSearchChange={handleSearchChange}
                                  onGenreChange={handleGenreChange}
                                  onProviderChange={handleProviderChange}
                                />
                                <Legend />
                                <SeriesGrid
                                  searchValue={searchValue}
                                  selectedGenre={selectedGenre}
                                  selectedProvider={selectedProvider}
                                />
                              </>
                            ) : (
                              <StartPage />
                            )
                          }
                        </AuthContext.Consumer>
                      }
                    />
                    <Route
                      path='/shared-list/:linkId'
                      element={<SharedSeriesList />}
                    />
                    <Route path='*' element={<Navigate to='/' />} />
                  </Routes>
                </div>
              </main>
            </Suspense>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
