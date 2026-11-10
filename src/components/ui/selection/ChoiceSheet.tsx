import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BottomSheet } from '../overlay/BottomSheet';
import './SelectionBar.css';

export interface Choice {
  key: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  /** Schon für alle gewählten Titel gesetzt — wird markiert, bleibt aber wählbar. */
  current?: boolean;
  onPick: () => void;
}

interface ChoiceSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  choices: Choice[];
  onClose: () => void;
}

/** Kurze Auswahlliste für eine Sammelaktion (Status, „heute oder früher", Liste). */
export const ChoiceSheet: React.FC<ChoiceSheetProps> = ({
  open,
  title,
  subtitle,
  choices,
  onClose,
}) => {
  const { currentTheme: theme } = useTheme();
  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      ariaLabel={title}
      maxHeight="80vh"
      maxWidth="520px"
    >
      {open && (
        <div className="sel-sheet">
          <div className="sel-sheet-head">
            <h3 className="sel-sheet-title" style={{ color: theme.text.primary }}>
              {title}
            </h3>
            {subtitle && (
              <span className="sel-sheet-sub" style={{ color: theme.text.muted }}>
                {subtitle}
              </span>
            )}
          </div>
          {choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              className="sel-choice"
              aria-pressed={choice.current || undefined}
              onClick={() => {
                onClose();
                choice.onPick();
              }}
              style={{
                borderColor: choice.current ? theme.primary : theme.border.default,
                background: choice.current ? `${theme.primary}1f` : undefined,
                color: theme.text.primary,
              }}
            >
              {choice.icon && (
                <span className="sel-choice-icon" style={{ color: theme.primary }}>
                  {choice.icon}
                </span>
              )}
              <span className="sel-choice-text">
                <span className="sel-choice-label">{choice.label}</span>
                {choice.hint && (
                  <span className="sel-choice-hint" style={{ color: theme.text.muted }}>
                    {choice.hint}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
};
