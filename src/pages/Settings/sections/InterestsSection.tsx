import AddRounded from '@mui/icons-material/AddRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { motion } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FilterPill } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useInterestSuggestions, useOwnInterests } from '../../../hooks/profile/useInterests';
import { showToast } from '../../../lib/interaction/toast';
import { INTERESTS, MAX_INTERESTS, interestById } from '../../../lib/interests/interests';
import { t } from '../../../services/i18n';
import { saveInterests } from '../../../services/profile/interestsService';

const GROUPS = [
  { group: 'franchise', title: 'Filmwelten & Studios' },
  { group: 'genre', title: 'Genres & Themen' },
] as const;

export const InterestsSection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const saved = useOwnInterests(user?.uid);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { suggestions } = useInterestSuggestions(!!user);
  const { hash } = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hash === '#interessen') cardRef.current?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const selected = draft ?? saved ?? [];
  const selectedSet = new Set(selected);
  const openSuggestions = suggestions.filter((s) => !selectedSet.has(s.id));

  const persist = (next: string[]) => {
    if (!user) return;
    setDraft(next);
    saveInterests(user.uid, next)
      .catch(() => showToast(t('Speichern fehlgeschlagen'), 2500, 'error'))
      .finally(() => setDraft(null));
  };

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      persist(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= MAX_INTERESTS) {
      showToast(t('Höchstens {n} Interessen', { n: MAX_INTERESTS }), 2500);
      return;
    }
    persist([...selected, id]);
  };

  const takeAll = () => {
    const room = MAX_INTERESTS - selected.length;
    persist([...selected, ...openSuggestions.slice(0, room).map((s) => s.id)]);
  };

  return (
    <motion.div
      ref={cardRef}
      id="interessen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="settings-card"
      style={{ scrollMarginTop: 'calc(var(--nav-top, 0px) + 64px)' }}
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        {t('Interessen')}
      </h2>
      <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted, margin: 0 }}>
        {t(
          'Stehen in deinem Profil. Ist dein Profil öffentlich, finden dich Leute mit denselben Interessen über die Suche.'
        )}
      </p>

      <div style={{ marginTop: 14 }}>
        <h3
          className="settings-toggle-title"
          style={{ color: currentTheme.text.primary, margin: '0 0 8px' }}
        >
          {t('Deine Interessen')}{' '}
          <span style={{ color: currentTheme.text.muted, fontWeight: 500 }}>
            {t('{n} von {max}', { n: selected.length, max: MAX_INTERESTS })}
          </span>
        </h3>
        {selected.length === 0 ? (
          <p style={{ color: currentTheme.text.muted, fontSize: 13, margin: 0 }}>
            {t('Noch keine ausgewählt')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selected.map((id) => {
              const interest = interestById(id);
              if (!interest) return null;
              return (
                <FilterPill
                  key={id}
                  label={t(interest.label)}
                  active
                  icon={<CheckRounded style={{ fontSize: 16 }} />}
                  onClick={() => toggle(id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {openSuggestions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <h3
              className="settings-toggle-title"
              style={{ color: currentTheme.text.primary, margin: 0 }}
            >
              {t('Vorschläge aus deiner Bibliothek')}
            </h3>
            {selected.length < MAX_INTERESTS && (
              <button
                type="button"
                onClick={takeAll}
                className="settings-link-btn"
                style={{
                  color: currentTheme.primary,
                  background: 'transparent',
                  border: 'none',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {t('Alle übernehmen')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {openSuggestions.map((s) => {
              const interest = interestById(s.id);
              if (!interest) return null;
              return (
                <FilterPill
                  key={s.id}
                  label={t(interest.label)}
                  active={false}
                  badge={s.count}
                  icon={<AddRounded style={{ fontSize: 16 }} />}
                  onClick={() => toggle(s.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="settings-link-btn"
        style={{
          marginTop: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: currentTheme.text.primary,
          background: 'transparent',
          border: 'none',
          font: 'inherit',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {t('Alle Interessen')}
        {showAll ? (
          <ExpandLess style={{ fontSize: 18 }} />
        ) : (
          <ExpandMore style={{ fontSize: 18 }} />
        )}
      </button>

      {showAll &&
        GROUPS.map(({ group, title }) => (
          <div key={group} style={{ marginTop: 12 }}>
            <p style={{ color: currentTheme.text.muted, fontSize: 12.5, margin: '0 0 8px' }}>
              {t(title)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INTERESTS.filter((i) => i.group === group).map((interest) => (
                <FilterPill
                  key={interest.id}
                  label={t(interest.label)}
                  active={selectedSet.has(interest.id)}
                  onClick={() => toggle(interest.id)}
                />
              ))}
            </div>
          </div>
        ))}
    </motion.div>
  );
});

InterestsSection.displayName = 'InterestsSection';
