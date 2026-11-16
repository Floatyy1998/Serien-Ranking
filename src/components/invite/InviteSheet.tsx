import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import IosShareRounded from '@mui/icons-material/IosShareRounded';
import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticError, hapticSuccess, hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import { INVITE_CODE_LENGTH } from '../../lib/invite/inviteCode';
import { t } from '../../services/i18n';
import {
  fetchInviteStatus,
  inviteUrl,
  redeemInvite,
  type InviteStatus,
  type RedeemResult,
} from '../../services/invite/inviteService';
import { shareLink } from '../../services/share/shareLink';
import type { Pet } from '../../types/pet.types';
import { copyTextToClipboard } from '../../utils/clipboard';
import { ACCESSORIES } from '../pet/data/accessories';
import { EvolvingPixelPet } from '../pet/EvolvingPixelPet';
import { BottomSheet } from '../ui';
import './InviteSheet.css';

const REWARD_ID = 'buddySprite';

const redeemMessage = (result: RedeemResult): string => {
  switch (result) {
    case 'ok':
      return t('Eingelöst! Dein Geschenk wartet in den Benachrichtigungen.');
    case 'invalid_code':
      return t('Diesen Code gibt es nicht');
    case 'own_code':
      return t('Das ist dein eigener Code');
    case 'account_too_old':
      return t('Einladungen gelten nur für neue Konten');
    case 'already_redeemed':
      return t('Du hast schon einen Code eingelöst');
    case 'onboarding_required':
      return t('Schließe zuerst die Einrichtung ab');
    default:
      return t('Einlösen hat nicht geklappt');
  }
};

interface InviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fester Stand für die Dev-Vorschau, dann ohne Backend-Abruf. */
  fixedStatus?: InviteStatus;
}

export const InviteSheet: React.FC<InviteSheetProps> = ({ isOpen, onClose, fixedStatus }) => {
  const { currentTheme } = useTheme();
  const [status, setStatus] = useState<InviteStatus | null>(fixedStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!isOpen || fixedStatus) return;
    let alive = true;
    setLoading(true);
    void fetchInviteStatus().then((next) => {
      if (!alive) return;
      setStatus(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, fixedStatus]);

  const previewPet = useMemo<Pet>(() => {
    const def = ACCESSORIES[REWARD_ID];
    return {
      id: 'invite-preview',
      userId: 'preview',
      name: 'Preview',
      type: 'fox',
      color: '#ff8a65',
      level: 1,
      experience: 0,
      hunger: 10,
      happiness: 95,
      lastFed: new Date(0),
      episodesWatched: 0,
      createdAt: new Date(0),
      isAlive: true,
      accessories: [
        { id: REWARD_ID, type: def.slot, name: def.name, icon: def.icon, equipped: true },
      ],
    };
  }, []);

  const code = status?.code ?? null;

  const handleShare = async () => {
    if (busy) return;
    hapticTap();
    setBusy(true);
    try {
      const url = inviteUrl(code);
      const text = code
        ? t(
            'Ich tracke meine Serien, Filme und Bücher mit TV-Rank. Mit meinem Code {code} bekommen wir beide ein exklusives Accessoire fürs Pet:',
            { code }
          )
        : t(
            'Ich tracke meine Serien, Filme und Bücher mit TV-Rank. Kostenlos für iPhone, Android und im Browser:'
          );
      const result = await shareLink({
        url,
        title: 'TV-Rank',
        text,
        clipboardText: `${text} ${url}`,
      });
      if (result === 'shared') {
        hapticSuccess();
      } else if (result === 'copied') {
        hapticSuccess();
        showToast(t('Link kopiert!'), 3000);
      } else if (result === 'failed') {
        showToast(t('Teilen nicht möglich'), 3000);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    hapticTap();
    const copied = await copyTextToClipboard(code);
    showToast(copied ? t('Code kopiert!') : t('Kopieren fehlgeschlagen'), 2500);
  };

  const handleRedeem = async () => {
    if (redeeming || !input.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemInvite(input);
      if (result === 'ok') {
        hapticSuccess();
        showToast(redeemMessage(result), 4000, 'success');
        setInput('');
        setStatus((prev) => (prev ? { ...prev, redeemed: true, canRedeem: false } : prev));
      } else {
        hapticError();
        showToast(redeemMessage(result), 3500, 'error');
      }
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('Freunde einladen')}
      maxWidth="480px"
    >
      <div className="invite-sheet">
        <div
          className="invite-sheet__stage"
          style={{
            background: `radial-gradient(closest-side, ${currentTheme.primary}3d, transparent)`,
          }}
        >
          <EvolvingPixelPet pet={previewPet} size={168} animated={false} costume={false} />
        </div>

        <h2 className="invite-sheet__title" style={{ color: currentTheme.text.secondary }}>
          {t('Freunde einladen')}
        </h2>
        <p className="invite-sheet__text" style={{ color: currentTheme.text.muted }}>
          {t(
            'Sobald sich jemand mit deinem Code anmeldet, bekommt ihr beide den „Kleinen Kumpel“ für eure Pets. Ihn gibt es nur über Einladungen.'
          )}
        </p>

        <div
          className="invite-sheet__code"
          style={{ borderColor: `${currentTheme.primary}55`, color: currentTheme.text.secondary }}
        >
          <span className="invite-sheet__code-label" style={{ color: currentTheme.text.muted }}>
            {t('Dein Einladungscode')}
          </span>
          <span className="invite-sheet__code-value" aria-live="polite">
            {code ?? (loading ? '······' : '–')}
          </span>
          {code && (
            <button
              type="button"
              className="invite-sheet__copy"
              onClick={() => void handleCopy()}
              aria-label={t('Code kopieren')}
              style={{ color: currentTheme.primary }}
            >
              <ContentCopyRounded style={{ fontSize: 20 }} />
            </button>
          )}
        </div>

        {status && status.count > 0 && (
          <p className="invite-sheet__count" style={{ color: currentTheme.text.muted }}>
            {t('Angenommene Einladungen: {n}', { n: status.count })}
          </p>
        )}

        <button
          type="button"
          className="invite-sheet__share"
          onClick={() => void handleShare()}
          disabled={busy}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: currentTheme.background.default,
          }}
        >
          <IosShareRounded style={{ fontSize: 20 }} />
          <span>{t('Einladung verschicken')}</span>
        </button>

        {status?.canRedeem && (
          <div className="invite-sheet__redeem">
            <span className="invite-sheet__redeem-label" style={{ color: currentTheme.text.muted }}>
              {t('Du wurdest eingeladen?')}
            </span>
            <div className="invite-sheet__redeem-row">
              <input
                className="invite-sheet__input"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleRedeem();
                }}
                maxLength={INVITE_CODE_LENGTH + 2}
                placeholder={t('Code eingeben')}
                aria-label={t('Code eingeben')}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                style={{ color: currentTheme.text.secondary }}
              />
              <button
                type="button"
                className="invite-sheet__redeem-btn"
                onClick={() => void handleRedeem()}
                disabled={redeeming || !input.trim()}
                style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}66` }}
              >
                {t('Einlösen')}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
