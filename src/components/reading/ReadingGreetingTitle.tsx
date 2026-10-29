import { useEffect, useMemo, useState } from 'react';
import { GradientText } from '../ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { useCurrentHour } from '../../hooks/ui/useCurrentHour';
import { suggestionScope, type ReadingAreas } from '../../lib/reading/readingMedium';
import { greetingWithName } from '../../lib/text/greetingName';
import { getReadingGreeting } from '../../lib/text/readingGreetings';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { useOpenGreetingWork } from './useOpenGreetingWork';

interface ReadingGreetingTitleProps {
  displayName: string | null | undefined;
  areas: ReadingAreas;
  /** Rückfall, wenn das Werk hinter dem Gruß nicht direkt gefunden wird. */
  onSearch: (query: string, medium: 'books' | 'manga') => void;
}

/** Lese-Gruß mit Namen. Zitate zeigen beim Antippen ihr Werk und öffnen es direkt. */
export const ReadingGreetingTitle = ({
  displayName,
  areas,
  onSearch,
}: ReadingGreetingTitleProps) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const hour = useCurrentHour();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const scope = suggestionScope(areas, bookList.length > 0, mangaList.length > 0);
  const greeting = useMemo(() => getReadingGreeting(hour, scope), [hour, scope]);
  const [infoOpen, setInfoOpen] = useState(false);
  const name = displayName?.split(' ')[0] || 'User';
  const shown = greetingWithName(greeting.text, name, greeting.noName);

  useEffect(() => {
    if (!infoOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rgt-text') && !target.closest('.rgt-tooltip')) setInfoOpen(false);
    };
    document.addEventListener('click', close);
    const timer = setTimeout(() => setInfoOpen(false), 4000);
    return () => {
      document.removeEventListener('click', close);
      clearTimeout(timer);
    };
  }, [infoOpen]);

  const search = greeting.search;
  const openWork = useOpenGreetingWork(onSearch);
  const toggle = () => {
    if (greeting.source) setInfoOpen((open) => !open);
  };

  return (
    <>
      {infoOpen && greeting.source && (
        <div
          className="rgt-tooltip"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(false);
            if (search) void openWork(search);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            color: getOptimalTextColor(currentTheme.primary),
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: search ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          {greeting.source}
          {search && ' →'}
        </div>
      )}
      <GradientText
        as="h1"
        from={currentTheme.primary}
        to={currentTheme.accent}
        style={{
          fontSize: isMobile
            ? 'clamp(15px, calc(var(--effective-width, 412px) * 0.049), 20px)'
            : 'clamp(21px, 0.7vw + 17px, 26px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.18,
          margin: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          className="rgt-text"
          role={greeting.source ? 'button' : undefined}
          tabIndex={greeting.source ? 0 : undefined}
          aria-label={greeting.source ? t('Quelle des Grußes anzeigen') : undefined}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          style={{
            cursor: greeting.source ? 'pointer' : 'default',
            textDecorationLine: greeting.source ? 'underline' : 'none',
            textDecorationStyle: 'dotted',
            textDecorationColor: currentTheme.primary,
            textUnderlineOffset: '3px',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {shown.text}
        </span>
        <span>{shown.tail}</span>
      </GradientText>
    </>
  );
};
