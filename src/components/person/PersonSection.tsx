import { ChevronRight, Person } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import type { PersonHit } from '../../lib/person/personSearch';
import { t } from '../../services/i18n';
import { PersonCard } from './PersonCard';
import './PersonCard.css';

interface PersonSectionProps {
  people: PersonHit[];
  onSelect: (person: PersonHit) => void;
  onSeeAll?: () => void;
  className?: string;
}

export const PersonSection = ({ people, onSelect, onSeeAll, className }: PersonSectionProps) => {
  const { currentTheme } = useTheme();
  return (
    <div className={`person-section${className ? ` ${className}` : ''}`}>
      {onSeeAll && (
        <button
          type="button"
          className="person-section__head"
          onClick={onSeeAll}
          style={{ color: currentTheme.text.muted }}
        >
          <Person style={{ fontSize: 16, color: currentTheme.primary }} />
          {t('Personen')}
          <ChevronRight style={{ fontSize: 16 }} />
        </button>
      )}
      <div className={onSeeAll ? 'person-grid person-grid--row' : 'person-grid'}>
        {people.map((person, i) => (
          <PersonCard key={person.id} person={person} onSelect={onSelect} delay={i * 0.03} />
        ))}
      </div>
    </div>
  );
};

export const PersonGridSkeleton = ({ count = 8 }: { count?: number }) => {
  const { currentTheme } = useTheme();
  return (
    <div className="person-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="person-skeleton">
          <div
            className="person-skeleton__circle"
            style={{ background: `${currentTheme.text.muted}18` }}
          />
          <div
            className="person-skeleton__line"
            style={{ background: `${currentTheme.text.muted}18` }}
          />
        </div>
      ))}
    </div>
  );
};
