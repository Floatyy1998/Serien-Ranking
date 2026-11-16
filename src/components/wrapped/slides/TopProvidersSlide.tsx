import React from 'react';
import { t } from '../../../services/i18n';
import type { TopProviderEntry } from '../../../types/Wrapped';
import { PROVIDER_LOGOS } from '../data/providerLogos';
import { EmptyStage, Giant, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface TopProvidersSlideProps extends SlideProps {
  topProviders: TopProviderEntry[];
  maxDisplay?: number;
}

export const TopProvidersSlide: React.FC<TopProvidersSlideProps> = ({
  topProviders,
  maxDisplay = 5,
  active,
  posters,
}) => {
  const providers = topProviders.slice(0, maxDisplay);
  const top = providers[0];
  if (!top) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Keine Streaming-Daten')}
        hint={t('Markiere Serien mit ihrem Streaming-Dienst')}
      />
    );
  }
  const logo = top.logo || PROVIDER_LOGOS[top.name];
  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Dein Lieblings-Streaming-Dienst')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 4)' }}>
          {logo && (
            <img
              className="w-throw"
              src={logo}
              alt=""
              style={{
                width: 'calc(var(--u) * 20)',
                aspectRatio: '1',
                borderRadius: 'calc(var(--u) * 4.5)',
                objectFit: 'cover',
                boxShadow: '0 calc(var(--u) * 2) calc(var(--u) * 6) rgba(0,0,0,0.35)',
              }}
            />
          )}
          <h2 className="w-title w-title--sm w-in" style={step(1)}>
            {top.name}
          </h2>
        </div>
        <Giant value={Math.round(top.percentage)} suffix="%" />
        <p className="w-line w-in" style={step(4)}>
          {t('deiner Watchtime')}
        </p>
      </div>
      {providers.length > 1 && (
        <ol className="w-bars w-visual">
          {providers.map((provider, i) => (
            <li key={provider.name} className="w-in" style={step(i + 4)}>
              <div className="w-bar__head">
                <span>{provider.name}</span>
                <span>{Math.round(provider.percentage)}%</span>
              </div>
              <div className="w-bar__track">
                <div
                  className="w-bar__fill"
                  style={step(i + 4, { '--w': `${provider.percentage}%` } as React.CSSProperties)}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Stage>
  );
};

export default TopProvidersSlide;
