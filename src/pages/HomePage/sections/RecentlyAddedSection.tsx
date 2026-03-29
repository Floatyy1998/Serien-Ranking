import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { getRecentlyAdded } from '../../../lib/recentlyAdded';

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return 'Gerade eben';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gestern';
  return `Vor ${days} Tagen`;
}

export const RecentlyAddedSection: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const items = getRecentlyAdded();

  if (items.length === 0) return null;

  return (
    <section style={{ marginBottom: '24px' }}>
      <SectionHeader
        icon={<AddCircleOutline />}
        iconColor={currentTheme.status.success}
        title="Zuletzt hinzugefügt"
      />
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '0 20px 8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() =>
              navigate(item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`)
            }
            style={{
              flexShrink: 0,
              width: '110px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '165px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
                marginBottom: '6px',
              }}
            >
              {item.poster ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster}`}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentTheme.text.muted,
                    fontSize: '11px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  {item.title}
                </div>
              )}
            </div>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: currentTheme.text.primary,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.title}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: currentTheme.text.muted,
                margin: '2px 0 0',
              }}
            >
              {formatRelative(item.addedAt)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
