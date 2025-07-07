import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

interface GlobalLoadingState {
  isGlobalLoading: boolean;
  showSkeleton: boolean;
}

const GlobalLoadingContext = createContext<GlobalLoadingState | undefined>(
  undefined
);

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

/**
 * Intelligentes globales Loading-System
 * Lädt Daten im Hintergrund und zeigt passendes Skeleton
 */
export const GlobalLoadingProvider = ({
  children,
}: GlobalLoadingProviderProps) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Für alle Seiten: 2 Sekunden - Daten werden parallel im Hintergrund geladen
    const timer = setTimeout(() => {
      setIsGlobalLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const contextValue: GlobalLoadingState = {
    isGlobalLoading,
    showSkeleton: isGlobalLoading,
  };

  // Globale Skeleton-Anzeige für alle Hauptseiten (außer Login/Register)
  const shouldShowSkeleton =
    !location.pathname.includes('/login') &&
    !location.pathname.includes('/register');
  const isSharedListPage = location.pathname.startsWith('/shared-list');

  if (isGlobalLoading && shouldShowSkeleton) {
    return (
      <GlobalLoadingContext.Provider value={contextValue}>
        {/* EXAKT wie die echte App - Header + Nav + Main */}
        <div
          className='w-full min-h-screen'
          style={{ backgroundColor: '#000' }}
        >
          {/* ECHTER Header - genau wie in der App */}
          <div
            className='w-full h-16 flex items-center justify-center'
            style={{
              backgroundColor: '#1e1e1e',
              borderBottom: '1px solid #333',
            }}
          >
            <div
              className='skeleton-wave'
              style={{
                width: '120px',
                height: '2px',
                backgroundColor: 'rgba(80, 80, 80, 0.4)',
                background:
                  'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-wave 1.5s ease-in-out infinite',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* ECHTE Navigation - nur für Hauptseiten */}
          {!isSharedListPage && (
            <div
              className='w-full flex justify-center'
              style={{
                backgroundColor: '#0000',
                padding: '8px',
              }}
            >
              <div className='flex gap-4'>
                <div
                  className='skeleton-wave'
                  style={{
                    width: '60px',
                    height: '36px',
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    background:
                      'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-wave 1.5s ease-in-out infinite',
                    borderRadius: '4px',
                  }}
                />
                <div
                  className='skeleton-wave'
                  style={{
                    width: '60px',
                    height: '36px',
                    backgroundColor: 'rgba(80, 80, 80, 0.4)',
                    background:
                      'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-wave 1.5s ease-in-out infinite',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          )}

          {/* ECHTES Main Layout */}
          <main
            className='w-full px-4 py-6'
            style={{ backgroundColor: '#000' }}
          >
            <div className='mx-auto'>
              {' '}
              {/* ECHTE Filter - exakt wie SearchFilters.tsx mit korrektem mobilen Layout */}
              <div className='flex flex-col gap-4 xl:flex-row md:items-center justify-center mb-6 max-w-[1400px] mx-auto'>
                {/* Erste Box: Search + Add Buttons */}
                <div className='flex flex-col lg:flex-row items-center gap-2'>
                  {/* Search Field */}
                  <div style={{ width: '250px', flexShrink: 0 }}>
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.23)',
                      }}
                    />
                  </div>

                  {/* Add Button Container - responsive wie im echten Layout */}
                  <div className='flex flex-row items-center gap-2 w-[250px] xl:w-auto justify-between'>
                    {/* Add Button (nur für Hauptseiten) */}
                    {!isSharedListPage && (
                      <div style={{ flexShrink: 0 }}>
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(80, 80, 80, 0.4)',
                            background:
                              'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                          }}
                        />
                      </div>
                    )}

                    {/* Discover Button (nur für Hauptseiten) */}
                    {!isSharedListPage && (
                      <div style={{ flexShrink: 0 }}>
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(80, 80, 80, 0.4)',
                            background:
                              'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                          }}
                        />
                      </div>
                    )}

                    {/* Recommendations Button (nur für Hauptseiten) */}
                    {!isSharedListPage && (
                      <div style={{ flexShrink: 0 }}>
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(80, 80, 80, 0.4)',
                            background:
                              'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Zweite Box: Genre/Provider Selects */}
                <div className='flex flex-col lg:flex-row items-center gap-2'>
                  {/* Genre Select */}
                  <div className='w-[250px]'>
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.23)',
                      }}
                    />
                  </div>

                  {/* Provider Select */}
                  <div className='w-[250px]'>
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.23)',
                      }}
                    />
                  </div>
                </div>

                {/* Dritte Box: Action Buttons (nur für Hauptseiten) - nur 2 Buttons */}
                {!isSharedListPage && (
                  <div className='flex gap-3 justify-center md:justify-start mt-0'>
                    {/* Watchlist Button */}
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.23)',
                      }}
                    />
                    {/* Next Watch Button */}
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.23)',
                      }}
                    />
                  </div>
                )}
              </div>
              {/* ECHTE Legende - horizontal zentriert wie im echten Layout */}
              {!isSharedListPage && (
                <div className='flex items-center justify-center gap-6 max-w-[1400px] mx-auto mb-6'>
                  <div
                    className='skeleton-wave'
                    style={{
                      width: '90px',
                      height: '14px',
                      backgroundColor: 'rgba(80, 80, 80, 0.4)',
                      background:
                        'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                      borderRadius: '4px',
                    }}
                  />
                  <div className='flex items-center gap-2'>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#9c27b0',
                      }}
                    />
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '50px',
                        height: '14px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#4caf50',
                      }}
                    />
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '50px',
                        height: '14px',
                        backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        background:
                          'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div
                    className='skeleton-wave'
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'rgba(80, 80, 80, 0.4)',
                      background:
                        'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                      borderRadius: '50%',
                    }}
                  />
                </div>
              )}
              {/* ECHTES Grid Layout - exakt wie die echten Cards */}
              <div className='flex flex-row flex-wrap justify-center gap-20'>
                {Array.from({ length: 20 }, (_, index) => (
                  <div key={index} className='w-[230px]'>
                    <div
                      style={{
                        height: '445px',
                        backgroundColor: 'rgba(40, 40, 40, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        boxShadow:
                          'rgba(255, 255, 255, 0.1) 8px 8px 20px 0px, rgba(255, 255, 255, 0.1) -5px -5px 20px 0px',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Poster Bereich */}
                      <div
                        style={{
                          flex: '1',
                          aspectRatio: '2/3',
                          backgroundColor: 'rgba(80, 80, 80, 0.4)',
                        }}
                      >
                        <div
                          className='w-full h-full'
                          style={{
                            background:
                              'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                          }}
                        />
                      </div>

                      {/* Titel Bereich */}
                      <div
                        style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '80%',
                            height: '24px',
                            backgroundColor: 'rgba(80, 80, 80, 0.4)',
                            borderRadius: '4px',
                            background:
                              'linear-gradient(90deg, rgba(80, 80, 80, 0.4) 25%, rgba(100, 100, 100, 0.3) 50%, rgba(80, 80, 80, 0.4) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Hidden App loading in background */}
          <div
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              visibility: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      </GlobalLoadingContext.Provider>
    );
  }

  return (
    <GlobalLoadingContext.Provider value={contextValue}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error(
      'useGlobalLoading must be used within GlobalLoadingProvider'
    );
  }
  return context;
};
