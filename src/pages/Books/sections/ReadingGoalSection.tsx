import { Flag } from '@mui/icons-material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { goalPace } from '../../../lib/books/bookStats';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Book } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { bookPath } from '../helpers';

interface Props {
  year: number;
  goal: number;
  finished: Book[];
  now: number;
  onSaveGoal: (goal: number) => void;
}

const PRESETS = [6, 12, 24, 52];

export const GoalSheet: React.FC<{
  open: boolean;
  initial: number;
  year: number;
  onClose: () => void;
  onSave: (goal: number) => void;
}> = ({ open, initial, year, onClose, onSave }) => {
  const { currentTheme } = useTheme();
  const [value, setValue] = useState(initial || 12);
  return (
    <BottomSheet isOpen={open} onClose={onClose} ariaLabel={t('Leseziel')}>
      <div className="bk-sheet" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
          {t('Wie viele Bücher willst du {year} lesen?', { year })}
        </h3>
        <input
          className="bk-page-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
          style={{ color: currentTheme.text.secondary, borderColor: `${currentTheme.primary}88` }}
          aria-label={t('Leseziel')}
        />
        <div className="bk-chip-row">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="bk-chip-btn"
              onClick={() => setValue(p)}
              style={{
                color: currentTheme.text.secondary,
                borderColor: value === p ? currentTheme.primary : undefined,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {initial > 0 && (
            <button
              type="button"
              className="bk-cta bk-cta--ghost"
              style={{ flex: 1, color: currentTheme.text.secondary }}
              onClick={() => onSave(0)}
            >
              {t('Ziel entfernen')}
            </button>
          )}
          <button
            type="button"
            className="bk-cta"
            style={{
              flex: 1,
              color: getOptimalTextColor(currentTheme.primary),
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
            onClick={() => onSave(Math.max(1, Math.min(365, Math.round(value) || 1)))}
          >
            {t('Ziel speichern')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export const ReadingGoalSection: React.FC<Props> = ({ year, goal, finished, now, onSaveGoal }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const pace = goalPace(goal, finished.length, now);

  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const paceText = !goal
    ? ''
    : pace.done
      ? t('Ziel geschafft!')
      : pace.diff > 0
        ? t('{n} Bücher vor dem Plan', { n: pace.diff })
        : pace.diff < 0
          ? t('{n} Bücher hinter dem Plan', { n: -pace.diff })
          : t('Genau im Plan');

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<Flag />}
        iconColor={currentTheme.status.warning}
        title={t('Lesechallenge {year}', { year })}
        action={
          goal ? (
            <button
              type="button"
              className="bk-chip-btn"
              style={{ color: currentTheme.text.secondary }}
              onClick={() => setEditing(true)}
            >
              {t('Ändern')}
            </button>
          ) : undefined
        }
      />
      <div className="bk-pad">
        <div className="bk-card">
          {goal ? (
            <div className="bk-goal">
              <div className="bk-goal-ring" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={stroke}
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={pace.done ? currentTheme.status.success : currentTheme.primary}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - pace.percent / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                </svg>
                <div className="bk-goal-ring-center">
                  <span className="bk-goal-count" style={{ color: currentTheme.text.secondary }}>
                    {finished.length}
                  </span>
                  <span className="bk-goal-of" style={{ color: currentTheme.text.muted }}>
                    {t('von {n}', { n: goal })}
                  </span>
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color:
                      pace.diff < 0 && !pace.done
                        ? currentTheme.status.warning
                        : currentTheme.text.secondary,
                  }}
                >
                  {paceText}
                </div>
                <div className="bk-muted" style={{ color: currentTheme.text.muted, marginTop: 2 }}>
                  {pace.done
                    ? t('{n} Bücher über dem Ziel', { n: finished.length - goal })
                    : t('Noch {n} Bücher bis zum Ziel', { n: goal - finished.length })}
                </div>
                {finished.length > 0 && (
                  <div className="bk-goal-covers">
                    {finished.slice(0, 8).map((b) => (
                      <span
                        key={b.id}
                        onClick={() => navigate(bookPath(b.id))}
                        style={{ cursor: 'pointer' }}
                      >
                        <BookCover book={b} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: currentTheme.text.secondary }}>
                  {t('Setz dir ein Leseziel für {year}', { year })}
                </div>
                <div className="bk-muted" style={{ color: currentTheme.text.muted, marginTop: 2 }}>
                  {finished.length > 0
                    ? t('{n} Bücher hast du dieses Jahr schon gelesen.', { n: finished.length })
                    : t('Der Ring füllt sich mit jedem Buch, das du beendest.')}
                </div>
              </div>
              <button
                type="button"
                className="bk-cta"
                style={{
                  color: getOptimalTextColor(currentTheme.primary),
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                }}
                onClick={() => setEditing(true)}
              >
                <Flag style={{ fontSize: 18 }} />
                {t('Ziel setzen')}
              </button>
            </div>
          )}
        </div>
      </div>
      {editing && (
        <GoalSheet
          open={editing}
          initial={goal}
          year={year}
          onClose={() => setEditing(false)}
          onSave={(g) => {
            onSaveGoal(g);
            setEditing(false);
          }}
        />
      )}
    </section>
  );
};
