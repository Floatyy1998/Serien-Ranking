import {
  ArrowForward,
  CalendarMonth,
  FilterAlt,
  NewReleases,
  PlaylistAddCheck,
  Replay,
  Sort,
  TrendingUp,
  ViewQuilt,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import './PatchNotesPage.css';

interface Feature {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  link?: { label: string; path: string };
}

interface PatchRelease {
  version: string;
  date: string;
  features: Feature[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const PatchNotesPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const releases: PatchRelease[] = [
    {
      version: 'März 2026',
      date: '2026-03-01',
      features: [
        {
          icon: <CalendarMonth />,
          color: '#6366f1',
          title: 'TV-Kalender überarbeitet',
          description:
            'Neue Wochenansicht mit Navigation, Desktop-Grid-Layout mit 7-Spalten und automatische Episoden-Gruppierung pro Serie.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <TrendingUp />,
          color: '#10b981',
          title: 'Serien-Fortschritt',
          description:
            'Progress-Bars auf jeder Watchlist-Karte zeigen wie weit du bist – mit Staffel-Info und verbleibenden Episoden.',
          link: { label: 'Watchlist öffnen', path: '/watchlist' },
        },
        {
          icon: <Sort />,
          color: '#f59e0b',
          title: 'Neue Sortierung',
          description:
            'Sortiere deine Watchlist nach Fortschritt oder verbleibenden Episoden – finde schnell was fast fertig ist.',
          link: { label: 'Watchlist öffnen', path: '/watchlist' },
        },
        {
          icon: <FilterAlt />,
          color: '#ec4899',
          title: 'Provider-Filter',
          description:
            'Filtere deine Watchlist nach Streaming-Anbieter – zeige nur Netflix, Disney+ oder andere.',
          link: { label: 'Watchlist öffnen', path: '/watchlist' },
        },
        {
          icon: <Replay />,
          color: '#06b6d4',
          title: 'Rewatch-Fortschritt',
          description:
            'Rewatches zeigen jetzt ihren eigenen Fortschritt statt den der Original-Serie.',
          link: { label: 'Watchlist öffnen', path: '/watch-next' },
        },
        {
          icon: <PlaylistAddCheck />,
          color: 'var(--theme-secondary-gradient, #8b5cf6)',
          title: '"Ich bin bei…" Markierung',
          description:
            'Wähle Staffel und Episode – alles davor wird automatisch als gesehen markiert. Perfekt für Serien die du woanders geschaut hast.',
        },
      ],
    },
    {
      version: 'Februar 2026',
      date: '2026-02-28',
      features: [
        {
          icon: <ViewQuilt />,
          color: '#a855f7',
          title: 'Homepage Layout',
          description:
            'Sektionen auf der Homepage sortieren, ausblenden und nach deinem Geschmack anpassen.',
          link: { label: 'Layout anpassen', path: '/home-layout' },
        },
      ],
    },
  ];

  return (
    <div className="patch-notes-page">
      <PageHeader
        title="Patch Notes"
        gradientTo={currentTheme.primary}
        icon={<NewReleases style={{ fontSize: 22, color: currentTheme.primary }} />}
      />

      <div className="pn-releases">
        {releases.map((release, releaseIdx) => (
          <motion.div
            key={release.version}
            className="pn-release"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: releaseIdx * 0.15 }}
          >
            <div className="pn-release-header">
              <div
                className="pn-version-badge"
                style={{
                  background: `${currentTheme.primary}20`,
                  color: currentTheme.primary,
                }}
              >
                {release.version}
              </div>
              <span className="pn-release-date" style={{ color: currentTheme.text.muted }}>
                {formatDate(release.date)}
              </span>
            </div>

            <div className="pn-features">
              {release.features.map((feature, featureIdx) => (
                <motion.div
                  key={featureIdx}
                  className="pn-feature"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: releaseIdx * 0.15 + featureIdx * 0.06 }}
                  onClick={feature.link ? () => navigate(feature.link!.path) : undefined}
                  style={{ cursor: feature.link ? 'pointer' : 'default' }}
                >
                  <div
                    className="pn-feature-icon"
                    style={{
                      background: `${feature.color}18`,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div className="pn-feature-content">
                    <div className="pn-feature-title" style={{ color: currentTheme.text.primary }}>
                      {feature.title}
                    </div>
                    <div className="pn-feature-desc" style={{ color: currentTheme.text.secondary }}>
                      {feature.description}
                    </div>
                  </div>
                  {feature.link && (
                    <ArrowForward
                      className="pn-feature-arrow"
                      style={{ color: currentTheme.text.muted }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
