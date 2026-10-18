import {
  AccountCircle,
  ArrowForward,
  AutoAwesome,
  AutoFixHigh,
  AutoStories,
  CalendarMonth,
  CalendarToday,
  CardGiftcard,
  Celebration,
  Checkroom,
  Diversity3,
  EditCalendar,
  EmojiEmotions,
  Equalizer,
  EuroSymbol,
  ExpandMore,
  EventRepeat,
  FilterAlt,
  Forum,
  GroupAdd,
  History,
  HourglassEmpty,
  Insights,
  IosShare,
  Language,
  LibraryAddCheck,
  LocalFireDepartment,
  LocalMovies,
  Lock,
  MenuBook,
  Navigation,
  NewReleases,
  NotificationsActive,
  Palette,
  PauseCircle,
  PeopleAlt,
  Pets,
  PhoneIphone,
  PlaylistAdd,
  PlaylistAddCheck,
  Public,
  Recommend,
  Replay,
  Reply,
  RocketLaunch,
  Search,
  Send,
  SmartDisplay,
  Sort,
  Speed,
  Subscriptions,
  SwapHoriz,
  SystemUpdateAlt,
  Today,
  TouchApp,
  TransferWithinAStation,
  Translate,
  TrendingUp,
  Tune,
  ViewQuilt,
  Visibility,
  WarningAmber,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { dateLocale, t } from '../../services/i18n';
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

const RECENT_DAYS = 14;

/** Der Monat im Versionsnamen steht schon im Datum daneben. */
const releaseName = (version: string): string =>
  version.match(/^.+?\s+[–—]\s+(.+)$/)?.[1] ?? version;

const featureCount = (n: number): string =>
  n === 1 ? t('Eine Neuerung') : t('{n} Neuerungen', { n });

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(dateLocale(), {
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
      version: t('Oktober 2026 – Crossover, Schauspieler-Suche und Schwerpunkt Lesen'),
      date: '2026-10-18',
      features: [
        {
          icon: <SwapHoriz />,
          color: currentTheme.primary,
          title: t('Crossover in der richtigen Reihenfolge'),
          description: t(
            'Manche Geschichten laufen über mehrere Serien, etwa bei Arrow und The Flash, One Chicago oder Grey’s Anatomy und Station 19. Auf der Serienseite siehst du jetzt, welche Folgen dazugehören und was du vorher und danach schauen solltest, mit Haken für alles, was du schon gesehen hast. Ein Chip markiert solche Folgen auch unter Weiterschauen und Heute neu. Über 600 Crossover sind schon eingetragen, und fehlt eins, ergänzt du es selbst.'
          ),
        },
        {
          icon: <AutoStories />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Manga in Bänden zählen'),
          description: t(
            'Wer Manga gedruckt liest, hakt jetzt Band für Band ab statt Kapitel. Bände aus der ISBN-Suche landen direkt beim passenden Manga, und eine Reihe lässt sich jederzeit zwischen Manga und Buch hin- und herschieben.'
          ),
        },
        {
          icon: <MenuBook />,
          color: currentTheme.primary,
          title: t('Stöbern nach Genre und Stimmung'),
          description: t(
            '65 Genres und 16 Stimmungen helfen beim Finden des nächsten Buchs, auf Wunsch getrennt nach Erwachsenen und Jugend. Die Detailseite zeigt Stimmung, Tempo, Inhaltshinweise und ähnliche Bücher, und dein Regal lässt sich durchsuchen, filtern und sortieren.'
          ),
          link: { label: t('Zu den Büchern'), path: '/books' },
        },
        {
          icon: <LibraryAddCheck />,
          color: currentTheme.secondary,
          title: t('Im Besitz und Leihwünsche'),
          description: t(
            'Markiere Bücher, die bei dir im Regal stehen. Auf den Profilen deiner Freunde siehst du, was sie besitzen, und kannst dir ein Buch zum Ausleihen wünschen.'
          ),
        },
        {
          icon: <Search />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Schauspieler finden'),
          description: t(
            'Die Suche findet jetzt auch Schauspielerinnen und Schauspieler. Ein Tipp öffnet ihre Seite mit den Serien und Filmen, in denen sie mitgespielt haben.'
          ),
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.primary,
          title: t('Benachrichtigungen aufgeräumt'),
          description: t(
            'Neues steht oben, der Rest ist nach Heute, Gestern und Früher sortiert. Meldungen aus demselben Ticket oder derselben Diskussion sind gebündelt, Chats haben einen eigenen Bereich, und die Aktivität deiner Freunde zeigt große Poster samt Uhrzeit.'
          ),
        },
        {
          icon: <Tune />,
          color: currentTheme.secondary,
          title: t('Schwerpunkt: Schauen, Lesen oder beides'),
          description: t(
            'Wer mehr liest als schaut, bekommt eine eigene Startseite mit Büchern, Manga, Freunden und Pet. Den Schwerpunkt stellst du unter Design ein, Serien und Filme bleiben einen Tipp entfernt.'
          ),
          link: { label: t('Zum Design'), path: '/theme' },
        },
        {
          icon: <Public />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Öffentliche Profile mit Manga, Büchern und Listen'),
          description: t(
            'Dein öffentliches Profil zeigt jetzt neben Serien und Filmen auch Manga, Bücher und deine Listen. Im eigenen Profil stehen gelesene Bücher, Seiten und Manga-Kapitel neben deinen Serienzahlen, und unter Bewertungen gibt es einen Reiter für Bücher.'
          ),
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.primary,
          title: t('Kleinere Korrekturen'),
          description: t(
            'Links in Diskussionen und Tickets sind anklickbar, seitliches Wischen in Kalender und Staffeln scrollt nicht mehr mit, die Manga-Suche findet auch westliche Webtoons, und Updates der Android-App kommen schon beim ersten Start an.'
          ),
        },
      ],
    },
    {
      version: t('Oktober 2026 – Bücher, Pets auf dem Dock und Antworten im Chat'),
      date: '2026-10-14',
      features: [
        {
          icon: <MenuBook />,
          color: currentTheme.primary,
          title: t('Bücher im Bereich „Lesen“'),
          description: t(
            'Neben Manga trackst du jetzt auch Bücher. Such nach Titel, Autor oder ISBN, trag ein, auf welcher Seite du bist, und behalte im Regal den Überblick über alles, was du liest, gelesen hast oder noch lesen willst. Dazu gibt es eine eigene Statistik mit Lesechallenge, und deine Bibliothek aus Goodreads oder StoryGraph holst du per Import rein.'
          ),
          link: { label: t('Zu den Büchern'), path: '/books' },
        },
        {
          icon: <CardGiftcard />,
          color: currentTheme.secondary,
          title: t('Wunschliste und Geschenkideen'),
          description: t(
            'Bücher, die du gern hättest, landen mit einem Tipp auf deiner Wunschliste. Auf den Profilen deiner Freunde findest du passend dazu Geschenkideen: ihre Wünsche, den nächsten fehlenden Band einer Reihe und Vorschläge aus ihren Lieblingsgenres.'
          ),
        },
        {
          icon: <AutoStories />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Der Manga-Bereich, neu gebaut'),
          description: t(
            'Die Manga-Übersicht stellst du dir jetzt selbst zusammen: welche Abschnitte erscheinen und in welcher Reihenfolge. Die Suche zeigt auch Manga, die schon in deiner Sammlung sind, und findet Titel unter ihrem deutschen Namen. Dazu kommt eine neue Detailseite, und auf den Profilen deiner Freunde siehst du, was sie gerade lesen.'
          ),
          link: { label: t('Zu den Manga'), path: '/manga' },
        },
        {
          icon: <Pets />,
          color: currentTheme.primary,
          title: t('Deine Pets laufen über das Dock'),
          description: t(
            'Dein Pet sitzt nicht mehr nur still: Es läuft über die Leiste unten, schläft, springt, spielt Ball und bringt dir Briefe. Bis zu drei Pets können gleichzeitig unterwegs sein — dann begrüßen sie sich, tanzen, machen Wettrennen oder spielen zusammen Fußball. Wer mitläuft, wählst du auf der Pet-Seite.'
          ),
          link: { label: t('Zu deinen Pets'), path: '/pets' },
        },
        {
          icon: <Checkroom />,
          color: currentTheme.secondary,
          title: t('Garderobe, Spielplatz und mehr Tiefe'),
          description: t(
            'Die Pet-Seite ist neu geordnet: oben dein Pet mit Füttern und Spielen, darunter Tricks, Garderobe und Dock. In der Garderobe trägt dein Pet je ein Teil an Kopf, Gesicht und Körper — ab Level 10 zwei gleichzeitig, ab Level 30 das volle Outfit. Umhänge sind jetzt echte Umhänge, und alle Pets haben Licht und Volumen bekommen.'
          ),
        },
        {
          icon: <Diversity3 />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Spieltreff bei Freunden'),
          description: t(
            'Auf dem Profil eines Freundes können sich eure Pets zum Spielen treffen. Einmal am Tag pro Freund hebt das die Laune deines Pets.'
          ),
        },
        {
          icon: <Reply />,
          color: currentTheme.primary,
          title: t('Im Chat auf Nachrichten antworten'),
          description: t(
            'Wisch eine Nachricht nach rechts, um direkt darauf zu antworten — am Rechner reicht der Pfeil, der beim Darüberfahren erscheint. Das Zitat steht dann über deiner Antwort, und ein Tipp darauf springt zur ursprünglichen Nachricht. Links in Nachrichten sind jetzt klickbar; bevor eine fremde Seite aufgeht, siehst du, wohin der Link führt.'
          ),
          link: { label: t('Chats öffnen'), path: '/chats' },
        },
        {
          icon: <Send />,
          color: currentTheme.secondary,
          title: t('Folgen mit Freunden teilen'),
          description: t(
            'Auf jeder Folgenseite sitzt oben rechts ein Papierflieger. Damit schickst du die Folge in den Chat, auf Wunsch mit einem Kommentar, den du auch als Spoiler verdecken kannst. Den Folgentitel sieht dein Freund erst, wenn er die Folge selbst geschaut hat.'
          ),
        },
        {
          icon: <Celebration />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Halloween, Weihnachten und mehr'),
          description: t(
            'Im Oktober trägt TV-Rank Spinnennetze und Fledermäuse, im Dezember folgen Weihnachten und Silvester, im Februar der Valentinstag — jeweils mit eigenem Startbildschirm. Die Designs schalten sich von selbst ein; wer lieber bei seinem eigenen Look bleibt, schaltet sie unter Design ab.'
          ),
          link: { label: t('Zum Design'), path: '/theme' },
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.primary,
          title: t('Kleinere Korrekturen'),
          description: t(
            'Der Kalender sortiert Folgen jetzt nach ihrer echten Sendezeit. Die Suche sagt dir, wenn ein Titel schon in deiner Liste ist oder das Hinzufügen nicht klappt. Und die App stürzt nicht mehr ab, wenn der Browser die Seite übersetzt.'
          ),
        },
      ],
    },
    {
      version: t('Oktober 2026 – Eigene Listen, Long-Press und öffentliche Profile'),
      date: '2026-10-06',
      features: [
        {
          icon: <PlaylistAdd />,
          color: currentTheme.primary,
          title: t('Eigene Listen'),
          description: t(
            'Unter Bewertungen gibt es den Reiter „Listen“: Stell Serien und Filme zu eigenen Sammlungen zusammen, etwa „Mit Anna schauen“ oder „Für schlechte Tage“. In „Weiter“ filterst du mit einer Liste genau die Serien heraus, auf die du gerade Lust hast.'
          ),
          link: { label: t('Zu deinen Listen'), path: '/ratings?tab=folders' },
        },
        {
          icon: <IosShare />,
          color: currentTheme.secondary,
          title: t('Listen teilen'),
          description: t(
            'Jede Liste lässt sich per Link verschicken, mit einem Vorschaubild aus ihren Postern. Wer den Link öffnet, sieht die Liste auch ohne Konto und kann mit genau diesen Titeln bei TV-Rank einsteigen.'
          ),
        },
        {
          icon: <TouchApp />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Gedrückt halten für schnelle Aktionen'),
          description: t(
            'Halt eine Serie oder einen Film irgendwo in der App gedrückt — am Rechner per Rechtsklick —, um ihn zu bewerten, einer Liste hinzuzufügen, in deine Sammlung aufzunehmen oder einen Film als gesehen zu markieren. Auf den Detailseiten gibt es dafür außerdem den Knopf „Zu Liste hinzufügen“.'
          ),
        },
        {
          icon: <Public />,
          color: currentTheme.primary,
          title: t('Öffentliche Profile entdecken'),
          description: t(
            'Im Freunde-Reiter stöberst du jetzt auch durch öffentliche Profile und findest so neue Leute mit ähnlichem Geschmack. Wer nicht in der Rangliste auftauchen möchte, blendet sich in den Einstellungen aus.'
          ),
          link: { label: t('Freunde öffnen'), path: '/activity?tab=friends' },
        },
        {
          icon: <Insights />,
          color: currentTheme.secondary,
          title: t('Freundesprofile überarbeitet'),
          description: t(
            'Die Einblicke auf Freundesprofilen sind neu gestaltet, euer Vergleich passt jetzt in eine kompakte Karte, und die Listen deiner Freunde haben einen eigenen Reiter. Freundschaftsanfragen nimmst du direkt auf dem Profil an. Als Freund siehst du Serien, Bewertungen und Verlauf ohne extra Freigabe — die braucht es nur noch für den Kalender.'
          ),
        },
        {
          icon: <EventRepeat />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Serientermine im Plan'),
          description: t(
            'Im Plan legst du jetzt wiederkehrende Termine für eine Serie an: an festen Wochentagen oder alle paar Tage, mit bis zu fünf Folgen pro Termin, bis zum Staffel- oder Serienende. Einzelne Termine lässt du ausfallen oder änderst ihre Folge — die übrigen nummerieren sich von selbst neu. Auch Rewatches lassen sich so planen.'
          ),
          link: { label: t('Zum Planer'), path: '/calendar?mode=plan' },
        },
        {
          icon: <Sort />,
          color: currentTheme.primary,
          title: t('Nach Erscheinungsjahr filtern'),
          description: t(
            'In deinen Bewertungen und auf Profilen filterst du jetzt nach Jahrzehnt oder einem eigenen Jahresbereich und sortierst nach Erscheinung — vom neuesten zum ältesten oder umgekehrt.'
          ),
        },
      ],
    },
    {
      version: t('September 2026 – Dein eigener Schau-Plan'),
      date: '2026-09-25',
      features: [
        {
          icon: <EditCalendar />,
          color: currentTheme.primary,
          title: t('Mein Plan: dein eigener Kalender'),
          description: t(
            'Im Kalender gibt es neben „Neue Folgen" jetzt den Reiter „Mein Plan". Dort trägst du ein, an welchem Tag du welche Folge oder welchen Film schauen willst — auf Wunsch mit Uhrzeit und einer kurzen Notiz. Tag und Uhrzeit wählst du bequem per Tippen, auch im 12-Stunden-Format.'
          ),
          link: { label: t('Zum Planer'), path: '/calendar?mode=plan' },
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.secondary,
          title: t('Erinnerung, wann du willst'),
          description: t(
            'Setz bei einem Eintrag den Haken „Erinnern" und such dir aus: zur Startzeit, 15 Minuten oder eine Stunde vorher. Die Erinnerung kommt als Push aufs Handy und landet zusätzlich in deinen Benachrichtigungen — mit Poster und direktem Sprung zur Folge.'
          ),
        },
        {
          icon: <GroupAdd />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Zusammen schauen: Freunde einladen'),
          description: t(
            'Lade Freunde zu einem Termin ein. Sie bekommen eine Einladung, und wer annimmt, hat den Termin auch in seinem Plan. Du siehst, wer zugesagt hat; verschiebst du den Termin, zieht er bei allen mit. Deine Notiz bleibt dabei privat.'
          ),
          link: { label: t('Termin planen'), path: '/calendar?mode=plan' },
        },
        {
          icon: <PlaylistAddCheck />,
          color: currentTheme.secondary,
          title: t('Direkt im Plan abhaken'),
          description: t(
            'Geschaut? Ein Tipp auf den Kreis neben dem Eintrag hakt die Folge oder den Film ab — genau wie überall sonst in der App, inklusive Rückgängig.'
          ),
        },
        {
          icon: <CalendarMonth />,
          color: currentTheme.primary,
          title: t('Aufgeräumter Kalender'),
          description: t(
            'Der Kopf des Kalenders ist deutlich ruhiger: deine Favoriten stehen als Avatar-Reihe bereit, und Anime-Season, Serien- und Film-Kalender erreichst du über eine kompakte Zeile.'
          ),
          link: { label: t('Zum Kalender'), path: '/calendar' },
        },
      ],
    },
    {
      version: t('September 2026 – Deine Favoriten unter den Freunden'),
      date: '2026-09-17',
      features: [
        {
          icon: <PeopleAlt />,
          color: currentTheme.primary,
          title: t('Freunde als Favorit markieren'),
          description: t(
            'In deiner Freundesliste sitzt jetzt ein Stern neben jedem Namen. Wen du markierst, rückt in der Liste nach oben — und nur von diesen Leuten zeigt dir die App Bewertungen und Kalender. Du entscheidest also selbst, wessen Meinung dich interessiert.'
          ),
          link: { label: t('Freunde öffnen'), path: '/activity?tab=friends' },
        },
        {
          icon: <Visibility />,
          color: currentTheme.secondary,
          title: t('Sehen, wie deine Favoriten eine Serie fanden'),
          description: t(
            'Beim Bewerten gibt es einen zweiten Reiter: dort stehen die Bewertungen deiner Favoriten zu genau diesem Titel — samt Fortschritt, also ob jemand die Staffel zu Ende geschaut hat oder mittendrin steckt. Praktisch, wenn du überlegst, ob sich das Dranbleiben lohnt. Am Rechner reicht das Zeigen auf den Stern im Kalender.'
          ),
        },
        {
          icon: <CalendarMonth />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Den Kalender eines Favoriten ansehen'),
          description: t(
            'Über dem Wochenraster kannst du auf einen Favoriten umschalten und dessen Woche sehen: seine Serien, sein Fortschritt, seine Bewertungen. Nur zum Ansehen — abhaken und bewerten kannst du dort nichts.'
          ),
          link: { label: t('Zum Kalender'), path: '/calendar' },
        },
        {
          icon: <Tune />,
          color: currentTheme.secondary,
          title: t('Bewerten nach Genre, jetzt überall'),
          description: t(
            'Die aufklappbare Bewertung je Genre gab es bisher nur an manchen Stellen. Sie steckt jetzt auch in der Bewerten-Karte auf der Startseite — damit musst du für eine feinere Bewertung nicht mehr in deine Sammlung wechseln.'
          ),
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.primary,
          title: t('Kleinere Korrekturen'),
          description: t(
            'Im Kalender konnte die Bewertung neben einer Serie leicht von der im Bewertungsfenster abweichen — beide rechnen jetzt gleich. Und ein über die Startseite bewerteter Film landet wieder zuverlässig in deinen Statistiken.'
          ),
        },
      ],
    },
    {
      version: t('August 2026 – TV-Rank spricht vier Sprachen'),
      date: '2026-08-06',
      features: [
        {
          icon: <Language />,
          color: currentTheme.primary,
          title: t('Spanisch und Französisch sind da'),
          description: t(
            'Neben Deutsch und Englisch gibt es TV-Rank jetzt auf Spanisch und Französisch. Beim ersten Start richtet sich die App nach der Sprache deines Geräts — du musst nichts einstellen. Wenn du lieber eine andere möchtest, wählst du sie in den Einstellungen unter Sprache.'
          ),
          link: { label: t('Sprache wählen'), path: '/settings' },
        },
        {
          icon: <LocalMovies />,
          color: currentTheme.secondary,
          title: t('Auch Serien-, Film- und Folgennamen'),
          description: t(
            'Übersetzt ist nicht nur die Oberfläche: Titel und Beschreibungen deiner Serien und Filme erscheinen in deiner Sprache, und auch die Namen einzelner Folgen. Genauso die Suche, die Genres und die Trending-Liste.'
          ),
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.accent || currentTheme.primary,
          title: t('Benachrichtigungen, Push und E-Mails'),
          description: t(
            'Deine tägliche Übersicht, Staffelstarts, Anbieterwechsel, Pet- und Streak-Erinnerungen sowie die Mails zum Zurücksetzen des Passworts kommen ab sofort in deiner Sprache. Schreibt dir ein Freund, sieht jeder die Meldung in seiner eigenen.'
          ),
        },
        {
          icon: <Translate />,
          color: currentTheme.secondary,
          title: t('Diskussionen über Sprachgrenzen hinweg'),
          description: t(
            'Kommentare in einer fremden Sprache bekommen einen Übersetzen-Knopf — auf Wunsch übersetzt die App sie automatisch in deine. Datenschutzerklärung und Impressum liegen ebenfalls auf Spanisch und Französisch vor; rechtlich verbindlich bleibt die deutsche Fassung.'
          ),
        },
      ],
    },
    {
      version: t('Juli 2026 – Der Freunde-Chat'),
      date: '2026-07-24',
      features: [
        {
          icon: <Forum />,
          color: currentTheme.primary,
          title: t('Private Chats mit deinen Freunden'),
          description: t(
            'Schreib deinen Freunden direkt in TV-Rank — über das Papierflieger-Symbol im Freunde-Bereich oder den Chat-Button auf jedem Freund-Profil. Am Desktop als Split-View wie bei Instagram: links deine Chats mit Suche, rechts die Unterhaltung in voller Breite.'
          ),
          link: { label: t('Chats öffnen'), path: '/chats' },
        },
        {
          icon: <EmojiEmotions />,
          color: currentTheme.secondary,
          title: t('Emojis, Herz-Reaktionen & Pet-Sticker'),
          description: t(
            'Der Picker bringt ein kuratiertes Emoji-Set und exklusive Sticker deiner Pets mit — jedes der zehn Pets in Basis- und Entwicklungsform. Und wie beim großen Vorbild: Doppeltipp auf eine Nachricht schenkt ihr ein Herz.'
          ),
        },
        {
          icon: <NotificationsActive />,
          color: currentTheme.status.warning,
          title: t('Live wie ein richtiger Messenger'),
          description: t(
            'Du siehst, wer online ist und wer gerade schreibt, ungelesene Chats sind auf einen Blick markiert, Nachrichten gruppieren sich zu Bubbles mit Tages-Trennern — und wenn du gerade nicht da bist, klopft eine Push-Benachrichtigung an.'
          ),
        },
        {
          icon: <Palette />,
          color: currentTheme.status.purple,
          title: t('Mach den Chat zu deinem'),
          description: t(
            'Gestalte deine Bubbles mit eigenem Farbverlauf und Eckenform — mit Live-Vorschau. Dazu wählst du pro Chat einen Hintergrund: ruhige Verläufe für alle, und die Pet-Szenen, die du im Pet-System schon freigeschaltet hast. Beides siehst nur du.'
          ),
        },
        {
          icon: <Lock />,
          color: currentTheme.status.success,
          title: t('Privatsphäre eingebaut'),
          description: t(
            'Nachrichten sind nur für euch beide lesbar — kein automatisches Mitlesen, keine Auswertung. Unangenehme Chats kannst du melden oder blockieren, Löschen entfernt den Verlauf für beide Seiten, und nach 12 Monaten räumen wir alte Nachrichten automatisch weg.'
          ),
        },
      ],
    },
    {
      version: t('Juli 2026 – Das große Pet-Update'),
      date: '2026-07-24',
      features: [
        {
          icon: <Pets />,
          color: currentTheme.primary,
          title: t('Drei neue Pets: Eule, Pinguin & Axolotl'),
          description: t(
            'Drei neue Begleiter ziehen ein: eine weise Eule, ein watschelnder Pinguin und ein verspielter Axolotl. Jedes hat eine eigene Entwicklungsform ab Level 50 — Erzmagier, Kaiser und Leviathan.'
          ),
          link: { label: t('Zu deinen Pets'), path: '/pets' },
        },
        {
          icon: <AutoAwesome />,
          color: currentTheme.secondary,
          title: t('Alle Pets im neuen Look'),
          description: t(
            'Katze, Hund, Vogel, Drache, Fuchs und Hase wurden komplett neu gezeichnet — weicher, runder, liebenswerter. Ihre Entwicklungsformen bleiben erhalten: Säbelzahn, Wolf, Phönix, Wyvern, Kitsune und Mondhase sehen besser aus als je zuvor.'
          ),
        },
        {
          icon: <Palette />,
          color: currentTheme.status.warning,
          title: t('30 neue Accessoires & 20 neue Hintergründe'),
          description: t(
            'Von der Popcorn-Tüte über die VR-Brille bis zur Galaxien-Krone: 30 neue Accessoires in allen Seltenheiten — acht davon exklusiv in der Mystery Box. Dazu 20 neue Hintergrund-Szenen, vom Autokino über den Koi-Teich bis zur Premierennacht.'
          ),
        },
        {
          icon: <AutoFixHigh />,
          color: currentTheme.status.success,
          title: t('Der gesamte Bestand poliert'),
          description: t(
            'Auch alles Bisherige wurde überarbeitet: Alle 73 bestehenden Accessoires bekamen weiche Formen, Verläufe und Glanzlichter, alle 60 bestehenden Hintergründe wurden als Szenen neu gezeichnet — mit Tiefenebenen und stimmiger Lichtstimmung.'
          ),
        },
      ],
    },
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

  const [latest, ...earlier] = releases;
  const recentCutoff = new Date(latest.date).getTime() - RECENT_DAYS * 86_400_000;
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(earlier.filter((r) => new Date(r.date).getTime() >= recentCutoff).map((r) => r.date))
  );
  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  const open = (path: string) => navigate(path);

  return (
    <div className="patch-notes-page">
      <PageHeader
        title={t('Patch Notes')}
        gradientTo={currentTheme.primary}
        icon={<NewReleases style={{ fontSize: 22, color: currentTheme.accent }} />}
      />

      <motion.section
        className="pn-latest"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="pn-eyebrow">
          <span className="pn-new">{t('Neu')}</span>
          <span>{formatDate(latest.date)}</span>
          <span aria-hidden>·</span>
          <span>{featureCount(latest.features.length)}</span>
        </p>
        <h2 className="pn-latest-title">{releaseName(latest.version)}</h2>
        <div className="pn-grid">
          {latest.features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} lead={i === 0} onOpen={open} />
          ))}
        </div>
      </motion.section>

      {earlier.length > 0 && (
        <section className="pn-earlier">
          <h2 className="pn-earlier-heading">{t('Frühere Updates')}</h2>
          <ol className="pn-timeline">
            {earlier.map((release) => {
              const isOpen = expanded.has(release.date);
              return (
                <li key={release.date + release.version} className="pn-entry">
                  <button
                    type="button"
                    className="pn-entry-head"
                    aria-expanded={isOpen}
                    onClick={() => toggle(release.date)}
                  >
                    <span className="pn-entry-date">{formatDate(release.date)}</span>
                    <span className="pn-entry-dot" aria-hidden />
                    <span className="pn-entry-main">
                      <span className="pn-entry-title">{releaseName(release.version)}</span>
                      <span className="pn-entry-meta">
                        <span className="pn-entry-icons" aria-hidden>
                          {release.features.map((f) => (
                            <span
                              key={f.title}
                              style={{ '--pn-accent': f.color } as React.CSSProperties}
                            >
                              {f.icon}
                            </span>
                          ))}
                        </span>
                        <span>{featureCount(release.features.length)}</span>
                      </span>
                    </span>
                    <ExpandMore className="pn-entry-chevron" />
                  </button>
                  {isOpen && (
                    <motion.div
                      className="pn-grid pn-grid--entry"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {release.features.map((feature) => (
                        <FeatureCard key={feature.title} feature={feature} onOpen={open} />
                      ))}
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
};

const FeatureCard = ({
  feature,
  lead = false,
  onOpen,
}: {
  feature: Feature;
  lead?: boolean;
  onOpen: (path: string) => void;
}) => {
  const link = feature.link;
  return (
    <article
      className={`pn-card${lead ? ' pn-card--lead' : ''}${link ? ' pn-card--link' : ''}`}
      style={{ '--pn-accent': feature.color } as React.CSSProperties}
      onClick={link ? () => onOpen(link.path) : undefined}
    >
      <div className="pn-card-icon" aria-hidden>
        {feature.icon}
      </div>
      <h3 className="pn-card-title">{feature.title}</h3>
      <p className="pn-card-desc">{feature.description}</p>
      {link && (
        <button
          type="button"
          className="pn-card-link"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(link.path);
          }}
        >
          {link.label}
          <ArrowForward />
        </button>
      )}
    </article>
  );
};
