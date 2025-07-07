import { Box, Button, CssBaseline, ThemeProvider, styled } from '@mui/material';
import Firebase from 'firebase/compat/app';
import {
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Helmet } from 'react-helmet';
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { VerifiedRoute } from './components/auth/VerifiedRoute';
import Legend from './components/common/Legend';
import MovieSearchFilters from './components/filters/MovieSearchFilters';
import SearchFilters from './components/filters/SearchFilters';
import Header from './components/layout/Header';
import MovieGrid from './components/movies/MovieGrid';
import SeriesGrid from './components/series/SeriesGrid';
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';
import { MovieListProvider } from './contexts/MovieListProvider';
import { SeriesListProvider } from './contexts/SeriesListProvider';
import { StatsProvider } from './contexts/StatsProvider';
import SharedSeriesList from './pages/SharedSeriesList';
import { theme } from './theme';
// Nur diese bleiben lazy
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const StartPage = lazy(() => import('./pages/StartPage'));
const DuckFacts = lazy(() => import('./components/DuckFacts'));
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
    import('./firebase/initFirebase').then((module) => {
      module.initFirebase();
      Firebase.auth().onAuthStateChanged((user) => {
        setUser(user);
        setAuthStateResolved(true);
      });
      setFirebaseInitialized(true);
    });
  }, []);
  if (!firebaseInitialized || !authStateResolved) {
    return null; // Lass das GlobalLoadingProvider das Skeleton zeigen
  }
  return (
    <AuthContext.Provider value={{ user, setUser, authStateResolved }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
export function App() {
  return (
    <Router>
      <GlobalLoadingProvider>
        <AppContent />
      </GlobalLoadingProvider>
    </Router>
  );
}

const NavBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
}));

const NavButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.pxToRem(15),
  margin: theme.spacing(1),
  color: 'rgba(255, 255, 255, 0.7)',
  '&.active': {
    color: '#fff',
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
}));

function AppContent() {
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

  const location = useLocation();
  const navigate = useNavigate();
  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const showNavBar =
    !location.pathname.startsWith('/shared-list') &&
    location.pathname !== '/duckfacts';

  return (
    <AuthProvider>
      <SeriesListProvider>
        <MovieListProvider>
          <StatsProvider>
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
              <CssBaseline />{' '}
              <div className='w-full'>
                <Header setIsStatsOpen={setIsStatsOpen} />
                <AuthContext.Consumer>
                  {(auth) =>
                    auth?.user &&
                    showNavBar && (
                      <NavBar>
                        <NavButton
                          className={location.pathname === '/' ? 'active' : ''}
                          onClick={() => handleNavClick('/')}
                        >
                          Serien
                        </NavButton>
                        <NavButton
                          className={
                            location.pathname === '/movies' ? 'active' : ''
                          }
                          onClick={() => handleNavClick('/movies')}
                        >
                          Filme
                        </NavButton>
                      </NavBar>
                    )
                  }
                </AuthContext.Consumer>
                <main className='w-full px-4 py-6'>
                  <div className='mx-auto'>
                    <Link to='/' className='mb-12' aria-label='Zur Startseite'>
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
                                <VerifiedRoute>
                                  <div className='flex flex-col gap-4 items-start'>
                                    {/* Suchfilter und Legende untereinander, linksbündig */}
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
                                  </div>
                                </VerifiedRoute>
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
                      <Route path='/duckfacts' element={<DuckFacts />} />
                      <Route
                        path='/movies'
                        element={
                          <AuthContext.Consumer>
                            {(auth) =>
                              auth?.user ? (
                                <VerifiedRoute>
                                  <div className='flex flex-col gap-4 items-start'>
                                    <MovieSearchFilters
                                      onSearchChange={handleSearchChange}
                                      onGenreChange={handleGenreChange}
                                      onProviderChange={handleProviderChange}
                                    />

                                    <MovieGrid
                                      searchValue={searchValue}
                                      selectedGenre={selectedGenre}
                                      selectedProvider={selectedProvider}
                                    />
                                  </div>
                                </VerifiedRoute>
                              ) : (
                                <StartPage />
                              )
                            }
                          </AuthContext.Consumer>
                        }
                      />{' '}
                      <Route path='*' element={<Navigate to='/' />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </ThemeProvider>
          </StatsProvider>
        </MovieListProvider>
      </SeriesListProvider>
    </AuthProvider>
  );
}

export default App;
