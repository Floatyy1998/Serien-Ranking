/**
 * RatingQueueCard — Home-Einstieg in die Schnell-Bewertungs-Queue (F8).
 * Zeigt, wie viele „gesehen aber unbewertet"-Titel (Serien + Filme) offen sind
 * und öffnet die wischbare `RatingQueueSheet`.
 */
import StarRate from '@mui/icons-material/StarRate';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { memo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnratedQueue } from '../../hooks/useUnratedQueue';
import { IconContainer, NavCard } from '../../components/ui';
import { RatingQueueSheet } from '../../components/ui/RatingQueueSheet';

export const RatingQueueCard: React.FC = memo(() => {
  const { currentTheme } = useTheme();
  const { items, count, rate, skip } = useUnratedQueue();
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  const accentColor = currentTheme.primary;

  // Kein Reset beim Schließen: bewertete Items fallen über den Realtime-Listener
  // ohnehin raus; übersprungene bleiben für die Session ausgeblendet (ein
  // „später") und tauchen beim nächsten App-Start wieder auf. So blitzt kein
  // gerade bewerteter Titel zurück, bevor der Listener nachgezogen hat.
  const handleClose = () => setOpen(false);

  return (
    <>
      <NavCard
        onClick={() => setOpen(true)}
        accentColor={accentColor}
        aria-label={`Schnell bewerten: ${count} gesehene Titel ohne Bewertung`}
      >
        <IconContainer color={accentColor}>
          <StarRate style={{ fontSize: 20, color: 'white' }} />
        </IconContainer>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: currentTheme.text.primary,
              whiteSpace: 'nowrap',
            }}
          >
            Bewerten
          </h2>
          <p
            style={{
              margin: '1px 0 0',
              fontSize: 12,
              color: currentTheme.text.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            {count} {count === 1 ? 'Titel wartet' : 'Titel warten'} auf deine Bewertung
          </p>
        </div>

        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: accentColor,
            marginRight: 4,
          }}
        >
          {count}
        </span>

        <ChevronRight
          style={{ fontSize: 24, color: currentTheme.text.muted, flexShrink: 0 }}
          aria-hidden="true"
        />
      </NavCard>

      <RatingQueueSheet
        isOpen={open}
        onClose={handleClose}
        items={items}
        onRate={rate}
        onSkip={skip}
      />
    </>
  );
});

RatingQueueCard.displayName = 'RatingQueueCard';
