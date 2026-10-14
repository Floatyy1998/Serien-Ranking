import { Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';
import { departmentLabel } from '../../lib/person/filmography';
import type { PersonHit } from '../../lib/person/personSearch';
import { getImageUrl } from '../../utils/imageUrl';
import './PersonCard.css';

interface PersonCardProps {
  person: PersonHit;
  onSelect: (person: PersonHit) => void;
  delay?: number;
}

export const PersonCard = memo(({ person, onSelect, delay = 0 }: PersonCardProps) => {
  const { currentTheme } = useTheme();
  const subtitle = person.knownFor || departmentLabel(person.department);
  return (
    <motion.div
      className="person-card"
      role="button"
      tabIndex={0}
      aria-label={person.name}
      whileTap={tapScale}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay, 0.35), duration: 0.28 }}
      onClick={() => onSelect(person)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(person);
        }
      }}
    >
      <div
        className="person-card__ring"
        style={{
          background: `linear-gradient(140deg, ${currentTheme.primary}, ${currentTheme.accent})`,
        }}
      >
        {person.profilePath ? (
          <img
            className="person-card__img"
            src={getImageUrl(person.profilePath, 'w185')}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="person-card__img person-card__img--empty">
            <Person style={{ fontSize: 34, color: currentTheme.text.muted }} />
          </div>
        )}
      </div>
      <span className="person-card__name" style={{ color: currentTheme.text.primary }}>
        {person.name}
      </span>
      {subtitle && (
        <span className="person-card__sub" style={{ color: currentTheme.text.muted }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
});

PersonCard.displayName = 'PersonCard';
