import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { SUPPORTED_PROVIDERS } from '../../../config/menuItems';
import { getProviderBrand } from '../../Subscriptions/providerBrands';
import { getProviderLogoUrl } from '../../../lib/providerMerge';
import { TableOfContents } from '../components/TableOfContents';

interface Props {
  stepNumber: number;
  selectedProviders: Set<string>;
  onToggle: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SubscriptionsStep: React.FC<Props> = ({
  stepNumber,
  selectedProviders,
  onToggle,
  onNext,
  onBack,
}) => {
  const providerNames = useMemo(() => Array.from(SUPPORTED_PROVIDERS).sort(), []);
  const count = selectedProviders.size;

  return (
    <motion.div
      className="ob-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(20px, 5vw, 56px) clamp(20px, 5vw, 56px) 0',
          gap: 'clamp(24px, 4vw, 40px)',
          overflow: 'auto',
        }}
      >
        {/* Mast head */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.55)' }}>
            {String(stepNumber).padStart(2, '0')} — Abos
          </span>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
            tv-rank · onboarding
          </span>
        </div>

        <div className="ob-spread">
          {/* Left: hero */}
          <div className="ob-spread__left">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="ob-mono"
                style={{ color: 'var(--ob-text-mute)', marginBottom: 10 }}
              >
                Was streamst du?
              </motion.div>
              <h1
                className="ob-display"
                style={{
                  fontSize: 'clamp(40px, 8vw, 110px)',
                  margin: 0,
                  color: 'var(--ob-paper)',
                  maxWidth: '14ch',
                  lineHeight: 0.95,
                }}
              >
                Deine Abos.
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  color: 'var(--ob-text-mute)',
                  marginTop: 18,
                  fontSize: 14,
                  maxWidth: '36ch',
                  lineHeight: 1.5,
                }}
              >
                Damit zeigen wir dir welche Serien du direkt schauen kannst – und welche dir fehlen.
                Optional, kannst du auch später unter <em>Profil → Streaming-Abos</em>
                pflegen.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="ob-mono"
                style={{ color: 'var(--ob-text-mute)', marginTop: 14, fontSize: 12 }}
              >
                {count} ausgewählt
              </motion.p>
            </div>

            <div className="ob-welcome-side">
              <div className="ob-side-label">
                <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                  Programm
                </span>
                <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', opacity: 0.5 }}>
                  5 Akte
                </span>
              </div>
              <TableOfContents currentStep="subscriptions" variant="horizontal" delay={0.4} />
            </div>
          </div>

          {/* Right: provider tiles */}
          <div className="ob-spread__right">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 10,
                paddingBottom: 24,
              }}
            >
              {providerNames.map((name, i) => {
                const brand = getProviderBrand(name);
                const logo = getProviderLogoUrl(name);
                const selected = selectedProviders.has(name);
                return (
                  <motion.button
                    key={name}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.03, duration: 0.4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onToggle(name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      padding: '16px 12px',
                      borderRadius: 14,
                      border: selected
                        ? `1.5px solid ${brand.color}`
                        : '1px solid rgba(244,237,224,0.12)',
                      background: selected
                        ? `linear-gradient(135deg, ${brand.color}30, ${brand.color}08)`
                        : 'rgba(244,237,224,0.03)',
                      color: 'var(--ob-paper)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: logo
                          ? '#0f1422'
                          : `linear-gradient(135deg, ${brand.color}, ${brand.accent ?? brand.color})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: 14,
                        overflow: 'hidden',
                        boxShadow: selected
                          ? `0 6px 18px -6px ${brand.color}80`
                          : '0 4px 12px -6px rgba(0,0,0,0.4)',
                      }}
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        brand.abbr
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: 'center',
                        lineHeight: 1.25,
                      }}
                    >
                      {name}
                    </span>
                    {selected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: brand.color,
                          boxShadow: `0 0 8px ${brand.color}`,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0 24px 0',
            position: 'sticky',
            bottom: 0,
            background: 'linear-gradient(to top, var(--ob-canvas, #0a0a0a) 60%, transparent)',
            marginTop: 'auto',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            className="ob-mono"
            style={{
              background: 'transparent',
              border: '1px solid rgba(244,237,224,0.15)',
              color: 'rgba(244,237,224,0.6)',
              padding: '12px 24px',
              borderRadius: 999,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← zurück
          </button>
          <button
            type="button"
            onClick={onNext}
            className="ob-mono"
            style={{
              background: 'var(--ob-paper)',
              color: 'var(--ob-canvas, #0a0a0a)',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {count > 0 ? `weiter · ${count} Abo${count === 1 ? '' : 's'}` : 'überspringen'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
