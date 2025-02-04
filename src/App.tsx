import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { theme } from './theme';

const Header = lazy(() => import('./components/Header'));
const Legend = lazy(() => import('./components/Legend'));
const SearchFilters = lazy(() => import('./components/SearchFilters'));
const SeriesGrid = lazy(() => import('./components/SeriesGrid'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const StartPage = lazy(() => import('./components/StartPage'));

export const AuthContext = createContext<{
  user: Firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<Firebase.User | null>>;
} | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Firebase.User | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const config = {
      apiKey: process.env.VITE_APIKEY,
      authDomain: process.env.VITE_AUTHDOMAIN,
      databaseURL: process.env.VITE_DATABASEURL,
      projectId: process.env.VITE_PROJECTID,
      storageBucket: process.env.VITE_STORAGEBUCKET,
      messagingSenderId: process.env.VITE_MESSAGINGSENDERID,
      appId: process.env.VITE_APPID,
      measurementId: process.env.VITE_MEASUREMENTID,
    };

    if (!Firebase.apps.length) {
      Firebase.initializeApp(config);
    }

    Firebase.auth().setPersistence(Firebase.auth.Auth.Persistence.LOCAL);
    Firebase.auth().onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    });

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setFirebaseInitialized(true);
  }, []);

  if (!firebaseInitialized) {
    return (
      <Box className='flex justify-center items-center '>
        <InfinitySpin color='#00fed7'></InfinitySpin>
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
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
