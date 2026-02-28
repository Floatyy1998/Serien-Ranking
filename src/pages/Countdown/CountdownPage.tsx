import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesCountdowns, SeriesCountdown } from '../../hooks/useSeriesCountdowns';
import { PageHeader, LoadingSpinner, EmptyState, PageLayout } from '../../components/ui';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

const HeroCard: React.FC<{
  item: SeriesCountdown;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const accentColor = '#a855f7';

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${accentColor}40`,
        padding: 0,
        textAlign: 'left',
        background: '#0a0a0a',
      }}
    >
      {/* Background poster with heavy blur */}
      {item.posterUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${item.posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.35)',
            transform: 'scale(1.2)',
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${accentColor}30 0%, rgba(0,0,0,0.6) 100%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 20px',
        }}
      >
        {/* Poster */}
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={`Poster von ${item.title}`}
            style={{
              width: 90,
              height: 135,
              borderRadius: 12,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 135,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarMonth style={{ fontSize: 36, color: accentColor, opacity: 0.5 }} />
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: accentColor,
            }}
          >
            Als nächstes
          </p>
          <h2
            style={{
              margin: '6px 0 0',
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            Staffel {item.seasonNumber}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {formatDate(item.nextDate)}
          </p>
        </div>

        {/* Countdown circle */}
        <div
          style={{
            flexShrink: 0,
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: `${accentColor}30`,
            border: `2px solid ${accentColor}70`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.daysUntil === 0 ? (
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Heute
            </span>
          ) : (
            <>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {item.daysUntil}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {item.daysUntil === 1 ? 'Tag' : 'Tage'}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const CountdownItem: React.FC<{
  item: SeriesCountdown;
  index: number;
  onClick: () => void;
}> = ({ item, index, onClick }) => {
  const { currentTheme } = useTheme();
  const accentColor = '#a855f7';

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 14px',
        borderRadius: 16,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        border: `1px solid ${currentTheme.border.default}`,
        background: currentTheme.background.surface,
      }}
    >
      {/* Poster */}
      {item.posterUrl ? (
        <img
          src={item.posterUrl}
          alt={`Poster von ${item.title}`}
          style={{
            width: 44,
            height: 66,
            borderRadius: 10,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 66,
            borderRadius: 10,
            background: `${currentTheme.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CalendarMonth style={{ fontSize: 20, color: currentTheme.primary, opacity: 0.4 }} />
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: currentTheme.text.secondary }}>
          Staffel {item.seasonNumber} &middot; {formatDate(item.nextDate)}
        </p>
      </div>

      {/* Day count */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 44,
        }}
      >
        {item.daysUntil === 0 ? (
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: accentColor,
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Heute
          </span>
        ) : (
          <>
            <span style={{ fontSize: 20, fontWeight: 800, color: accentColor, lineHeight: 1 }}>
              {item.daysUntil}
            </span>
            <span style={{ fontSize: 9, color: currentTheme.text.muted, marginTop: 2 }}>
              {item.daysUntil === 1 ? 'Tag' : 'Tage'}
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
};

export const CountdownPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { countdowns, loading } = useSeriesCountdowns();

  const hero = countdowns[0];
  const rest = countdowns.slice(1);

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, '#a855f7']}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader
        title="Countdown"
        icon={<CalendarMonth style={{ fontSize: 28 }} />}
        gradientFrom={currentTheme.primary}
        gradientTo="#a855f7"
      />

      <div
        style={{
          padding: '0 20px',
          paddingBottom: 100,
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {loading && <LoadingSpinner text="Countdowns werden geladen..." />}

        {!loading && countdowns.length === 0 && (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: 48 }} />}
            title="Keine kommenden Staffeln"
            description="Sobald Serien in deiner Liste neue Staffeln ankündigen, siehst du sie hier"
            iconColor={currentTheme.text.secondary}
          />
        )}

        {!loading && hero && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HeroCard item={hero} onClick={() => navigate(`/series/${hero.seriesId}`)} />

            {rest.length > 0 && (
              <>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 13,
                    fontWeight: 600,
                    color: currentTheme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Weitere ({rest.length})
                </p>
                {rest.map((item, i) => (
                  <CountdownItem
                    key={item.seriesId}
                    item={item}
                    index={i}
                    onClick={() => navigate(`/series/${item.seriesId}`)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
