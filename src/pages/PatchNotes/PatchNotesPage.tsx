import {
  ArrowForward,
  AutoAwesome,
  AutoFixHigh,
  CalendarMonth,
  CalendarToday,
  Equalizer,
  EuroSymbol,
  FilterAlt,
  Forum,
  History,
  HourglassEmpty,
  LibraryAddCheck,
  LocalFireDepartment,
  Navigation,
  NewReleases,
  NotificationsActive,
  Palette,
  PauseCircle,
  PeopleAlt,
  Pets,
  PlaylistAddCheck,
  Recommend,
  Replay,
  Search,
  SmartDisplay,
  Sort,
  Subscriptions,
  SwapHoriz,
  Today,
  TransferWithinAStation,
  TrendingUp,
  Tune,
  ViewQuilt,
  Visibility,
  WarningAmber,
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
      version: 'Juli 2026 – Anime-Season-Kalender',
      date: '2026-07-02',
      features: [
        {
          icon: <CalendarMonth />,
          color: currentTheme.primary,
          title: 'Neue Seite: Anime-Season-Kalender',
          description:
            'Alle Anime der laufenden Season auf einen Blick – als Premieren-Timeline mit einem Datums-Node pro Tag: „HEUTE" pulsiert, vergangene Premieren sind gedimmt, „Start noch offen" sammelt Einträge ohne Termin. Vorherige und nächste Season sind per Tab erreichbar, „Fortlaufend" und „Beendet" hängen unten dran.',
          link: { label: 'Zum Anime-Season-Kalender', path: '/anime-season' },
        },
        {
          icon: <HourglassEmpty />,
          color: currentTheme.accent,
          title: 'Live-Countdown zur nächsten Premiere',
          description:
            'Der Hero zeigt die nächste große Premiere der Season mit tickendem Countdown (Tage · Std · Min · Sek), Poster, deutscher Beschreibung und Provider-Logos. Läuft schon alles, übernimmt das Season-Highlight.',
        },
        {
          icon: <NewReleases />,
          color: currentTheme.secondary,
          title: '„Staffel 2"-, „Part 2"- und „NEU"-Chips',
          description:
            'Jede Karte zeigt sofort, ob ein Anime eine Fortsetzung ist („Staffel 2", „Part 2", „Fortsetzung" – erkannt aus Titel und AniList-Relationen) oder eine komplett neue Serie („NEU").',
        },
        {
          icon: <Today />,
          color: currentTheme.status.warning,
          title: 'Termine wie in deinem Kalender',
          description:
            'AniList kennt nur den japanischen TV-Termin – der Season-Kalender priorisiert deshalb: Termin aus deinem Serien-Kalender (für Serien in deiner Liste) → TVMaze-geprüfter Termin → AniList. Simulcast-Verschiebungen um einen Tag sind damit Geschichte.',
        },
        {
          icon: <LibraryAddCheck />,
          color: currentTheme.status.purple,
          title: 'Deine Serien werden erkannt',
          description:
            'Sequel-Seasons („Saga of Tanya the Evil Season 2") und Arc-Titel („Tokyo Revengers: Santen Sensou-hen") matchen jetzt zuverlässig auf die Serie in deiner Liste – mit Badge, deinen Providern und Direkteinstieg in die Detailseite. Deutsche Beschreibungen und Provider-Logos laden für alle anderen automatisch nach.',
        },
        {
          icon: <Navigation />,
          color: currentTheme.primary,
          title: 'Komfort beim Stöbern',
          description:
            'Zurück von einer Detailseite landest du exakt dort, wo du warst – inklusive gewähltem Season-Tab. Dazu: Schnellsprung zu „Fortlaufend" im Timeline-Header und der bekannte Scroll-to-top-Button.',
        },
        {
          icon: <FilterAlt />,
          color: currentTheme.status.warning,
          title: 'Filter: Serien, Filme & Provider',
          description:
            'Oben filterst du per „Alle · Serien · Filme" und blendest mit „Mit Provider" alles aus, was keinen deutschen Streaming-Anbieter hat. Anime-Filme haben ein eigenes Badge und öffnen ihre Film-Detailseite.',
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.primary,
          title: 'Direkt zur Liste hinzufügen',
          description:
            'Jede Karte (und der Hero) hat einen „+"-Button – Serie oder Film landet ohne Umweg über die Suche in deiner Liste und zeigt danach sofort Kalender-Termin, Provider und Haken.',
        },
        {
          icon: <Equalizer />,
          color: currentTheme.secondary,
          title: 'TMDB-Rating auf den Karten',
          description:
            'Statt der AniList-Prozente steht jetzt das TMDB-Rating auf der 10er-Skala („★ 8.4") auf jeder Karte – dieselbe Bewertung wie auf den Detailseiten.',
        },
        {
          icon: <Visibility />,
          color: currentTheme.accent,
          title: 'Beschreibung komplett lesen',
          description:
            'Mit „mehr lesen" klappst du die volle Beschreibung direkt auf der Karte auf – ohne die Seite zu verlassen.',
        },
      ],
    },
    {
      version: 'Juni 2026 – Mehr über deine Freunde',
      date: '2026-06-28',
      features: [
        {
          icon: <PeopleAlt />,
          color: currentTheme.primary,
          title: 'Freunde-Stand auf der Seriendetail-Seite',
          description:
            'Pro Serie zeigt eine eigene Sektion welche Freunde auch dabei sind, bei welcher Folge sie aktuell stehen (S/E), und wie viele Folgen sie voraus oder hinter dir sind. Sortiert nach Fortschritt, klappbar – der Zustand wird gespeichert. Klick auf einen Eintrag öffnet das Freund-Profil.',
        },
        {
          icon: <Visibility />,
          color: currentTheme.secondary,
          title: 'Was schaut [Freund] gerade?',
          description:
            'Auf jedem Friend-Profil erscheint die heißeste Serie der letzten 14 Tage mit Status („Binge-Modus", „Aktiv dabei", „Schaut entspannt", „Pausiert" oder „Rewatch"), aktueller Folge und Spoiler-Diff zu deinem Stand. Rewatch wird erkannt und blendet den Spoiler-Hinweis automatisch aus.',
        },
        {
          icon: <HourglassEmpty />,
          color: currentTheme.status.warning,
          title: 'Worauf wartet [Freund]?',
          description:
            'Ebenfalls auf dem Friend-Profil: die nächsten anstehenden Folgen aus der Watchlist deines Freundes, sortiert nach Air-Date. Wenn ihr beide eine Serie wartet, gibt es ein „Ihr beide"-Badge – idealer Co-Watch-Hinweis.',
        },
        {
          icon: <Pets />,
          color: currentTheme.status.purple,
          title: 'Pet-Sneakpeek + Snack schicken',
          description:
            'Du siehst Level, Hunger und Glück des Pets von deinem Freund – und kannst einmal pro Tag pro Freund einen Snack schicken. Sein Pet bekommt −10 Hunger und +5 Glück, sobald die App das nächste Mal geöffnet wird. In der Glocke landet zusätzlich eine Notification „X schickt Snack".',
        },
        {
          icon: <CalendarToday />,
          color: currentTheme.accent,
          title: 'Air-Date + Erstes-Mal-Gesehen pro Folge',
          description:
            'In der Episodenliste steht jetzt rechts neben jeder Folge das Erstausstrahlungs-Datum und – falls geschaut – wann du sie zum ersten Mal gesehen hast. Auf dem Handy klappt die Info unter die Folge.',
        },
      ],
    },
    {
      version: 'Juni 2026 – Anime, Aktivität & Polish',
      date: '2026-06-27',
      features: [
        {
          icon: <FilterAlt />,
          color: currentTheme.status.warning,
          title: 'Anime-Filler & Recap im Detail',
          description:
            'Für japanische Animes erscheint auf der Detail-Seite jetzt ein Banner mit Filler- und Recap-Folgen (Quelle: Jikan/MyAnimeList). In der Episodenliste markieren kleine F/R-Chips jede betroffene Folge, auf der Episode-Discussion-Seite siehst du die Markierung direkt neben dem S/E-Badge. Daten kommen aus dem Backend – kein API-Hänger im Frontend, ein täglicher Job hält alles frisch.',
        },
        {
          icon: <Forum />,
          color: currentTheme.primary,
          title: 'Freunde-Aktivitäten als Ticker',
          description:
            'Eine sanfte Lauf-Schrift unter dem Greeting zeigt was deine Freunde gerade tun („Lisa hat Folge 5 von Breaking Bad gesehen · Tim hat Dune 2 mit 9.0 bewertet …"). Pixelgenaue Geschwindigkeit, hover hält die Marquee an genau der Position an. Ein- und ausblendbar im Sektionen-Layout.',
          link: { label: 'Layout anpassen', path: '/home-layout' },
        },
        {
          icon: <PauseCircle />,
          color: currentTheme.status.error,
          title: 'Streaming-Reminder direkt auf der Homepage',
          description:
            'Ungenutzte Abos schlummern jetzt nicht mehr versteckt im Subscriptions-Tab. Eine eigene Card im „Für dich"-Bereich listet die schlafendsten Anbieter inline mit Pausieren-Button samt Undo-Toast. Geld sparen ohne Seitenwechsel.',
        },
        {
          icon: <Equalizer />,
          color: currentTheme.status.success,
          title: 'Now-Playing-Indikator auf Postern',
          description:
            'In der Weiterschauen-Liste pulsiert ein dezenter 3-Bar-Equalizer auf Serien, die du in den letzten 3 Tagen aktiv weiterschaust. Sofort erkennbar woran du gerade dran bist, ohne den Provider-Sticker zu überlagern.',
        },
        {
          icon: <Pets />,
          color: currentTheme.status.purple,
          title: 'Pet reagiert auf deine Streak',
          description:
            'Wenn dein Watch-Streak steigt oder ein Meilenstein erreicht ist (3, 7, 14, 21, 30, 50, 100 Tage …), erscheint eine kleine Sprechblase über deinem Pet mit Emoji und Glückwunsch. Verbindet Streak-Tracking und Pet-System ohne extra Klick.',
        },
        {
          icon: <History />,
          color: currentTheme.status.success,
          title: 'Recap-Button statt Auto-Popup',
          description:
            'Die Detail-Seite öffnet das Recap-Sheet nicht mehr automatisch – stattdessen liegt ein klar sichtbarer „Recap der letzten N Folgen"-Button im Info-Tab, sobald du Episoden gesehen hast. Du entscheidest wann es dich interessiert.',
        },
        {
          icon: <TransferWithinAStation />,
          color: currentTheme.secondary,
          title: 'Sanfte Seitenwechsel (View Transitions)',
          description:
            'Wechsel von Homepage zu Detail-Seite, von einer Detail-Seite zur nächsten, oder vom Carousel – alles jetzt mit einem dezenten Crossfade statt hartem Sprung. Nutzt die native View-Transitions-API des Browsers, respektiert „prefers-reduced-motion".',
        },
        {
          icon: <ViewQuilt />,
          color: currentTheme.accent,
          title: 'Layout aufgeräumt',
          description:
            'Die „Hauptaktionen"-Sektion mit den großen Weiterschauen/Entdecken-Buttons ist entfernt – beide bleiben bequem im Schnellzugriff und in der Bottom-Nav erreichbar. Neue Sektionen tauchen ab sofort an ihrer vorgesehenen Position auf, nicht mehr automatisch am Ende deiner Liste.',
          link: { label: 'Sektionen sortieren', path: '/home-layout' },
        },
      ],
    },
    {
      version: 'Juni 2026 – Empfehlungen an Freunde',
      date: '2026-06-06',
      features: [
        {
          icon: <Recommend />,
          color: currentTheme.primary,
          title: 'Serien & Filme empfehlen',
          description:
            'Auf jeder Serien- und Film-Detailseite gibt es jetzt einen „Empfehlen"-Button. Wähle deine Freunde aus, schreib optional eine Nachricht dazu, fertig – wie bei Spotify, nur für Serien.',
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.status.purple,
          title: 'Empfehlung im Bell-Hub',
          description:
            'Empfänger sehen die Empfehlung als eigene Karte in den Benachrichtigungen: Poster, Sender-Avatar, deine Nachricht als Speech-Bubble. Mit einem Klick auf „Anschauen" geht es direkt zur Detailseite, oder „Nope" wenn nix für dich.',
        },
        {
          icon: <LibraryAddCheck />,
          color: currentTheme.status.success,
          title: 'Smart Friend-Filter',
          description:
            'Du kannst nur Freunden etwas empfehlen, die die Serie oder den Film noch nicht in ihrer Sammlung haben. Wer es schon kennt, wird ausgegraut mit „Hat das schon" – spart Zeit und macht Empfehlungen wertvoller.',
        },
      ],
    },
    {
      version: 'Juni 2026 – Streaming-Abos',
      date: '2026-06-01',
      features: [
        {
          icon: <Subscriptions />,
          color: currentTheme.primary,
          title: 'Neue Sektion: Streaming-Abos',
          description:
            'Pflege deine aktiven Abos (Netflix, Disney+, Crunchyroll …) mit Monatspreis und Schwellenwert für „ungenutzt". Live-Insights zeigen Total/Monat und wie viel du gerade für nichts zahlst.',
          link: { label: 'Streaming-Abos öffnen', path: '/subscriptions' },
        },
        {
          icon: <EuroSymbol />,
          color: currentTheme.status.success,
          title: 'Kosten transparent machen',
          description:
            'Pro Anbieter wird gezeigt was du seit Wochen nicht mehr geschaut hast und welche Serien deiner Watchlist nur dort laufen. Markiere ein Abo als „Kündigen wenn ungenutzt" und du bekommst einen klaren Vorschlag.',
          link: { label: 'Abos verwalten', path: '/subscriptions' },
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.status.purple,
          title: 'Smart-Attribution',
          description:
            'Eine Episode läuft auf mehreren Anbietern? Wir ordnen sie automatisch dem Provider zu, den du am häufigsten exklusiv nutzt. So weiß deine Statistik, wofür du wirklich Wert ziehst.',
          link: { label: 'Insights ansehen', path: '/subscriptions' },
        },
        {
          icon: <SwapHoriz />,
          color: currentTheme.secondary,
          title: 'Pro-Serie Override',
          description:
            'Rick and Morty schaust du auf HBO Max, nicht Netflix? Tipp im Subscriptions-Diagnose-Panel auf „verschieben" und alle vergangenen & künftigen Watches wandern korrekt zum gewählten Anbieter – inkl. Logo + Brand-Color überall.',
          link: { label: 'Konflikte auflösen', path: '/subscriptions' },
        },
        {
          icon: <WarningAmber />,
          color: currentTheme.status.warning,
          title: 'Watchlist-Lücken erkennen',
          description:
            'Auf der Subscriptions-Seite findest du alle Watchlist-Serien, die NUR auf Anbietern laufen, die du gerade nicht abonniert hast. Auf der Homepage erscheint außerdem eine Notification, wenn eine neue Staffel auf einem nicht-abonnierten Provider startet.',
          link: { label: 'Lücken ansehen', path: '/subscriptions' },
        },
        {
          icon: <Palette />,
          color: currentTheme.accent,
          title: 'TV-Kalender mit Brand-Color',
          description:
            'Jede Episode-Card im Kalender bekommt links einen Streifen in Provider-Farbe (Netflix-Rot, Disney-Blau, HBO-Lila …). Serien, die nur auf Anbietern laufen die du nicht hast, werden ausgegraut – auf einen Blick erkennbar was läuft.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <FilterAlt />,
          color: currentTheme.primary,
          title: '„Nur meine Abos" Filter',
          description:
            'Im Weiterschauen-Tab ein neuer Toggle: zeigt nur Watchlist-Serien, die du auf deinen aktiven Abos schauen kannst. Spart das Hin- und Herklicken zwischen den Streaming-Diensten.',
          link: { label: 'Weiterschauen öffnen', path: '/watchlist' },
        },
        {
          icon: <Search />,
          color: currentTheme.secondary,
          title: 'Onboarding-Schritt: Abos',
          description:
            'Neue User werden im Onboarding direkt nach ihren Streaming-Abos gefragt – damit Empfehlungen, Filter und Kalender vom ersten Login an passen.',
        },
        {
          icon: <AutoAwesome />,
          color: currentTheme.status.success,
          title: 'Server-seitiges Catalog-Refresh',
          description:
            'Wenn TMDB neue Streaming-Provider für eine Serie hinzufügt (z. B. Chernobyl kommt zu Disney+), wird das jetzt täglich automatisch ins Catalog gespiegelt – kein 30-Tage-Lag mehr.',
        },
      ],
    },
    {
      version: 'März 2026 – QoL Update',
      date: '2026-03-27',
      features: [
        {
          icon: <Today />,
          color: currentTheme.primary,
          title: 'Kalender: Auto-Scroll zum heutigen Tag',
          description:
            'Auf dem Handy scrollt der Kalender jetzt automatisch zum heutigen Wochentag – kein manuelles Suchen mehr.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <PauseCircle />,
          color: currentTheme.status.warning,
          title: 'Kalender: Staffelpause & Staffelende Chips',
          description:
            'Neue Badges zeigen dir direkt im Kalender ob eine Serie in die Pause geht oder das Staffelfinale kommt. Erkennt auch Pausen wenn kommende Folgen noch kein Datum haben.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <SmartDisplay />,
          color: currentTheme.secondary,
          title: 'Provider-Badge auf allen Karten',
          description:
            'Kleine Streaming-Logos (Crunchyroll, Netflix, etc.) auf dem Poster – überall: Weiterschauen, Heute Neu, Rewatches und Watchlist.',
        },
        {
          icon: <Tune />,
          color: currentTheme.status.success,
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
          color: currentTheme.status.warning,
          title: '"Zuletzt gesehen" in Weiterschauen',
          description:
            'Jede Karte in Weiterschauen zeigt jetzt wann du die Serie zuletzt geschaut hast – hilft beim Priorisieren.',
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.status.success,
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
          color: currentTheme.status.warning,
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
          color: currentTheme.status.purple,
          title: 'KI-Empfehlungen',
          description:
            'Personalisierte Serien- und Film-Empfehlungen basierend auf deinen Bewertungen, Binge-Verhalten, Genre-Vorlieben und Watch-Patterns. Mit Poster, TMDB-Rating und Streaming-Anbietern – klick auf eine Empfehlung um direkt zur Serie zu gelangen.',
          link: { label: 'Empfehlungen ansehen', path: '/taste-profile' },
        },
        {
          icon: <AutoAwesome />,
          color: currentTheme.status.success,
          title: 'Proaktive Recaps verbessert',
          description:
            'Recaps werden nicht mehr automatisch geladen – erst wenn du auf "Recap lesen" klickst. Spart KI-Anfragen und lädt schneller.',
        },
        {
          icon: <Navigation />,
          color: currentTheme.secondary,
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
          color: currentTheme.primary,
          title: 'TV-Kalender überarbeitet',
          description:
            'Neue Wochenansicht mit Navigation, Desktop-Grid-Layout mit 7-Spalten und automatische Episoden-Gruppierung pro Serie.',
          link: { label: 'Kalender öffnen', path: '/calendar' },
        },
        {
          icon: <TrendingUp />,
          color: currentTheme.status.success,
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
          color: currentTheme.secondary,
          title: 'Provider-Filter',
          description:
            'Filtere deine Watchlist nach Streaming-Anbieter – zeige nur Netflix, Disney+ oder andere.',
          link: { label: 'Watchlist öffnen', path: '/watchlist' },
        },
        {
          icon: <Replay />,
          color: currentTheme.status.error,
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
