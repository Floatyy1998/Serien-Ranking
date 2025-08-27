import {
  Add,
  BarChart,
  BookmarkBorder,
  EmojiEvents,
  Explore,
  Group,
  LibraryAdd,
  Palette,
  PlayCircleOutline,
  Recommend,
  Search,
  TheaterComedy,
  Tv,
  WifiTethering,
  WavingHand,
  TextFields,
  SkipNext,
  Bookmark,
  Star,
  MoreVert,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useEffect, useState } from 'react';
import { MockSeriesCard } from './MockSeriesCard';
import { TourStep, TourSystem } from './TourSystem';
interface WelcomeTourProps {
  onTourComplete: () => void;
  shouldRestart?: boolean;
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({
  onTourComplete,
  shouldRestart,
}) => {
  const [shouldRunTour, setShouldRunTour] = useState(false);
  const [showMockCard, setShowMockCard] = useState(false);
  const [currentHighlightArea, setCurrentHighlightArea] = useState<string>('');

  useEffect(() => {
    // Check if user should see the tour (initial load)
    const checkTourStatus = async () => {
      const user = firebase.auth().currentUser;
      if (!user || !user.emailVerified) return;

      try {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        console.log('Tour Check - User Data:', userData); // Debug

        // Tour anzeigen wenn:
        // 1. User ist email-verifiziert
        // 2. Tour wurde noch nie abgeschlossen
        const hasSeenTour = userData?.hasCompletedTour;

        console.log('Tour Check - hasSeenTour:', hasSeenTour); // Debug

        if (!hasSeenTour) {
          // Set emailVerifiedAt if not already set
          if (!userData?.emailVerifiedAt) {
            await userRef.update({
              emailVerifiedAt: firebase.database.ServerValue.TIMESTAMP,
            });
          }
          console.log('Tour Check - Starting tour!'); // Debug
          setShouldRunTour(true);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };

    // Delay to ensure UI is rendered
    const timer = setTimeout(checkTourStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  // Separates Effect für manuellen Tour-Restart
  useEffect(() => {
    if (shouldRestart) {
      setShouldRunTour(true);
    }
  }, [shouldRestart]);

  const isMobile = window.innerWidth < 1200;

  const tourSteps: TourStep[] = [
    {
      target: '.main-header-avatar',
      title: (
        <>
          <WavingHand sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Willkommen bei TV-RANK!
        </>
      ),
      content:
        'Hier ist dein Profilbild. Klicke darauf um deine Einstellungen zu öffnen, deinen Benutzernamen zu ändern oder dein Profilbild hochzuladen.',
      position: 'bottom',
      spotlightPadding: 12,
    },
    {
      target: '[data-tour="badge-button"]',
      title: (
        <>
          <EmojiEvents sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
          Badge System
        </>
      ),
      content:
        'Hier findest du alle deine Achievements! Verdiene Badges durch verschiedene Aktivitäten wie das Schauen von Serien, Bewerten oder das Erreichen von Meilensteinen.',
      position: 'bottom',
      spotlightPadding: 10,
    },
    {
      target: '.main-header-button',
      title: (
        <>
          <Group sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Freunde
          System
        </>
      ),
      content:
        'Mit dem Freunde-Button kannst du andere Nutzer als Freunde hinzufügen, ihre Listen einsehen und Aktivitäten verfolgen. Das rote Badge zeigt neue Freundschaftsanfragen an.',
      position: 'bottom',
      spotlightPadding: 10,
    },
    {
      target: isMobile
        ? '[data-tour="mobile-stats-button"]'
        : '[data-tour="stats-grid"]',
      title: (
        <>
          <BarChart sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
          Deine Statistiken
        </>
      ),
      content: isMobile
        ? 'Tippe auf diesen Button um deine persönlichen Statistiken zu sehen: Anzahl Serien, geschaute Episoden, Bewertungen und mehr. Diese werden automatisch basierend auf deiner Aktivität berechnet.'
        : 'Hier siehst du deine persönlichen Statistiken: Anzahl Serien, geschaute Episoden, Bewertungen und mehr. Diese werden automatisch basierend auf deiner Aktivität berechnet.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="tabs"]',
      title: (
        <>
          <Tv sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Serien &
          Filme
        </>
      ),
      content:
        'Wechsle zwischen deiner Serien- und Filme-Sammlung. Beide haben separate Statistiken und Filter-Optionen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: isMobile
        ? '[data-tour="mobile-filters-button"]'
        : '[data-tour="search-filters"]',
      title: (
        <>
          <Search sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Such-
          und Filter-System
        </>
      ),
      content: isMobile
        ? 'Tippe auf diesen Button um Such- und Filter-Optionen zu öffnen. Dort findest du Suchleiste, Buttons zum Hinzufügen und Entdecken von Serien, sowie verschiedene Filter-Optionen. Die Tour wird nach den wichtigsten Bereichen der App fortfahren.'
        : 'Hier kannst du deine Sammlung durchsuchen und filtern. Die Filter helfen dir dabei, schnell bestimmte Inhalte zu finden.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    // Conditional steps: only show these if not on mobile, or if mobile filters are expanded
    ...(isMobile
      ? []
      : ([
          {
            target: '[data-tour="search-input"]',
            title: (
              <>
                <TextFields sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Suchleiste
              </>
            ),
            content:
              'Gib hier den Namen einer Serie ein um sie schnell zu finden. Die Suche funktioniert in Echtzeit während du tippst.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="add-button"]',
            title: (
              <>
                <Add sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
                Serie hinzufügen
              </>
            ),
            content:
              'Mit diesem Button kannst du neue Serien zu deiner Sammlung hinzufügen. Einfach den Namen eingeben und aus den Suchergebnissen auswählen.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="discover-button"]',
            title: (
              <>
                <Explore sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
                Serien entdecken
              </>
            ),
            content:
              'Entdecke noch unveröffentlichte Serien und füge sie zu deiner Wishlist hinzu. So verpasst du keine neuen Releases!',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="recommendations-button"]',
            title: (
              <>
                <Recommend
                  sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }}
                />{' '}
                Empfehlungen
              </>
            ),
            content:
              'Erhalte personalisierte Serienempfehlungen basierend auf deinen Bewertungen und Vorlieben. Der Algorithmus lernt deinen Geschmack!',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="genre-filter"]',
            title: (
              <>
                <TheaterComedy
                  sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }}
                />{' '}
                Genre-Filter
              </>
            ),
            content:
              'Filtere deine Sammlung nach Genres wie Action, Comedy, Drama usw. So findest du schnell Serien eines bestimmten Typs.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="provider-filter"]',
            title: (
              <>
                <PlayCircleOutline
                  sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }}
                />{' '}
                Streaming-Anbieter Filter
              </>
            ),
            content:
              'Zeige nur Serien von bestimmten Anbietern wie Netflix, Amazon Prime, Disney+ etc. Perfekt um zu sehen was auf welcher Plattform verfügbar ist.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="watchlist-button"]',
            title: (
              <>
                <BookmarkBorder
                  sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }}
                />{' '}
                Watchlist
              </>
            ),
            content:
              'Zeige nur Serien aus deiner Watchlist an. Das sind Serien die du als "Geplant" markiert hast und bald schauen möchtest.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
          {
            target: '[data-tour="next-watch-button"]',
            title: (
              <>
                <SkipNext sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Als nächstes schauen
              </>
            ),
            content:
              'Finde heraus welche Episoden oder Serien du als nächstes schauen könntest. Basiert auf deinem aktuellen Fortschritt.',
            position: 'bottom' as const,
            spotlightPadding: 8,
          },
        ] as TourStep[])),
    {
      target: '[data-tour="legend"]',
      title: (
        <>
          <Palette sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
          Legende & Status
        </>
      ),
      content:
        'Die Legende erklärt dir die verschiedenen Farben und Symbole in deiner Liste. Jeder Status hat eine eigene Farbe für bessere Übersicht.',
      position: 'top',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-grid"]',
      title: (
        <>
          <LibraryAdd sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
          Deine Serie Collection
        </>
      ),
      content:
        'Hier siehst du alle deine Serien. Jede Serie wird als Card dargestellt mit wichtigen Informationen. Schauen wir uns eine Serie genauer an!',
      position: 'top',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-providers"]',
      title: (
        <>
          <WifiTethering sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} />{' '}
          Streaming-Anbieter Logos
        </>
      ),
      content:
        'Diese Logos zeigen dir auf welchen Plattformen die Serie verfügbar ist. So weißt du sofort wo du sie schauen kannst.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-watchlist-button"]',
      title: (
        <>
          <Bookmark sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Watchlist-Marker
        </>
      ),
      content:
        'Das Lesezeichen zeigt an, dass diese Serie auf deiner Watchlist steht. Klicke darauf um sie zur Watchlist hinzuzufügen oder zu entfernen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-rating"]',
      title: (
        <>
          <Star sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Bewertung
        </>
      ),
      content:
        'Hier siehst du deine Bewertung für diese Serie. Je höher der Wert, desto besser hat dir die Serie gefallen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-menu"]',
      title: (
        <>
          <MoreVert sx={{ fontSize: '1.2rem', verticalAlign: 'middle' }} /> Aktionsmenü
        </>
      ),
      content:
        "Mit den drei Punkten öffnest du das Menü für weitere Aktionen: Episoden verwalten, Serie bewerten oder löschen. Das war's - du kennst jetzt alle wichtigen Features!",
      position: 'bottom',
      spotlightPadding: 8,
    },
  ];

  const handleTourEnd = async () => {
    setShouldRunTour(false);
    setShowMockCard(false);

    // Mark tour as completed in Firebase
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        await firebase.database().ref(`users/${user.uid}`).update({
          hasCompletedTour: true,
          tourCompletedAt: firebase.database.ServerValue.TIMESTAMP,
        });
      } catch (error) {
        console.error('Error marking tour as completed:', error);
      }
    }

    onTourComplete();
  };

  const handleTourSkip = async () => {
    setShouldRunTour(false);
    setShowMockCard(false);

    // Mark tour as skipped in Firebase
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        await firebase.database().ref(`users/${user.uid}`).update({
          hasCompletedTour: true,
          tourSkippedAt: firebase.database.ServerValue.TIMESTAMP,
        });
      } catch (error) {
        console.error('Error marking tour as skipped:', error);
      }
    }

    onTourComplete();
  };

  // Custom tour logic to show mock card when needed and handle mobile filter expansion
  const customOnStepChange = (currentStep: number) => {
    const currentTarget = tourSteps[currentStep]?.target;

    // Mock card soll bei MockCard-relevanten Targets sichtbar sein
    const mockCardTargets = [
      '[data-tour="series-providers"]',
      '[data-tour="series-watchlist-button"]',
      '[data-tour="series-rating"]',
      '[data-tour="series-menu"]',
    ];

    if (mockCardTargets.includes(currentTarget)) {
      setShowMockCard(true);

      // Auf Mobile nach oben scrollen wenn MockCard erscheint (beim ersten MockCard step)
      const isMobile = window.innerWidth < 768;
      if (isMobile && currentTarget === '[data-tour="series-providers"]') {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }, 300);
      }

      // Bestimme welcher Bereich hervorgehoben werden soll basierend auf dem Target
      if (currentTarget === '[data-tour="series-providers"]') {
        setCurrentHighlightArea('series-providers');
      } else if (currentTarget === '[data-tour="series-watchlist-button"]') {
        setCurrentHighlightArea('series-watchlist-button');
      } else if (currentTarget === '[data-tour="series-rating"]') {
        setCurrentHighlightArea('series-rating');
      } else if (currentTarget === '[data-tour="series-menu"]') {
        setCurrentHighlightArea('series-menu');
      }
    } else {
      // Außerhalb der MockCard-Schritte - verstecke Mock-Card
      setShowMockCard(false);
      setCurrentHighlightArea('');
    }

    // No automatic clicking - let user manually expand filters on mobile
  };

  return (
    <>
      <TourSystem
        steps={tourSteps}
        run={shouldRunTour}
        onTourEnd={handleTourEnd}
        onTourSkip={handleTourSkip}
        onStepChange={customOnStepChange}
      />
      {showMockCard && (
        <MockSeriesCard highlightedArea={currentHighlightArea} />
      )}
    </>
  );
};
