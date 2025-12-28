import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { BackButton } from '../components/BackButton';
import { Shield } from '@mui/icons-material';

interface PrivacyData {
  title: string;
  lastUpdated: string;
  sections: {
    responsible: {
      title: string;
      text: string;
      name: string;
      address: string;
      city: string;
      email: string;
    };
    dataCollection: {
      title: string;
      subsections: {
        localData: {
          title: string;
          text: string;
        };
        noTracking: {
          title: string;
          text: string;
        };
      };
    };
    firebase: {
      title: string;
      intro: string;
      services: {
        auth: {
          title: string;
          purpose: string;
          data: string[];
        };
        database: {
          title: string;
          purpose: string;
          data: string[];
        };
        storage: {
          title: string;
          purpose: string;
          data: string[];
        };
        hosting: {
          title: string;
          purpose: string;
          data: string[];
        };
      };
      privacyLink: string;
      privacyUrl: string;
    };
    apiServices: {
      title: string;
      intro: string;
      services: Array<{
        name: string;
        purpose: string;
      }>;
      note: string;
    };
    rights: {
      title: string;
      intro: string;
      list: string[];
    };
    deletion: {
      title: string;
      text: string;
    };
    security: {
      title: string;
      text: string;
    };
    changes: {
      title: string;
      text: string;
    };
    contact: {
      title: string;
      text: string;
      email: string;
    };
  };
}

export const PrivacyPage = () => {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/legal/privacy.json')
      .then(res => res.json())
      .then(setData)
      .catch(() => {
        // File not found - content must be loaded from external source
        console.error('Legal content file not found');
      })
      .finally(() => setLoading(false));
  }, []);

  // Premium loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: `3px solid ${currentTheme.primary}30`,
            borderTopColor: currentTheme.primary,
          }}
        />
      </div>
    );
  }

  // Premium error state
  if (!data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: currentTheme.background.default,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Shield style={{ fontSize: 36, opacity: 0.4, color: currentTheme.text.secondary }} />
        </div>
        <p style={{ color: currentTheme.text.secondary, fontSize: 15 }}>
          Datenschutzinformationen konnten nicht geladen werden.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-20%',
            width: '60%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${currentTheme.primary}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Premium Glassmorphism Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `${currentTheme.background.default}90`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ fontSize: 22, color: currentTheme.primary }} />
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {data.title}
            </h1>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div
        style={{
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: '12px',
            color: currentTheme.text.secondary,
            marginBottom: '20px',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        >
          {data.lastUpdated}
        </motion.p>

        {/* Verantwortlicher */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.responsible.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginBottom: '12px',
            }}
          >
            {data.sections.responsible.text}
          </p>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.responsible.name}<br />
            {data.sections.responsible.address}<br />
            {data.sections.responsible.city}<br />
            E-Mail: {data.sections.responsible.email}
          </p>
        </div>

        {/* Datenerhebung */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.dataCollection.title}
          </h2>

          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginTop: '16px',
              marginBottom: '8px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.dataCollection.subsections.localData.title}
          </h3>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginBottom: '16px',
            }}
          >
            {data.sections.dataCollection.subsections.localData.text}
          </p>

          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginTop: '16px',
              marginBottom: '8px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.dataCollection.subsections.noTracking.title}
          </h3>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.dataCollection.subsections.noTracking.text}
          </p>
        </div>

        {/* Firebase Services */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.firebase.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginBottom: '16px',
            }}
          >
            {data.sections.firebase.intro}
          </p>

          {/* Firebase Auth */}
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: currentTheme.text.primary,
              }}
            >
              {data.sections.firebase.services.auth.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
              }}
            >
              Zweck: {data.sections.firebase.services.auth.purpose}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
              }}
            >
              Verarbeitete Daten:
            </p>
            <ul
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginLeft: '20px',
              }}
            >
              {data.sections.firebase.services.auth.data.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Firebase Database */}
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: currentTheme.text.primary,
              }}
            >
              {data.sections.firebase.services.database.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
              }}
            >
              Zweck: {data.sections.firebase.services.database.purpose}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
              }}
            >
              Verarbeitete Daten:
            </p>
            <ul
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginLeft: '20px',
              }}
            >
              {data.sections.firebase.services.database.data.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Firebase Storage */}
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: currentTheme.text.primary,
              }}
            >
              {data.sections.firebase.services.storage.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
              }}
            >
              Zweck: {data.sections.firebase.services.storage.purpose}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
              }}
            >
              Verarbeitete Daten:
            </p>
            <ul
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginLeft: '20px',
              }}
            >
              {data.sections.firebase.services.storage.data.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Firebase Hosting */}
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: currentTheme.text.primary,
              }}
            >
              {data.sections.firebase.services.hosting.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
              }}
            >
              Zweck: {data.sections.firebase.services.hosting.purpose}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
              }}
            >
              Verarbeitete Daten:
            </p>
            <ul
              style={{
                fontSize: '14px',
                color: currentTheme.text.secondary,
                marginLeft: '20px',
              }}
            >
              {data.sections.firebase.services.hosting.data.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginTop: '16px',
            }}
          >
            {data.sections.firebase.privacyLink}{' '}
            <a
              href={data.sections.firebase.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: currentTheme.primary,
                textDecoration: 'none',
              }}
            >
              {data.sections.firebase.privacyUrl}
            </a>
          </p>
        </div>

        {/* Externe APIs */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.apiServices.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginBottom: '12px',
            }}
          >
            {data.sections.apiServices.intro}
          </p>
          <ul
            style={{
              fontSize: '14px',
              color: currentTheme.text.secondary,
              marginLeft: '20px',
              marginBottom: '12px',
            }}
          >
            {data.sections.apiServices.services.map((service, idx) => (
              <li key={idx}>
                <strong>{service.name}:</strong> {service.purpose}
              </li>
            ))}
          </ul>
          <p
            style={{
              fontSize: '14px',
              fontStyle: 'italic',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.apiServices.note}
          </p>
        </div>

        {/* Ihre Rechte */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.rights.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
              marginBottom: '12px',
            }}
          >
            {data.sections.rights.intro}
          </p>
          <ul
            style={{
              fontSize: '14px',
              color: currentTheme.text.secondary,
              marginLeft: '20px',
            }}
          >
            {data.sections.rights.list.map((right, idx) => (
              <li key={idx}>{right}</li>
            ))}
          </ul>
        </div>

        {/* Löschung */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.deletion.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.deletion.text}
          </p>
        </div>

        {/* Datensicherheit */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.security.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.security.text}
          </p>
        </div>

        {/* Änderungen */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.changes.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.changes.text}
          </p>
        </div>

        {/* Kontakt */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.contact.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.contact.text}
          </p>
          <p
            style={{
              fontSize: '14px',
              color: currentTheme.text.secondary,
              marginTop: '8px',
            }}
          >
            E-Mail: {data.sections.contact.email}
          </p>
        </div>
      </div>
    </div>
  );
};