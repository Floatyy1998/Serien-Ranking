import React from 'react';

interface Provider {
  provider_id?: number;
  provider_name?: string;
  logo_path?: string;
  logo?: string;
  id?: number;
  name?: string;
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

  // Allowed German streaming providers from config
  const allowedProviders = [
    'Amazon Prime Video',
    'Animation Digital Network',
    'Apple TV Plus',
    'Crunchyroll',
    'Disney Plus',
    'Freevee',
    'Joyn Plus',
    'MagentaTV',
    'Netflix',
    'Paramount Plus',
    'RTL+',
    'WOW'
  ];

  // Handle different provider data structures
  let providerList: Provider[] = [];
  
  // Deduplizierung: Behandle Netflix-Varianten als eines
  const normalizeProviderName = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('netflix')) return 'Netflix';
    if (lowerName.includes('disney')) return 'Disney Plus';
    if (lowerName.includes('amazon') || lowerName.includes('prime video')) return 'Amazon Prime Video';
    if (lowerName.includes('paramount')) return 'Paramount Plus';
    if (lowerName.includes('apple tv')) return 'Apple TV Plus';
    if (lowerName.includes('joyn')) return 'Joyn Plus';
    return name;
  };
  
  const seenProviders = new Set<string>();
  
  const filterAndDedupe = (p: Provider) => {
    if (!p || !(p.provider_name || p.name || p.provider_id || p.id)) return false;
    const name = p.provider_name || p.name || '';
    const normalizedName = normalizeProviderName(name);
    
    // Check if already seen (dedupe)
    if (seenProviders.has(normalizedName)) return false;
    
    // Check if allowed
    const isAllowed = allowedProviders.some(allowed => 
      normalizedName.toLowerCase().includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(normalizedName.toLowerCase())
    );
    
    if (isAllowed) {
      seenProviders.add(normalizedName);
      return true;
    }
    return false;
  };
  
  if (Array.isArray(providers)) {
    providerList = providers.filter(filterAndDedupe);
  } else if (providers.results?.DE?.flatrate) {
    providerList = providers.results.DE.flatrate.filter(filterAndDedupe);
  } else if (providers.DE?.flatrate) {
    providerList = providers.DE.flatrate.filter(filterAndDedupe);
  } else if (providers.flatrate) {
    providerList = providers.flatrate.filter(filterAndDedupe);
  }

  if (!providerList || providerList.length === 0) return null;

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
      {displayProviders.map((provider, index) => {
        const logoPath = provider.logo_path || provider.logo;
        const providerName = provider.provider_name || provider.name || 'Unknown';
        const providerId = provider.provider_id || provider.id || index;
        
        return (
          <div
            key={providerId}
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
            title={providerName}
          >
            {logoPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${logoPath}`}
                alt={providerName}
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
              {providerName.substring(0, 2).toUpperCase()}
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
          {displayProviders[0].provider_name || displayProviders[0].name || 'Unknown'}
        </span>
      )}
    </div>
  );
};