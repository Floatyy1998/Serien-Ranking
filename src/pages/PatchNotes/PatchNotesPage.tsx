import {
  ArrowForward,
  AutoAwesome,
  CalendarMonth,
  FilterAlt,
  LocalFireDepartment,
  Navigation,
  NewReleases,
  PauseCircle,
  PlaylistAddCheck,
  Replay,
  SmartDisplay,
  Sort,
  Today,
  TrendingUp,
  Tune,
  ViewQuilt,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
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
      version: 'März 2026 – QoL Update',
      date: '2026-03-27',
      features: [
        {
          icon: <Today />,
          color: '#6366f1',
          title: 'Kalender: Auto-Scroll zum heutigen Tag',
          description:
            'Auf dem Handy scrollt der Kalender jetzt automatisch zum heutigen Wochentag – kein manuelles Suchen mehr.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <PauseCircle />,
          color: '#a78bfa',
          title: 'Kalender: Staffelpause & Staffelende Chips',
          description:
            'Neue Badges zeigen dir direkt im Kalender ob eine Serie in die Pause geht oder das Staffelfinale kommt. Erkennt auch Pausen wenn kommende Folgen noch kein Datum haben.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <SmartDisplay />,
          color: '#00cec9',
          title: 'Provider-Badge auf allen Karten',
          description:
            'Kleine Streaming-Logos (Crunchyroll, Netflix, etc.) auf dem Poster – überall: Weiterschauen, Heute Neu, Rewatches und Watchlist.',
        },
        {
          icon: <Tune />,
          color: '#10b981',
          title: 'Smarter Status-Badge',
          description:
            'Der Status-Badge im Serien-Detail zeigt jetzt den Ausstrahlungsrhythmus: "Läuft · Sonntags neue Folge" oder "Läuft · Alle 2 Wochen" statt nur "Fortlaufend".',
        },
        {
          icon: <CalendarMonth />,
          color: currentTheme.accent,
          title: 'Nächste Folge im Hero',
          description:
            'Neuer Chip im Serien-Detail zeigt sofort die nächste Episode mit Datum an – ohne scrollen zu müssen.',
        },
        {
          icon: <Replay />,
          color: '#f59e0b',
          title: '"Zuletzt gesehen" in Weiterschauen',
          description:
            'Jede Karte in Weiterschauen zeigt jetzt wann du die Serie zuletzt geschaut hast – hilft beim Priorisieren.',
        },
        {
          icon: <PlaylistAddCheck />,
          color: '#ec4899',
          title: 'Staffel & Tab merken',
          description:
            'Wenn du in einem Serien-Detail eine Staffel oder Tab (Info/Besetzung/KI-Guide) wählst und zurücknavigierst, landest du wieder an der gleichen Stelle.',
        },
      ],
    },
    {
      version: 'März 2026 – Update 3',
      date: '2026-03-27',
      features: [
        {
          icon: <LocalFireDepartment />,
          color: '#f97316',
          title: 'Trending, Saisonal & Bestbewertet Redesign',
          description:
            'Komplett neues Card-Design im Kino-Stil: Trending-Cards mit Rang-Nummer in abgerundeter Ecke, Genre-Anzeige, TMDB-Rating und Erscheinungsjahr – einheitlich für alle drei Sektionen.',
        },
      ],
    },
    {
      version: 'März 2026 – Update 2',
      date: '2026-03-26',
      features: [
        {
          icon: <AutoAwesome />,
          color: '#a855f7',
          title: 'KI-Empfehlungen',
          description:
            'Personalisierte Serien- und Film-Empfehlungen basierend auf deinen Bewertungen, Binge-Verhalten, Genre-Vorlieben und Watch-Patterns. Mit Poster, TMDB-Rating und Streaming-Anbietern – klick auf eine Empfehlung um direkt zur Serie zu gelangen.',
          link: { label: 'Empfehlungen ansehen', path: '/taste-profile' },
        },
        {
          icon: <AutoAwesome />,
          color: '#ec4899',
          title: 'Proaktive Recaps verbessert',
          description:
            'Recaps werden nicht mehr automatisch geladen – erst wenn du auf "Recap lesen" klickst. Spart KI-Anfragen und lädt schneller.',
        },
        {
          icon: <Navigation />,
          color: '#00cec9',
          title: 'Navbar Redesign',
          description:
            'Neue Glassmorphism-Navigation mit Glow-Effekt auf dem aktiven Tab. Bessere Lesbarkeit der inaktiven Icons.',
        },
      ],
    },
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
          color: currentTheme.accent,
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
          color: currentTheme.accent,
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
          color: currentTheme.accent,
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
        icon={<NewReleases style={{ fontSize: 22, color: currentTheme.accent }} />}
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
                  onClick={
                    feature.link
                      ? () => {
                          navigate(feature.link?.path ?? '/');
                        }
                      : undefined
                  }
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
