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
        {/* Material-UI Theme-basierte Skeleton-Struktur */}
        <div
          style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#121212', // Material-UI dark theme background
          }}
        >
          {/* Container wie in der neuen MainPage */}
          <div
            style={{
              maxWidth: '100%',
              margin: '0 auto',
              padding:
                location.pathname === '/' ? '16px 8px 64px' : '16px 24px',
            }}
          >
            {/* Header Skeleton - nur für MainPage (/) */}
            {location.pathname === '/' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                  background:
                    'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
                  borderRadius: '8px',
                  padding: '24px',
                  color: 'white',
                  minHeight: '120px',
                  flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                  gap: window.innerWidth < 768 ? '16px' : '0',
                }}
              >
                {/* User Avatar und Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    width: window.innerWidth < 768 ? '100%' : 'auto',
                    justifyContent:
                      window.innerWidth < 768 ? 'center' : 'flex-start',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                  }}
                >
                  <div
                    className='skeleton-wave'
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '3px solid rgba(255, 255, 255, 0.2)',
                      background:
                        'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      textAlign: window.innerWidth < 640 ? 'center' : 'left',
                    }}
                  >
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '280px',
                        height: '34px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        background:
                          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        marginBottom: '8px',
                      }}
                    />
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '350px',
                        height: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        background:
                          'linear-gradient(90deg, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        marginTop: '16px',
                      }}
                    />
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '280px',
                        height: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        background:
                          'linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        marginTop: '8px',
                      }}
                    />
                  </div>
                </div>
                {/* Freunde Button - neutrale Farben */}
                <div
                  className='skeleton-wave'
                  style={{
                    width: '100px',
                    height: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    background:
                      'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-wave 1.5s ease-in-out infinite',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              </div>
            )}

            {/* Statistiken Grid - nur für MainPage (/) */}
            {location.pathname === '/' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    window.innerWidth < 640
                      ? 'repeat(2, 1fr)'
                      : 'repeat(6, 1fr)',
                  gap: '24px',
                  marginBottom: '32px',
                }}
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '4px',
                      padding: '24px',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display:
                        window.innerWidth < 640 && index >= 2
                          ? 'none'
                          : 'block',
                    }}
                  >
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '60px',
                        height: '34px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        background:
                          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        margin: '0 auto 16px',
                      }}
                    />
                    <div
                      className='skeleton-wave'
                      style={{
                        width: '80px',
                        height: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        background:
                          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-wave 1.5s ease-in-out infinite',
                        borderRadius: '4px',
                        margin: '0 auto',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tabs Skeleton - nur für MainPage (/) */}
            {location.pathname === '/' && (
              <div
                style={{
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  overflow: 'hidden',
                }}
              >
                {/* Tab Header - Material-UI Tab style */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                    height: '72px',
                  }}
                >
                  <div
                    className='skeleton-wave'
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      background:
                        'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <div
                    style={{
                      width: '1px',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    }}
                  />
                  <div
                    className='skeleton-wave'
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      background:
                        'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Tab Content */}
                <div style={{ padding: '16px' }}>
                  {/* Material-UI Filter Layout - responsive */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      alignItems: 'center',
                      gap: window.innerWidth < 768 ? '16px' : '8px',
                      marginBottom: '24px',
                      maxWidth: '1400px',
                      margin: '0 auto 24px',
                      padding: '16px',
                      flexWrap: window.innerWidth >= 768 ? 'wrap' : 'nowrap',
                      justifyContent: 'center',
                    }}
                  >
                    {window.innerWidth < 768 ? (
                      <>
                        {/* Mobile Layout - vertikal */}
                        {/* Suchfeld */}
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Add, Discover, Recommendations Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            width: '100%',
                          }}
                        >
                          {/* Add Button */}
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '8px',
                              flexShrink: 0,
                            }}
                          />

                          {/* Discover Button */}
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '8px',
                              flexShrink: 0,
                            }}
                          />

                          {/* Recommendations Button */}
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '8px',
                              flexShrink: 0,
                            }}
                          />
                        </div>

                        {/* Genre Select */}
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Provider Select */}
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Watchlist und Next Watch Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            width: '100%',
                          }}
                        >
                          {/* Watchlist Button */}
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '8px',
                              flexShrink: 0,
                            }}
                          />

                          {/* Next Watch Button */}
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '8px',
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Desktop Layout - horizontal nebeneinander */}
                        {/* Suchfeld */}
                        <div style={{ width: '250px', flexShrink: 0 }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Add Button */}
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                            background:
                              'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        />

                        {/* Discover Button */}
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                            background:
                              'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        />

                        {/* Recommendations Button */}
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                            background:
                              'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        />

                        {/* Genre Select */}
                        <div style={{ width: '250px', flexShrink: 0 }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Provider Select */}
                        <div style={{ width: '250px', flexShrink: 0 }}>
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '56px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.23)',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                              borderRadius: '4px',
                            }}
                          />
                        </div>

                        {/* Watchlist Button */}
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                            background:
                              'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        />

                        {/* Next Watch Button */}
                        <div
                          className='skeleton-wave'
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.23)',
                            background:
                              'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                            backgroundSize: '200% 100%',
                            animation:
                              'skeleton-wave 1.5s ease-in-out infinite',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        />
                      </>
                    )}
                  </div>

                  {/* Material-UI Cards Grid - wie SeriesCard.tsx */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '20px',
                    }}
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <div key={index} style={{ width: '230px' }}>
                        <div
                          style={{
                            height: '385px', // SeriesCard height
                            backgroundColor: '#1e1e1e',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '4px',
                            boxShadow:
                              'rgba(255, 255, 255, 0.1) 8px 8px 20px 0px, rgba(255, 255, 255, 0.1) -5px -5px 20px 0px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Poster Bereich - aspect ratio 2:3 */}
                          <div
                            style={{
                              aspectRatio: '2/3',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              position: 'relative',
                            }}
                          >
                            <div
                              className='skeleton-wave'
                              style={{
                                width: '100%',
                                height: '100%',
                                background:
                                  'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                                backgroundSize: '200% 100%',
                                animation:
                                  'skeleton-wave 1.5s ease-in-out infinite',
                              }}
                            />
                            {/* Rating Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                padding: '4px 8px',
                              }}
                            >
                              <div
                                className='skeleton-wave'
                                style={{
                                  width: '30px',
                                  height: '16px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  background:
                                    'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                                  backgroundSize: '200% 100%',
                                  animation:
                                    'skeleton-wave 1.5s ease-in-out infinite',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                            {/* Watchlist Icon */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '50%',
                                padding: '8px',
                                width: '32px',
                                height: '32px',
                              }}
                            >
                              <div
                                className='skeleton-wave'
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  background:
                                    'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
                                  backgroundSize: '200% 100%',
                                  animation:
                                    'skeleton-wave 1.5s ease-in-out infinite',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Titel Bereich - CardContent */}
                          <div
                            style={{
                              padding: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 1,
                            }}
                          >
                            <div
                              className='skeleton-wave'
                              style={{
                                width: '80%',
                                height: '20px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                background:
                                  'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
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
              </div>
            )}

            {/* Für andere Seiten - vereinfachtes Layout */}
            {location.pathname !== '/' && !isSharedListPage && (
              <div style={{ padding: '16px' }}>
                {/* Filter Area für andere Seiten */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '24px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    className='skeleton-wave'
                    style={{
                      width: '250px',
                      height: '56px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.23)',
                      background:
                        'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                      borderRadius: '4px',
                    }}
                  />
                  <div
                    className='skeleton-wave'
                    style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.23)',
                      background:
                        'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-wave 1.5s ease-in-out infinite',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                {/* Grid für andere Seiten */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '20px',
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <div key={index} style={{ width: '230px' }}>
                      <div
                        style={{
                          height: '385px',
                          backgroundColor: '#1e1e1e',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '4px',
                          boxShadow:
                            'rgba(255, 255, 255, 0.1) 8px 8px 20px 0px, rgba(255, 255, 255, 0.1) -5px -5px 20px 0px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: '2/3',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '100%',
                              height: '100%',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%)',
                              backgroundSize: '200% 100%',
                              animation:
                                'skeleton-wave 1.5s ease-in-out infinite',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                          }}
                        >
                          <div
                            className='skeleton-wave'
                            style={{
                              width: '80%',
                              height: '20px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              background:
                                'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
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
            )}
          </div>

          {/* CSS Animations */}
          <style>
            {`
              @keyframes skeleton-wave {
                0% {
                  background-position: -200px 0;
                }
                100% {
                  background-position: calc(200px + 100%) 0;
                }
              }
            `}
          </style>

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
