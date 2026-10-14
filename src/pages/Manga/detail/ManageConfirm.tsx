import type { CSSProperties } from 'react';
import { t } from '../../../services/i18n';

interface ManageConfirmProps {
  question: string;
  tone: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Rückfrage als eigene Leiste: Frage oben, Nein/Ja gleich breit darunter. */
export const ManageConfirm = ({ question, tone, onConfirm, onCancel }: ManageConfirmProps) => (
  <div
    className="md-confirm md-manage-wide"
    role="group"
    aria-label={question}
    style={{ '--md-confirm-tone': tone } as CSSProperties}
  >
    <span className="md-confirm-text">{question}</span>
    <div className="md-confirm-actions">
      <button type="button" className="md-confirm-btn" onClick={onCancel}>
        {t('Nein')}
      </button>
      <button type="button" className="md-confirm-btn md-confirm-btn--go" onClick={onConfirm}>
        {t('Ja')}
      </button>
    </div>
  </div>
);
