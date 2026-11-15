import Android from '@mui/icons-material/Android';
import Apple from '@mui/icons-material/Apple';
import DesktopWindows from '@mui/icons-material/DesktopWindows';
import Language from '@mui/icons-material/Language';
import type { SvgIconComponent } from '@mui/icons-material';
import { memo } from 'react';
import { showToast } from '../../../lib/interaction/toast';
import { ANDROID_STORE_URL, IOS_STORE_URL } from '../../../lib/platform/appInstallTarget';
import { nativePlatform } from '../../../services/app/nativeShell';
import { t } from '../../../services/i18n';
import { shareLink } from '../../../services/share/shareLink';
import { SGroup } from '../kit/SettingsKit';

const WEB_URL = 'https://tv-rank.de';
const WINDOWS_URL =
  'https://github.com/Floatyy1998/Serien-Ranking/releases/latest/download/TV-Rank-Setup.exe';
const APK_URL =
  'https://github.com/Floatyy1998/Serien-Ranking/releases/latest/download/TV-Rank.apk';

type Place = 'ios' | 'android' | 'windows' | 'web';

interface Device {
  id: Place;
  icon: SvgIconComponent;
  name: string;
  action: string;
  href?: string;
  download?: boolean;
  onClick?: () => void;
}

const shareWebLink = async () => {
  const result = await shareLink({ url: WEB_URL, title: 'TV-Rank' });
  if (result === 'copied') showToast(t('Link kopiert!'), 2500, 'success');
  else if (result === 'failed') showToast(WEB_URL, 4000, 'info');
};

/** Alle Wege zu TV-Rank auf einen Blick; das Gerät, auf dem man gerade ist, wird markiert. */
export const DevicesSection = memo(({ isElectron }: { isElectron: boolean }) => {
  const native = nativePlatform();
  const here: Place = native ?? (isElectron ? 'windows' : 'web');

  const devices: Device[] = [];
  if (IOS_STORE_URL) {
    devices.push({
      id: 'ios',
      icon: Apple,
      name: t('iPhone & iPad'),
      action: t('Im App Store laden'),
      href: IOS_STORE_URL,
    });
  }
  // In der iOS-App wird keine andere Handy-Plattform beworben (App-Store-Richtlinie).
  if (native !== 'ios') {
    devices.push({
      id: 'android',
      icon: Android,
      name: t('Android'),
      action: t('Bei Google Play laden'),
      href: ANDROID_STORE_URL,
    });
  }
  if (!native) {
    devices.push({
      id: 'windows',
      icon: DesktopWindows,
      name: t('Windows'),
      action: t('App herunterladen'),
      href: WINDOWS_URL,
      download: true,
    });
  }
  devices.push(
    native
      ? {
          id: 'web',
          icon: Language,
          name: t('Website'),
          action: t('Link zu tv-rank.de teilen'),
          onClick: () => void shareWebLink(),
        }
      : {
          id: 'web',
          icon: Language,
          name: t('Website'),
          action: 'tv-rank.de',
          href: WEB_URL,
        }
  );

  return (
    <SGroup
      title={t('TV-Rank auf all deinen Geräten')}
      description={t('Ein Konto, überall derselbe Stand — Handy, Tablet, Computer.')}
      footer={
        !native && !isElectron ? (
          <a className="st-devices-alt" href={APK_URL} download>
            {t('Android ohne Play Store: APK direkt herunterladen')}
          </a>
        ) : undefined
      }
    >
      <div className="st-block st-devices">
        {devices.map((device) => {
          const Icon = device.icon;
          const current = device.id === here;
          const inner = (
            <>
              <span className="st-device-icon">
                <Icon aria-hidden />
              </span>
              <span className="st-device-name">{device.name}</span>
              <span className="st-device-action">
                {current ? t('Hier bist du gerade') : device.action}
              </span>
            </>
          );
          if (current) {
            return (
              <div key={device.id} className="st-device is-current">
                {inner}
              </div>
            );
          }
          if (device.href) {
            return (
              <a
                key={device.id}
                className="st-device"
                href={device.href}
                target={device.download ? undefined : '_blank'}
                rel="noopener noreferrer"
                download={device.download}
              >
                {inner}
              </a>
            );
          }
          return (
            <button key={device.id} type="button" className="st-device" onClick={device.onClick}>
              {inner}
            </button>
          );
        })}
      </div>
    </SGroup>
  );
});

DevicesSection.displayName = 'DevicesSection';
