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

  const tourSteps: TourStep[] = [
    {
      target: '.main-header-avatar',
      title: '👋 Willkommen bei TV-RANK!',
      content:
        'Hier ist dein Profilbild. Klicke darauf um deine Einstellungen zu öffnen, deinen Benutzernamen zu ändern oder dein Profilbild hochzuladen.',
      position: 'bottom',
      spotlightPadding: 12,
    },
    {
      target: '[data-tour="stats-grid"]',
      title: '📊 Deine Statistiken',
      content:
        'Hier siehst du deine persönlichen Statistiken: Anzahl Serien, geschaute Episoden, Bewertungen und mehr. Diese werden automatisch basierend auf deiner Aktivität berechnet.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '.main-header-button',
      title: '👥 Freunde System',
      content:
        'Mit dem Freunde-Button kannst du andere Nutzer als Freunde hinzufügen, ihre Listen einsehen und Aktivitäten verfolgen. Das rote Badge zeigt neue Freundschaftsanfragen an.',
      position: 'bottom',
      spotlightPadding: 10,
    },
    {
      target: '[data-tour="badge-button"]',
      title: '🏆 Badge System',
      content:
        'Hier findest du alle deine Achievements! Verdiene Badges durch verschiedene Aktivitäten wie das Schauen von Serien, Bewerten oder das Erreichen von Meilensteinen.',
      position: 'bottom',
      spotlightPadding: 10,
    },
    {
      target: '[data-tour="tabs"]',
      title: '📺 Serien & Filme',
      content:
        'Wechsle zwischen deiner Serien- und Filme-Sammlung. Beide haben separate Statistiken und Filter-Optionen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="search-filters"]',
      title: '🔍 Such- und Filter-System',
      content:
        'Hier kannst du deine Sammlung durchsuchen und filtern. Die Filter helfen dir dabei, schnell bestimmte Inhalte zu finden.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="search-input"]',
      title: '🔤 Suchleiste',
      content:
        'Gib hier den Namen einer Serie ein um sie schnell zu finden. Die Suche funktioniert in Echtzeit während du tippst.',
      position: 'bottom',
      spotlightPadding: 8,
    },

    {
      target: '[data-tour="add-button"]',
      title: '➕ Serie hinzufügen',
      content:
        'Mit diesem Button kannst du neue Serien zu deiner Sammlung hinzufügen. Einfach den Namen eingeben und aus den Suchergebnissen auswählen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="discover-button"]',
      title: '🔍 Serien entdecken',
      content:
        'Entdecke noch unveröffentlichte Serien und füge sie zu deiner Wishlist hinzu. So verpasst du keine neuen Releases!',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="recommendations-button"]',
      title: '🎯 Empfehlungen',
      content:
        'Erhalte personalisierte Serienempfehlungen basierend auf deinen Bewertungen und Vorlieben. Der Algorithmus lernt deinen Geschmack!',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="genre-filter"]',
      title: '🎭 Genre-Filter',
      content:
        'Filtere deine Sammlung nach Genres wie Action, Comedy, Drama usw. So findest du schnell Serien eines bestimmten Typs.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="provider-filter"]',
      title: '📺 Streaming-Anbieter Filter',
      content:
        'Zeige nur Serien von bestimmten Anbietern wie Netflix, Amazon Prime, Disney+ etc. Perfekt um zu sehen was auf welcher Plattform verfügbar ist.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="watchlist-button"]',
      title: '📋 Watchlist',
      content:
        'Zeige nur Serien aus deiner Watchlist an. Das sind Serien die du als "Geplant" markiert hast und bald schauen möchtest.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="next-watch-button"]',
      title: '⏭️ Als nächstes schauen',
      content:
        'Finde heraus welche Episoden oder Serien du als nächstes schauen könntest. Basiert auf deinem aktuellen Fortschritt.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="legend"]',
      title: '🎨 Legende & Status',
      content:
        'Die Legende erklärt dir die verschiedenen Farben und Symbole in deiner Liste. Jeder Status hat eine eigene Farbe für bessere Übersicht.',
      position: 'top',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-grid"]',
      title: '📱 Deine Serie Collection',
      content:
        'Hier siehst du alle deine Serien. Jede Serie wird als Card dargestellt mit wichtigen Informationen. Schauen wir uns eine Serie genauer an!',
      position: 'top',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-providers"]',
      title: '📺 Streaming-Anbieter Logos',
      content:
        'Diese Logos zeigen dir auf welchen Plattformen die Serie verfügbar ist. So weißt du sofort wo du sie schauen kannst.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-watchlist-button"]',
      title: '🔖 Watchlist-Marker',
      content:
        'Das Lesezeichen zeigt an, dass diese Serie auf deiner Watchlist steht. Klicke darauf um sie zur Watchlist hinzuzufügen oder zu entfernen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-rating"]',
      title: '⭐ Bewertung',
      content:
        'Hier siehst du deine Bewertung für diese Serie. Je höher der Wert, desto besser hat dir die Serie gefallen.',
      position: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="series-menu"]',
      title: '⋮ Aktionsmenü',
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

  // Custom tour logic to show mock card when needed
  const customOnStepChange = (currentStep: number) => {
    // Mock card soll nur bei Schritten 16-19 sichtbar sein (nicht bei series-grid step 15!)
    if (currentStep >= 16 && currentStep <= 19) {
      setShowMockCard(true);

      // Auf Mobile nach oben scrollen wenn MockCard erscheint
      const isMobile = window.innerWidth < 768;
      if (isMobile && currentStep === 16) { // Jetzt bei Step 16 statt 15
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }, 300);
      }

      // Bestimme welcher Bereich hervorgehoben werden soll
      if (currentStep === 16) {
        // series-providers step
        setCurrentHighlightArea('series-providers');
      } else if (currentStep === 17) {
        // series-watchlist-button step
        setCurrentHighlightArea('series-watchlist-button');
      } else if (currentStep === 18) {
        // series-rating step
        setCurrentHighlightArea('series-rating');
      } else if (currentStep === 19) {
        // series-menu step
        setCurrentHighlightArea('series-menu');
      }
    } else {
      // Außerhalb der MockCard-Schritte - verstecke Mock-Card
      setShowMockCard(false);
      setCurrentHighlightArea('');
    }
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
