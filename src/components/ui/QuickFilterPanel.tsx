import { Tooltip } from '@mui/material';
import { genreMenuItems, providerMenuItems } from '../../config/menuItems';
import { useTheme } from '../../contexts/ThemeContextDef';
import { SearchInput } from './SearchInput';
import { GradientText } from './GradientText';

interface QuickFilterPanelProps {
  isMovieMode: boolean;
  isRatingsMode: boolean;
  hasBottomNav: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedGenre: string;
  setSelectedGenre: (v: string) => void;
  selectedProvider: string;
  setSelectedProvider: (v: string) => void;
  selectedQuickFilter: string;
  setSelectedQuickFilter: (v: string) => void;
  selectedSort: string;
  setSelectedSort: (v: string) => void;
  quickFilters: { value: string; label: string; icon: React.ElementType }[];
  activeFiltersCount: number;
  clearFilters: () => void;
}

export const QuickFilterPanel: React.FC<QuickFilterPanelProps> = ({
  isMovieMode,
  isRatingsMode,
  hasBottomNav,
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  selectedProvider,
  setSelectedProvider,
  selectedQuickFilter,
  setSelectedQuickFilter,
  selectedSort,
  setSelectedSort,
  quickFilters,
  activeFiltersCount,
  clearFilters,
}) => {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        width: '90%',
        alignSelf: 'center',
        paddingBottom: hasBottomNav ? '90px' : '24px',
        overflowY: 'auto',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <GradientText
          as="h2"
          style={{
            fontSize: '20px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            margin: 0,
          }}
        >
          Filter & Sortierung
        </GradientText>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              background: `${currentTheme.accent}1a`,
              border: `1px solid ${currentTheme.accent}4d`,
              borderRadius: '14px',
              padding: '6px 12px',
              color: currentTheme.accent,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.text.secondary,
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Suche
        </label>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`${isMovieMode ? 'Film' : 'Serie'} suchen...`}
        />
      </div>

      {/* Quick Filters */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.text.secondary,
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Schnellfilter
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedQuickFilter === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => setSelectedQuickFilter(isActive ? '' : filter.value)}
                style={{
                  padding: '12px',
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`
                    : `rgba(255,255,255,0.05)`,
                  border: `1px solid ${isActive ? 'transparent' : `${currentTheme.border.default}`}`,
                  borderRadius: '14px',
                  color: currentTheme.text.secondary,
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: isActive ? 'none' : 'blur(8px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Icon style={{ fontSize: '16px' }} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Options - Only for Ratings Mode */}
      {isRatingsMode && (
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: currentTheme.text.secondary,
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Sortierung
          </label>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: `rgba(255,255,255,0.05)`,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              color: currentTheme.text.secondary,
              fontSize: '15px',
            }}
          >
            <option
              value="rating-desc"
              style={{
                background: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              Beste zuerst
            </option>
            <option
              value="rating-asc"
              style={{
                background: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              Schlechteste zuerst
            </option>
            <option
              value="name-asc"
              style={{
                background: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              Name A-Z
            </option>
            <option
              value="name-desc"
              style={{
                background: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              Name Z-A
            </option>
            <option
              value="date-desc"
              style={{
                background: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              Neueste zuerst
            </option>
          </select>
        </div>
      )}

      {/* Genre Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.text.secondary,
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Genre
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {genreMenuItems.map((genre) => {
            const isActive = selectedGenre === genre.value;

            return (
              <button
                key={genre.value}
                onClick={() => setSelectedGenre(isActive ? '' : genre.value)}
                style={{
                  padding: '10px',
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`
                    : `rgba(255,255,255,0.05)`,
                  border: `1px solid ${isActive ? 'transparent' : `${currentTheme.border.default}`}`,
                  borderRadius: '14px',
                  color: currentTheme.text.secondary,
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  backdropFilter: isActive ? 'none' : 'blur(8px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {genre.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Filter */}
      <div>
        <label
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: currentTheme.text.secondary,
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Streaming-Anbieter
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {providerMenuItems.map((provider) => {
            const isActive = selectedProvider === provider.value;

            return (
              <Tooltip key={provider.value} title={provider.label} arrow>
                <button
                  onClick={() => setSelectedProvider(isActive ? '' : provider.value)}
                  style={{
                    padding: '12px',
                    background: isActive
                      ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`
                      : `rgba(255,255,255,0.05)`,
                    border: `1px solid ${isActive ? 'transparent' : `${currentTheme.border.default}`}`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: isActive ? 'none' : 'blur(8px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {(provider as { icon?: string }).icon ? (
                    <img
                      src={(provider as { icon?: string }).icon}
                      alt={provider.label}
                      style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'contain',
                        filter: isActive ? 'brightness(1.2)' : 'none',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: currentTheme.text.secondary,
                        textAlign: 'center',
                        lineHeight: '1.2',
                      }}
                    >
                      {provider.label}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
