import { Check, Edit, Person, PhotoCamera } from '@mui/icons-material';
import { memo } from 'react';
import { t } from '../../../services/i18n';

interface ProfileSectionProps {
  photoURL: string;
  displayName: string;
  uploading: boolean;
  saving: boolean;
  displayNameEditable: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDisplayNameChange: (value: string) => void;
  onSaveDisplayName: () => void;
  onEditDisplayName: () => void;
}

export const ProfileSection = memo(
  ({
    photoURL,
    displayName,
    uploading,
    saving,
    displayNameEditable,
    fileInputRef,
    onImageUpload,
    onDisplayNameChange,
    onSaveDisplayName,
    onEditDisplayName,
  }: ProfileSectionProps) => {
    return (
      <div className="st-identity">
        <div className="st-identity-avatar">
          {photoURL ? (
            <img
              src={photoURL}
              alt={t('Profilbild von {name}', { name: displayName || t('Benutzer') })}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="st-identity-placeholder" aria-hidden>
              <Person />
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={t('Profilbild hochladen')}
            className="st-identity-camera"
          >
            {uploading ? '…' : <PhotoCamera aria-hidden="true" />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImageUpload}
            accept="image/*"
            aria-hidden="true"
            tabIndex={-1}
            hidden
          />
        </div>

        <div className="st-identity-body">
          <span className="st-identity-label">{t('Anzeigename')}</span>
          {displayNameEditable ? (
            <>
              <div className="st-identity-edit">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  className="glass-input"
                  placeholder={t('Anzeigename eingeben')}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={onSaveDisplayName}
                  disabled={saving}
                  aria-label={t('Speichern')}
                  className="st-identity-save"
                >
                  {saving ? '…' : <Check />}
                </button>
              </div>
              <span className="st-identity-hint">
                {t('So heißt du in der App — andere Nutzer können diesen Namen sehen.')}
              </span>
            </>
          ) : (
            <div className="st-identity-name-row">
              <span className="st-identity-name">{displayName || t('Nicht festgelegt')}</span>
              <button
                type="button"
                onClick={onEditDisplayName}
                aria-label={t('Anzeigename ändern')}
                className="st-identity-edit-btn"
              >
                <Edit aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProfileSection.displayName = 'ProfileSection';
