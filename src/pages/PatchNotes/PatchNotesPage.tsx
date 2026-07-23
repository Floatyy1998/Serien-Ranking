import {
  AccountCircle,
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
  LocalMovies,
  Navigation,
  NewReleases,
  NotificationsActive,
  Palette,
  PauseCircle,
  PeopleAlt,
  Pets,
  PlaylistAddCheck,
  PhoneIphone,
  Recommend,
  Replay,
  RocketLaunch,
  Search,
  SmartDisplay,
  Sort,
  Speed,
  Subscriptions,
  SwapHoriz,
  SystemUpdateAlt,
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
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
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
      version: t('Juli 2026 – Filme im Rampenlicht'),
      date: '2026-07-23',
      features: [
        {
          icon: <LocalMovies />,
          color: currentTheme.primary,
          title: t('Der Film-Kalender ist da'),
          description: t(
            'Was startet wann? Der neue Film-Kalender zeigt dir Kinostarts und Streaming-Releases für deine Watch-Region — als Timeline mit Quartals-Tabs wie beim Serien-Kalender, inklusive Anbieter-Logos bei Digital-Releases und „+"-Button zum direkten Hinzufügen.'
          ),
          link: { label: t('Zum Film-Kalender'), path: '/film-kalender' },
        },
        {
          icon: <NewReleases />,
          color: currentTheme.secondary,
          title: t('Neu auf deinen Streaming-Anbietern'),
          description: t(
            'Die Startseite passt jetzt auf deine Filmliste auf: Landet ein noch ungesehener Film aus deiner Liste bei einem deiner Streaming-Anbieter, taucht er in der neuen Sektion auf — und du bekommst eine Benachrichtigung. Die Sektion lässt sich im Layout-Editor verschieben oder ausblenden.'
          ),
        },
        {
          icon: <SmartDisplay />,
          color: currentTheme.status.warning,
          title: t('Filmreihen mit Fortschritt'),
          description: t(
            'Herr der Ringe, MCU, Fluch der Karibik: Gehört ein Film zu einer Reihe, zeigt seine Detailseite jetzt die komplette Reihe chronologisch — mit Fortschrittsbalken, Haken auf allem Gesehenen und kommenden Teilen samt Jahr. Reihe komplett? Sag niemals nie.'
          ),
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.status.success,
          title: t('Fairness & Feinschliff'),
          description: t(
            'Massen-Nachtragen von Filmen zählt nicht mehr für die Rangliste (wie bei Serien), Push-Benachrichtigungen nennen jetzt Staffel und Anbieter statt „und 3 weitere", und viele Details wurden poliert — vom Ranglisten-Podium auf Mobile bis zu den Abständen der Film-Detailseite.'
          ),
        },
      ],
    },
    {
      version: t('Juli 2026 – TV-Rank klopft an'),
      date: '2026-07-15',
      features: [
        {
          icon: <NotificationsActive />,
          color: currentTheme.primary,
          title: t('Push-Benachrichtigungen in den Apps'),
          description: t(
            'Die iOS- und Android-App melden sich jetzt von selbst: morgens, wenn eine deiner Serien heute eine neue Folge bekommt, und sofort, wenn dich eine Freundschaftsanfrage erreicht. Einschalten unter Einstellungen → Benachrichtigungen → Push-Benachrichtigungen.'
          ),
          link: { label: t('Zu den Einstellungen'), path: '/settings' },
        },
      ],
    },
    {
      version: t('Juli 2026 – Deine Navigation, dein Layout'),
      date: '2026-07-14',
      features: [
        {
          icon: <Navigation />,
          color: currentTheme.primary,
          title: t('Die untere Leiste gehört jetzt dir'),
          description: t(
            'Belege bis zu 4 Plätze der Navigationsleiste mit deinen Lieblingszielen — Kalender raus, Statistiken rein? Rangliste statt Manga? Du entscheidest. Seiten in der Leiste verlieren automatisch ihren Zurück-Pfeil, denn sie sind jetzt ein Zuhause.'
          ),
          link: { label: t('Leiste anpassen'), path: '/home-layout' },
        },
        {
          icon: <PhoneIphone />,
          color: currentTheme.secondary,
          title: t('Neuer Layout-Editor: deine App in klein'),
          description: t(
            'Homepage anpassen heißt jetzt anfassen: Deine App schwebt als Miniatur in der Mitte — Sektionen greifst und verschiebst du direkt, das Auge blendet aus, und die Leiste bestückst du per Tipp. Was du siehst, ist live dein Layout.'
          ),
        },
        {
          icon: <Equalizer />,
          color: currentTheme.status.warning,
          title: t('Rangliste im Kino-Look'),
          description: t(
            'Das Podium ist jetzt eine Bühne: große Avatare mit Medaillen-Ring und Krone, Glas-Sockel mit Gold-, Silber- und Bronze-Lichtkante und deine Zahl groß im Rampenlicht. Die Trophäen-Galerie füllt den Desktop als Glas-Karten in voller Breite.'
          ),
          link: { label: t('Zur Rangliste'), path: '/leaderboard' },
        },
        {
          icon: <SmartDisplay />,
          color: currentTheme.accent,
          title: t('Backdrops in Originalauflösung'),
          description: t(
            'Auf großen und hochauflösenden Displays laden die Kino-Zeilen auf der Startseite ihre Artworks jetzt in Originalqualität — kein weiches Hochskalieren mehr. Auch die Backdrop-Collage im Profil ist deutlich schärfer geworden.'
          ),
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.status.purple,
          title: t('Feinschliff im ganzen System'),
          description: t(
            'Tooltips sind jetzt feine Glas-Kapseln, Formulare (z. B. Feedback & Bugs) bekommen Glas-Felder mit leuchtendem Fokus, Manga-Filter sind runde Pills mit schöneren Leer-Zuständen — und selbst Text-Markierung und Scrollbar färben sich nach deinem Theme.'
          ),
        },
      ],
    },
    {
      version: t('Juli 2026 – Das große Redesign'),
      date: '2026-07-13',
      features: [
        {
          icon: <AutoAwesome />,
          color: currentTheme.primary,
          title: t('Komplettes Redesign — jede Seite neu'),
          description: t(
            'TV-Rank sieht überall neu aus: Liquid-Glass-Flächen, Kino-Backdrops, getönte Schalter statt greller Neon-Balken und einheitliche Karten-Grids. Über 30 Seiten wurden von Grund auf überarbeitet — von den Stats über den Backlog bis zu Taste Match, Manga und der Episoden-Verwaltung.'
          ),
        },
        {
          icon: <AccountCircle />,
          color: currentTheme.accent,
          title: t('Neues Profil: dein Kino auf einem Screen'),
          description: t(
            'Das Profil ist jetzt eine Kommandozentrale ohne Scrollen: Oben ein Kino-Hero aus den Backdrops deiner bestbewerteten Serien mit Watchtime und Stats, darunter alle Bereiche als übersichtliche Spalten. Alles auf einen Blick, nichts mehr suchen.'
          ),
          link: { label: t('Zum Profil'), path: '/profile' },
        },
        {
          icon: <ViewQuilt />,
          color: currentTheme.secondary,
          title: t('Desktop nutzt endlich die volle Breite'),
          description: t(
            'Keine gestreckten Endlos-Listen mehr: Episoden, Freunde, Empfehlungen, Countdowns, Diskussionen und Manga-Listen liegen am Desktop jetzt als Karten-Grids nebeneinander. Statistiken sind ein dichtes Bento-Dashboard statt einer Einspalten-Wurst.'
          ),
        },
        {
          icon: <RocketLaunch />,
          color: currentTheme.status.warning,
          title: t('Neue Startseite, Login & Registrierung'),
          description: t(
            'Wer nicht eingeloggt ist, sieht jetzt eine echte Bühne: eine animierte Poster-Wand aus den Trending-Serien der Woche, eine Live-Vorschau der App und Anmelden/Registrieren im Kino-Split. Perfekt, um TV-Rank Freunden zu zeigen.'
          ),
        },
        {
          icon: <SystemUpdateAlt />,
          color: currentTheme.status.purple,
          title: t('Sanfte Updates — nie wieder Zwangs-Reload'),
          description: t(
            'Neue Versionen laden sich komplett im Hintergrund vor und werden nur noch angewendet, wenn du es nicht merkst (beim Tab-Wechsel) oder wenn du selbst auf „Aktualisieren" tippst. Der „Update wird installiert"-Reload mitten in der Session ist Geschichte.'
          ),
        },
        {
          icon: <Speed />,
          color: currentTheme.primary,
          title: t('Schnellerer Start'),
          description: t(
            'Die Startseite lädt für Besucher jetzt in rund einer Sekunde — der Ladebildschirm erscheint nur noch dort, wo er wirklich gebraucht wird.'
          ),
        },
        {
          icon: <PhoneIphone />,
          color: currentTheme.accent,
          title: t('Mobile-Feinschliff'),
          description: t(
            'Die Begrüßung auf der Startseite bricht jetzt sauber um statt abgeschnitten zu werden, und der Bug, bei dem Text beim Antippen kurz unsichtbar wurde, ist behoben.'
          ),
        },
      ],
    },
    {
      version: t('Juli 2026 – Anime-Season-Kalender'),
      date: '2026-07-02',
      features: [
        {
          icon: <CalendarMonth />,
          color: currentTheme.primary,
          title: t('Neue Seite: Anime-Season-Kalender'),
          description: t(
            'Alle Anime der laufenden Season auf einen Blick – als Premieren-Timeline mit einem Datums-Node pro Tag: „HEUTE" pulsiert, vergangene Premieren sind gedimmt, „Start noch offen" sammelt Einträge ohne Termin. Vorherige und nächste Season sind per Tab erreichbar, „Fortlaufend" und „Beendet" hängen unten dran.'
          ),
          link: { label: t('Zum Anime-Season-Kalender'), path: '/anime-season' },
        },
        {
          icon: <HourglassEmpty />,
          color: currentTheme.accent,
          title: t('Live-Countdown zur nächsten Premiere'),
          description: t(
            'Der Hero zeigt die nächste große Premiere der Season mit tickendem Countdown (Tage · Std · Min · Sek), Poster, deutscher Beschreibung und Provider-Logos. Läuft schon alles, übernimmt das Season-Highlight.'
          ),
        },
        {
          icon: <NewReleases />,
          color: currentTheme.secondary,
          title: t('„Staffel 2"-, „Part 2"- und „NEU"-Chips'),
          description: t(
            'Jede Karte zeigt sofort, ob ein Anime eine Fortsetzung ist („Staffel 2", „Part 2", „Fortsetzung" – erkannt aus Titel und AniList-Relationen) oder eine komplett neue Serie („NEU").'
          ),
        },
        {
          icon: <Today />,
          color: currentTheme.status.warning,
          title: t('Termine wie in deinem Kalender'),
          description: t(
            'AniList kennt nur den japanischen TV-Termin – der Season-Kalender priorisiert deshalb: Termin aus deinem Serien-Kalender (für Serien in deiner Liste) → TVMaze-geprüfter Termin → AniList. Simulcast-Verschiebungen um einen Tag sind damit Geschichte.'
          ),
        },
        {
          icon: <LibraryAddCheck />,
          color: currentTheme.status.purple,
          title: t('Deine Serien werden erkannt'),
          description: t(
            'Sequel-Seasons („Saga of Tanya the Evil Season 2") und Arc-Titel („Tokyo Revengers: Santen Sensou-hen") matchen jetzt zuverlässig auf die Serie in deiner Liste – mit Badge, deinen Providern und Direkteinstieg in die Detailseite. Deutsche Beschreibungen und Provider-Logos laden für alle anderen automatisch nach.'
          ),
        },
        {
          icon: <Navigation />,
          color: currentTheme.primary,
          title: t('Komfort beim Stöbern'),
          description: t(
            'Zurück von einer Detailseite landest du exakt dort, wo du warst – inklusive gewähltem Season-Tab. Dazu: Schnellsprung zu „Fortlaufend" im Timeline-Header und der bekannte Scroll-to-top-Button.'
          ),
        },
        {
          icon: <FilterAlt />,
          color: currentTheme.status.warning,
          title: t('Filter: Serien, Filme & Provider'),
          description: t(
            'Oben filterst du per „Alle · Serien · Filme" und blendest mit „Mit Provider" alles aus, was keinen deutschen Streaming-Anbieter hat. Anime-Filme haben ein eigenes Badge und öffnen ihre Film-Detailseite.'
          ),
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.primary,
          title: t('Direkt zur Liste hinzufügen'),
          description: t(
            'Jede Karte (und der Hero) hat einen „+"-Button – Serie oder Film landet ohne Umweg über die Suche in deiner Liste und zeigt danach sofort Kalender-Termin, Provider und Haken.'
          ),
        },
        {
          icon: <Equalizer />,
          color: currentTheme.secondary,
          title: t('TMDB-Rating auf den Karten'),
          description: t(
            'Statt der AniList-Prozente steht jetzt das TMDB-Rating auf der 10er-Skala („★ 8.4") auf jeder Karte – dieselbe Bewertung wie auf den Detailseiten.'
          ),
        },
        {
          icon: <Visibility />,
          color: currentTheme.accent,
          title: t('Beschreibung komplett lesen'),
          description: t(
            'Mit „mehr lesen" klappst du die volle Beschreibung direkt auf der Karte auf – ohne die Seite zu verlassen.'
          ),
        },
      ],
    },
    {
      version: t('Juni 2026 – Mehr über deine Freunde'),
      date: '2026-06-28',
      features: [
        {
          icon: <PeopleAlt />,
          color: currentTheme.primary,
          title: t('Freunde-Stand auf der Seriendetail-Seite'),
          description: t(
            'Pro Serie zeigt eine eigene Sektion welche Freunde auch dabei sind, bei welcher Folge sie aktuell stehen (S/E), und wie viele Folgen sie voraus oder hinter dir sind. Sortiert nach Fortschritt, klappbar – der Zustand wird gespeichert. Klick auf einen Eintrag öffnet das Freund-Profil.'
          ),
        },
        {
          icon: <Visibility />,
          color: currentTheme.secondary,
          title: t('Was schaut [Freund] gerade?'),
          description: t(
            'Auf jedem Friend-Profil erscheint die heißeste Serie der letzten 14 Tage mit Status („Binge-Modus", „Aktiv dabei", „Schaut entspannt", „Pausiert" oder „Rewatch"), aktueller Folge und Spoiler-Diff zu deinem Stand. Rewatch wird erkannt und blendet den Spoiler-Hinweis automatisch aus.'
          ),
        },
        {
          icon: <HourglassEmpty />,
          color: currentTheme.status.warning,
          title: t('Worauf wartet [Freund]?'),
          description: t(
            'Ebenfalls auf dem Friend-Profil: die nächsten anstehenden Folgen aus der Watchlist deines Freundes, sortiert nach Air-Date. Wenn ihr beide eine Serie wartet, gibt es ein „Ihr beide"-Badge – idealer Co-Watch-Hinweis.'
          ),
        },
        {
          icon: <Pets />,
          color: currentTheme.status.purple,
          title: t('Pet-Sneakpeek + Snack schicken'),
          description: t(
            'Du siehst Level, Hunger und Glück des Pets von deinem Freund – und kannst einmal pro Tag pro Freund einen Snack schicken. Sein Pet bekommt −10 Hunger und +5 Glück, sobald die App das nächste Mal geöffnet wird. In der Glocke landet zusätzlich eine Notification „X schickt Snack".'
          ),
        },
        {
          icon: <CalendarToday />,
          color: currentTheme.accent,
          title: t('Air-Date + Erstes-Mal-Gesehen pro Folge'),
          description: t(
            'In der Episodenliste steht jetzt rechts neben jeder Folge das Erstausstrahlungs-Datum und – falls geschaut – wann du sie zum ersten Mal gesehen hast. Auf dem Handy klappt die Info unter die Folge.'
          ),
        },
      ],
    },
    {
      version: t('Juni 2026 – Anime, Aktivität & Polish'),
      date: '2026-06-27',
      features: [
        {
          icon: <FilterAlt />,
          color: currentTheme.status.warning,
          title: t('Anime-Filler & Recap im Detail'),
          description: t(
            'Für japanische Animes erscheint auf der Detail-Seite jetzt ein Banner mit Filler- und Recap-Folgen (Quelle: Jikan/MyAnimeList). In der Episodenliste markieren kleine F/R-Chips jede betroffene Folge, auf der Episode-Discussion-Seite siehst du die Markierung direkt neben dem S/E-Badge. Daten kommen aus dem Backend – kein API-Hänger im Frontend, ein täglicher Job hält alles frisch.'
          ),
        },
        {
          icon: <Forum />,
          color: currentTheme.primary,
          title: t('Freunde-Aktivitäten als Ticker'),
          description: t(
            'Eine sanfte Lauf-Schrift unter dem Greeting zeigt was deine Freunde gerade tun („Lisa hat Folge 5 von Breaking Bad gesehen · Tim hat Dune 2 mit 9.0 bewertet …"). Pixelgenaue Geschwindigkeit, hover hält die Marquee an genau der Position an. Ein- und ausblendbar im Sektionen-Layout.'
          ),
          link: { label: t('Layout anpassen'), path: '/home-layout' },
        },
        {
          icon: <PauseCircle />,
          color: currentTheme.status.error,
          title: t('Streaming-Reminder direkt auf der Homepage'),
          description: t(
            'Ungenutzte Abos schlummern jetzt nicht mehr versteckt im Subscriptions-Tab. Eine eigene Card im „Für dich"-Bereich listet die schlafendsten Anbieter inline mit Pausieren-Button samt Undo-Toast. Geld sparen ohne Seitenwechsel.'
          ),
        },
        {
          icon: <Equalizer />,
          color: currentTheme.status.success,
          title: t('Now-Playing-Indikator auf Postern'),
          description: t(
            'In der Weiterschauen-Liste pulsiert ein dezenter 3-Bar-Equalizer auf Serien, die du in den letzten 3 Tagen aktiv weiterschaust. Sofort erkennbar woran du gerade dran bist, ohne den Provider-Sticker zu überlagern.'
          ),
        },
        {
          icon: <Pets />,
          color: currentTheme.status.purple,
          title: t('Pet reagiert auf deine Streak'),
          description: t(
            'Wenn dein Watch-Streak steigt oder ein Meilenstein erreicht ist (3, 7, 14, 21, 30, 50, 100 Tage …), erscheint eine kleine Sprechblase über deinem Pet mit Emoji und Glückwunsch. Verbindet Streak-Tracking und Pet-System ohne extra Klick.'
          ),
        },
        {
          icon: <History />,
          color: currentTheme.status.success,
          title: t('Recap-Button statt Auto-Popup'),
          description: t(
            'Die Detail-Seite öffnet das Recap-Sheet nicht mehr automatisch – stattdessen liegt ein klar sichtbarer „Recap der letzten N Folgen"-Button im Info-Tab, sobald du Episoden gesehen hast. Du entscheidest wann es dich interessiert.'
          ),
        },
        {
          icon: <TransferWithinAStation />,
          color: currentTheme.secondary,
          title: t('Sanfte Seitenwechsel (View Transitions)'),
          description: t(
            'Wechsel von Homepage zu Detail-Seite, von einer Detail-Seite zur nächsten, oder vom Carousel – alles jetzt mit einem dezenten Crossfade statt hartem Sprung. Nutzt die native View-Transitions-API des Browsers, respektiert „prefers-reduced-motion".'
          ),
        },
        {
          icon: <ViewQuilt />,
          color: currentTheme.accent,
          title: t('Layout aufgeräumt'),
          description: t(
            'Die „Hauptaktionen"-Sektion mit den großen Weiterschauen/Entdecken-Buttons ist entfernt – beide bleiben bequem im Schnellzugriff und in der Bottom-Nav erreichbar. Neue Sektionen tauchen ab sofort an ihrer vorgesehenen Position auf, nicht mehr automatisch am Ende deiner Liste.'
          ),
          link: { label: t('Sektionen sortieren'), path: '/home-layout' },
        },
      ],
    },
    {
      version: t('Juni 2026 – Empfehlungen an Freunde'),
      date: '2026-06-06',
      features: [
        {
          icon: <Recommend />,
          color: currentTheme.primary,
          title: t('Serien & Filme empfehlen'),
          description: t(
            'Auf jeder Serien- und Film-Detailseite gibt es jetzt einen „Empfehlen"-Button. Wähle deine Freunde aus, schreib optional eine Nachricht dazu, fertig – wie bei Spotify, nur für Serien.'
          ),
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.status.purple,
          title: t('Empfehlung im Bell-Hub'),
          description: t(
            'Empfänger sehen die Empfehlung als eigene Karte in den Benachrichtigungen: Poster, Sender-Avatar, deine Nachricht als Speech-Bubble. Mit einem Klick auf „Anschauen" geht es direkt zur Detailseite, oder „Nope" wenn nix für dich.'
          ),
        },
        {
          icon: <LibraryAddCheck />,
          color: currentTheme.status.success,
          title: t('Smart Friend-Filter'),
          description: t(
            'Du kannst nur Freunden etwas empfehlen, die die Serie oder den Film noch nicht in ihrer Sammlung haben. Wer es schon kennt, wird ausgegraut mit „Hat das schon" – spart Zeit und macht Empfehlungen wertvoller.'
          ),
        },
      ],
    },
    {
      version: t('Juni 2026 – Streaming-Abos'),
      date: '2026-06-01',
      features: [
        {
          icon: <Subscriptions />,
          color: currentTheme.primary,
          title: t('Neue Sektion: Streaming-Abos'),
          description: t(
            'Pflege deine aktiven Abos (Netflix, Disney+, Crunchyroll …) mit Monatspreis und Schwellenwert für „ungenutzt". Live-Insights zeigen Total/Monat und wie viel du gerade für nichts zahlst.'
          ),
          link: { label: t('Streaming-Abos öffnen'), path: '/subscriptions' },
        },
        {
          icon: <EuroSymbol />,
          color: currentTheme.status.success,
          title: t('Kosten transparent machen'),
          description: t(
            'Pro Anbieter wird gezeigt was du seit Wochen nicht mehr geschaut hast und welche Serien deiner Watchlist nur dort laufen. Markiere ein Abo als „Kündigen wenn ungenutzt" und du bekommst einen klaren Vorschlag.'
          ),
          link: { label: t('Abos verwalten'), path: '/subscriptions' },
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.status.purple,
          title: t('Smart-Attribution'),
          description: t(
            'Eine Episode läuft auf mehreren Anbietern? Wir ordnen sie automatisch dem Provider zu, den du am häufigsten exklusiv nutzt. So weiß deine Statistik, wofür du wirklich Wert ziehst.'
          ),
          link: { label: t('Insights ansehen'), path: '/subscriptions' },
        },
        {
          icon: <SwapHoriz />,
          color: currentTheme.secondary,
          title: t('Pro-Serie Override'),
          description: t(
            'Rick and Morty schaust du auf HBO Max, nicht Netflix? Tipp im Subscriptions-Diagnose-Panel auf „verschieben" und alle vergangenen & künftigen Watches wandern korrekt zum gewählten Anbieter – inkl. Logo + Brand-Color überall.'
          ),
          link: { label: t('Konflikte auflösen'), path: '/subscriptions' },
        },
        {
          icon: <WarningAmber />,
          color: currentTheme.status.warning,
          title: t('Watchlist-Lücken erkennen'),
          description: t(
            'Auf der Subscriptions-Seite findest du alle Watchlist-Serien, die NUR auf Anbietern laufen, die du gerade nicht abonniert hast. Auf der Homepage erscheint außerdem eine Notification, wenn eine neue Staffel auf einem nicht-abonnierten Provider startet.'
          ),
          link: { label: t('Lücken ansehen'), path: '/subscriptions' },
        },
        {
          icon: <Palette />,
          color: currentTheme.accent,
          title: t('TV-Kalender mit Brand-Color'),
          description: t(
            'Jede Episode-Card im Kalender bekommt links einen Streifen in Provider-Farbe (Netflix-Rot, Disney-Blau, HBO-Lila …). Serien, die nur auf Anbietern laufen die du nicht hast, werden ausgegraut – auf einen Blick erkennbar was läuft.'
          ),
          link: { label: t('Kalender öffnen'), path: '/calendar' },
        },
        {
          icon: <FilterAlt />,
          color: currentTheme.primary,
          title: t('„Nur meine Abos" Filter'),
          description: t(
            'Im Weiterschauen-Tab ein neuer Toggle: zeigt nur Watchlist-Serien, die du auf deinen aktiven Abos schauen kannst. Spart das Hin- und Herklicken zwischen den Streaming-Diensten.'
          ),
          link: { label: t('Weiterschauen öffnen'), path: '/watchlist' },
        },
        {
          icon: <Search />,
          color: currentTheme.secondary,
          title: t('Onboarding-Schritt: Abos'),
          description: t(
            'Neue User werden im Onboarding direkt nach ihren Streaming-Abos gefragt – damit Empfehlungen, Filter und Kalender vom ersten Login an passen.'
          ),
        },
        {
          icon: <AutoAwesome />,
          color: currentTheme.status.success,
          title: t('Server-seitiges Catalog-Refresh'),
          description: t(
            'Wenn TMDB neue Streaming-Provider für eine Serie hinzufügt (z. B. Chernobyl kommt zu Disney+), wird das jetzt täglich automatisch ins Catalog gespiegelt – kein 30-Tage-Lag mehr.'
          ),
        },
      ],
    },
    {
      version: t('März 2026 – QoL Update'),
      date: '2026-03-27',
      features: [
        {
          icon: <Today />,
          color: currentTheme.primary,
          title: t('Kalender: Auto-Scroll zum heutigen Tag'),
          description: t(
            'Auf dem Handy scrollt der Kalender jetzt automatisch zum heutigen Wochentag – kein manuelles Suchen mehr.'
          ),
          link: { label: t('Kalender öffnen'), path: '/calendar' },
        },
        {
          icon: <PauseCircle />,
          color: currentTheme.status.warning,
          title: t('Kalender: Staffelpause & Staffelende Chips'),
          description: t(
            'Neue Badges zeigen dir direkt im Kalender ob eine Serie in die Pause geht oder das Staffelfinale kommt. Erkennt auch Pausen wenn kommende Folgen noch kein Datum haben.'
          ),
          link: { label: t('Kalender öffnen'), path: '/calendar' },
        },
        {
          icon: <SmartDisplay />,
          color: currentTheme.secondary,
          title: t('Provider-Badge auf allen Karten'),
          description: t(
            'Kleine Streaming-Logos (Crunchyroll, Netflix, etc.) auf dem Poster – überall: Weiterschauen, Heute Neu, Rewatches und Watchlist.'
          ),
        },
        {
          icon: <Tune />,
          color: currentTheme.status.success,
          title: t('Smarter Status-Badge'),
          description: t(
            'Der Status-Badge im Serien-Detail zeigt jetzt den Ausstrahlungsrhythmus: "Läuft · Sonntags neue Folge" oder "Läuft · Alle 2 Wochen" statt nur "Fortlaufend".'
          ),
        },
        {
          icon: <CalendarMonth />,
          color: currentTheme.accent,
          title: t('Nächste Folge im Hero'),
          description: t(
            'Neuer Chip im Serien-Detail zeigt sofort die nächste Episode mit Datum an – ohne scrollen zu müssen.'
          ),
        },
        {
          icon: <Replay />,
          color: currentTheme.status.warning,
          title: t('"Zuletzt gesehen" in Weiterschauen'),
          description: t(
            'Jede Karte in Weiterschauen zeigt jetzt wann du die Serie zuletzt geschaut hast – hilft beim Priorisieren.'
          ),
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.status.success,
          title: t('Staffel & Tab merken'),
          description: t(
            'Wenn du in einem Serien-Detail eine Staffel oder Tab (Info/Besetzung/KI-Guide) wählst und zurücknavigierst, landest du wieder an der gleichen Stelle.'
          ),
        },
      ],
    },
    {
      version: t('März 2026 – Update 3'),
      date: '2026-03-27',
      features: [
        {
          icon: <LocalFireDepartment />,
          color: currentTheme.status.warning,
          title: t('Trending, Saisonal & Bestbewertet Redesign'),
          description: t(
            'Komplett neues Card-Design im Kino-Stil: Trending-Cards mit Rang-Nummer in abgerundeter Ecke, Genre-Anzeige, TMDB-Rating und Erscheinungsjahr – einheitlich für alle drei Sektionen.'
          ),
        },
      ],
    },
    {
      version: t('März 2026 – Update 2'),
      date: '2026-03-26',
      features: [
        {
          icon: <AutoAwesome />,
          color: currentTheme.status.purple,
          title: t('KI-Empfehlungen'),
          description: t(
            'Personalisierte Serien- und Film-Empfehlungen basierend auf deinen Bewertungen, Binge-Verhalten, Genre-Vorlieben und Watch-Patterns. Mit Poster, TMDB-Rating und Streaming-Anbietern – klick auf eine Empfehlung um direkt zur Serie zu gelangen.'
          ),
          link: { label: t('Empfehlungen ansehen'), path: '/taste-profile' },
        },
        {
          icon: <AutoAwesome />,
          color: currentTheme.status.success,
          title: t('Proaktive Recaps verbessert'),
          description: t(
            'Recaps werden nicht mehr automatisch geladen – erst wenn du auf "Recap lesen" klickst. Spart KI-Anfragen und lädt schneller.'
          ),
        },
        {
          icon: <Navigation />,
          color: currentTheme.secondary,
          title: t('Navbar Redesign'),
          description: t(
            'Neue Glassmorphism-Navigation mit Glow-Effekt auf dem aktiven Tab. Bessere Lesbarkeit der inaktiven Icons.'
          ),
        },
      ],
    },
    {
      version: t('März 2026'),
      date: '2026-03-01',
      features: [
        {
          icon: <CalendarMonth />,
          color: currentTheme.primary,
          title: t('TV-Kalender überarbeitet'),
          description: t(
            'Neue Wochenansicht mit Navigation, Desktop-Grid-Layout mit 7-Spalten und automatische Episoden-Gruppierung pro Serie.'
          ),
          link: { label: t('Kalender öffnen'), path: '/calendar' },
        },
        {
          icon: <TrendingUp />,
          color: currentTheme.status.success,
          title: t('Serien-Fortschritt'),
          description: t(
            'Progress-Bars auf jeder Watchlist-Karte zeigen wie weit du bist – mit Staffel-Info und verbleibenden Episoden.'
          ),
          link: { label: t('Watchlist öffnen'), path: '/watchlist' },
        },
        {
          icon: <Sort />,
          color: currentTheme.accent,
          title: t('Neue Sortierung'),
          description: t(
            'Sortiere deine Watchlist nach Fortschritt oder verbleibenden Episoden – finde schnell was fast fertig ist.'
          ),
          link: { label: t('Watchlist öffnen'), path: '/watchlist' },
        },
        {
          icon: <FilterAlt />,
          color: currentTheme.secondary,
          title: t('Provider-Filter'),
          description: t(
            'Filtere deine Watchlist nach Streaming-Anbieter – zeige nur Netflix, Disney+ oder andere.'
          ),
          link: { label: t('Watchlist öffnen'), path: '/watchlist' },
        },
        {
          icon: <Replay />,
          color: currentTheme.status.error,
          title: t('Rewatch-Fortschritt'),
          description: t(
            'Rewatches zeigen jetzt ihren eigenen Fortschritt statt den der Original-Serie.'
          ),
          link: { label: t('Watchlist öffnen'), path: '/watch-next' },
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.accent,
          title: t('"Ich bin bei…" Markierung'),
          description: t(
            'Wähle Staffel und Episode – alles davor wird automatisch als gesehen markiert. Perfekt für Serien die du woanders geschaut hast.'
          ),
        },
      ],
    },
    {
      version: t('Februar 2026'),
      date: '2026-02-28',
      features: [
        {
          icon: <ViewQuilt />,
          color: currentTheme.accent,
          title: t('Homepage Layout'),
          description: t(
            'Sektionen auf der Homepage sortieren, ausblenden und nach deinem Geschmack anpassen.'
          ),
          link: { label: t('Layout anpassen'), path: '/home-layout' },
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
