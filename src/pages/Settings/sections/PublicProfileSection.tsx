import { ContentCopy, IosShare, Link, Public, Refresh } from '@mui/icons-material';
import { memo } from 'react';
import { t } from '../../../services/i18n';
import { SButton, SButtons, SRow, SSwitch } from '../kit/SettingsKit';

interface PublicProfileSectionProps {
  isPublicProfile: boolean;
  publicProfileId: string;
  isLoadingProfile: boolean;
  onToggle: (enabled: boolean) => void;
  onCopyLink: () => void;
  onShareLink: () => void;
  onRegenerateId: () => void;
}

export const PublicProfileSection = memo(
  ({
    isPublicProfile,
    publicProfileId,
    isLoadingProfile,
    onToggle,
    onCopyLink,
    onShareLink,
    onRegenerateId,
  }: PublicProfileSectionProps) => (
    <SRow
      icon={Public}
      title={t('Profil öffentlich teilen')}
      subtitle={t(
        'Andere können deine Serien und Filme sehen und dich unter „Öffentliche Profile“ finden'
      )}
      trailing={
        <SSwitch
          checked={isPublicProfile}
          onChange={onToggle}
          disabled={isLoadingProfile}
          label={t('Profil öffentlich teilen')}
        />
      }
      below={
        isPublicProfile && publicProfileId ? (
          <div className="st-link">
            <div className="st-link-url">
              <Link aria-hidden />
              <span>{`${window.location.origin}/public/${publicProfileId}`}</span>
            </div>
            <SButtons>
              <SButton
                variant="primary"
                icon={IosShare}
                onClick={onShareLink}
                disabled={isLoadingProfile}
              >
                {t('Teilen')}
              </SButton>
              <SButton icon={ContentCopy} onClick={onCopyLink} disabled={isLoadingProfile}>
                {t('Kopieren')}
              </SButton>
              <SButton icon={Refresh} onClick={onRegenerateId} disabled={isLoadingProfile}>
                {t('Neuer Link')}
              </SButton>
            </SButtons>
            <p className="st-link-hint">
              {t(
                'Wenn aktiviert, können andere deine bewerteten Serien und Filme auch ohne Anmeldung sehen. „Neuer Link“ macht den alten Link ungültig.'
              )}
            </p>
          </div>
        ) : undefined
      }
    />
  )
);

PublicProfileSection.displayName = 'PublicProfileSection';
