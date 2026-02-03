import React from 'react';

interface Provider {
  provider_id?: number;
  provider_name?: string;
  logo_path?: string;
  logo?: string;
  id?: number;
  name?: string;
}

interface ProviderBadgesProps {
  providers?: Provider[] | {
    results?: { DE?: { flatrate?: Provider[] } };
    DE?: { flatrate?: Provider[] };
    flatrate?: Provider[];
  } | null;
  size?: 'small' | 'medium' | 'large';
  maxDisplay?: number;
  showNames?: boolean;
  /** Titel für Deep Link Suche (Serie/Film Name) */
  searchTitle?: string;
  /** TMDB ID für direktere Links (falls verfügbar) */
  tmdbId?: number;
  /** Media Type für spezifischere Links */
  mediaType?: 'tv' | 'movie';
}

// Deep Link Mapping für deutsche Streaming-Anbieter
// Provider IDs von TMDB: https://developer.themoviedb.org/reference/watch-provider-tv-list
const PROVIDER_LINKS: Record<number, {
  web: (title: string, tmdbId?: number) => string;
  name: string;
}> = {
  // Netflix (ID: 8)
  8: {
    web: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    name: 'Netflix'
  },
  // Amazon Prime Video (ID: 9, 119)
  9: {
    web: (title) => `https://www.amazon.de/s?k=${encodeURIComponent(title)}&i=instant-video`,
    name: 'Amazon Prime Video'
  },
  119: {
    web: (title) => `https://www.amazon.de/s?k=${encodeURIComponent(title)}&i=instant-video`,
    name: 'Amazon Prime Video'
  },
  // Disney+ (ID: 337)
  337: {
    web: (title) => `https://www.disneyplus.com/de-de/search?q=${encodeURIComponent(title)}`,
    name: 'Disney Plus'
  },
  // Apple TV+ (ID: 350)
  350: {
    web: (title) => `https://tv.apple.com/de/search?term=${encodeURIComponent(title)}`,
    name: 'Apple TV Plus'
  },
  // Paramount+ (ID: 531)
  531: {
    web: (title) => `https://www.paramountplus.com/de/search/?q=${encodeURIComponent(title)}`,
    name: 'Paramount Plus'
  },
  // WOW / Sky (ID: 30)
  30: {
    web: (title) => `https://www.wowtv.de/suche?search=${encodeURIComponent(title)}`,
    name: 'WOW'
  },
  // Crunchyroll (ID: 283)
  283: {
    web: (title) => `https://www.crunchyroll.com/de/search?q=${encodeURIComponent(title)}`,
    name: 'Crunchyroll'
  },
  // RTL+ (ID: 298)
  298: {
    web: (title) => `https://plus.rtl.de/suche?term=${encodeURIComponent(title)}`,
    name: 'RTL+'
  },
  // Joyn / Joyn Plus (ID: 421, 304)
  421: {
    web: (title) => `https://www.joyn.de/search?q=${encodeURIComponent(title)}`,
    name: 'Joyn Plus'
  },
  304: {
    web: (title) => `https://www.joyn.de/search?q=${encodeURIComponent(title)}`,
    name: 'Joyn'
  },
  // MagentaTV (ID: 178)
  178: {
    web: (title) => `https://web.magentatv.de/search?q=${encodeURIComponent(title)}`,
    name: 'MagentaTV'
  },
  // Freevee (ID: 613)
  613: {
    web: (title) => `https://www.amazon.de/s?k=${encodeURIComponent(title)}&i=instant-video`,
    name: 'Freevee'
  },
  // ADN - Animation Digital Network (ID: 415)
  415: {
    web: (title) => `https://animationdigitalnetwork.de/search/${encodeURIComponent(title)}`,
    name: 'Animation Digital Network'
  },
  // HBO Max / Max (ID: 1899)
  1899: {
    web: (title) => `https://play.hbomax.com/search/result?q=${encodeURIComponent(title)}`,
    name: 'HBO Max'
  },
};

export const ProviderBadges: React.FC<ProviderBadgesProps> = ({
  providers,
  size = 'small',
  maxDisplay = 3,
  showNames = false,
  searchTitle,
  tmdbId,
  mediaType: _mediaType // Reserved for future JustWatch integration
}) => {
  if (!providers || (Array.isArray(providers) && providers.length === 0)) return null;

  // Allowed German streaming providers from config
  const allowedProviders = [
    'Amazon Prime Video',
    'Animation Digital Network',
    'Apple TV Plus',
    'Crunchyroll',
    'Disney Plus',
    'Freevee',
    'HBO Max',
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
    if (lowerName.includes('hbo') || lowerName === 'max') return 'HBO Max';
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

        // Deep Link ermitteln
        const providerConfig = PROVIDER_LINKS[providerId as number];
        const deepLink = searchTitle && providerConfig
          ? providerConfig.web(searchTitle, tmdbId)
          : null;

        const badgeContent = (
          <>
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
          </>
        );

        const badgeStyle: React.CSSProperties = {
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
          position: 'relative',
          cursor: deepLink ? 'pointer' : 'default',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        };

        // Wenn Deep Link vorhanden, als klickbares Element rendern
        if (deepLink) {
          return (
            <a
              key={providerId}
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              title={`${providerName} öffnen`}
              style={{
                ...badgeStyle,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {badgeContent}
            </a>
          );
        }

        return (
          <div
            key={providerId}
            style={badgeStyle}
            title={providerName}
          >
            {badgeContent}
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