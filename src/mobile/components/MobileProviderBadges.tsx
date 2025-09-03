import React from 'react';

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
  logo?: string;
}

interface MobileProviderBadgesProps {
  providers?: Provider[] | any;
  size?: 'small' | 'medium' | 'large';
  maxDisplay?: number;
  showNames?: boolean;
}

export const MobileProviderBadges: React.FC<MobileProviderBadgesProps> = ({
  providers,
  size = 'small',
  maxDisplay = 3,
  showNames = false
}) => {
  if (!providers || providers.length === 0) return null;

  // Handle different provider data structures
  let providerList: Provider[] = [];
  
  if (Array.isArray(providers)) {
    providerList = providers;
  } else if (providers.results?.DE?.flatrate) {
    providerList = providers.results.DE.flatrate;
  } else if (providers.DE?.flatrate) {
    providerList = providers.DE.flatrate;
  }

  if (providerList.length === 0) return null;

  const displayProviders = providerList.slice(0, maxDisplay);
  const remainingCount = providerList.length - maxDisplay;

  const sizeStyles = {
    small: { width: 20, height: 20, fontSize: '9px' },
    medium: { width: 28, height: 28, fontSize: '10px' },
    large: { width: 36, height: 36, fontSize: '11px' }
  };

  const style = sizeStyles[size];

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      {displayProviders.map((provider) => {
        const logoPath = provider.logo_path || provider.logo;
        
        return (
          <div
            key={provider.provider_id}
            style={{
              width: style.width,
              height: style.height,
              borderRadius: '6px',
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            title={provider.provider_name}
          >
            {logoPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${logoPath}`}
                alt={provider.provider_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            
            <div style={{
              display: logoPath ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: style.fontSize,
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              {provider.provider_name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div style={{
          width: style.width,
          height: style.height,
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: style.fontSize,
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          +{remainingCount}
        </div>
      )}
      
      {showNames && displayProviders.length === 1 && (
        <span style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginLeft: '4px'
        }}>
          {displayProviders[0].provider_name}
        </span>
      )}
    </div>
  );
};