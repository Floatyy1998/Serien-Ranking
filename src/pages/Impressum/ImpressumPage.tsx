import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { Gavel } from '@mui/icons-material';

interface ImpressumData {
  title: string;
  sections: {
    contact: {
      title: string;
      name: string;
      address: string;
      city: string;
      country: string;
      email: string;
    };
    liability: {
      title: string;
      content: {
        title: string;
        text: string;
      };
    };
    links: {
      title: string;
      text: string;
    };
    copyright: {
      title: string;
      text: string;
    };
  };
}

export const ImpressumPage = () => {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<ImpressumData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/legal/impressum.json')
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
        <LoadingSpinner size={50} />
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
          <Gavel style={{ fontSize: 36, opacity: 0.4, color: currentTheme.text.secondary }} />
        </div>
        <p style={{ color: currentTheme.text.secondary, fontSize: 15 }}>
          Rechtliche Informationen konnten nicht geladen werden.
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
            left: '-20%',
            width: '60%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${currentTheme.primary}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Premium Glassmorphism Header */}
      <PageHeader
        title={data.title}
        gradientTo="#8b5cf6"
        icon={<Gavel style={{ fontSize: 22, color: currentTheme.primary }} />}
      />

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
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
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
              whiteSpace: 'pre-line',
            }}
          >
            {data.sections.contact.name}
            {'\n'}
            {data.sections.contact.address}
            {'\n'}
            {data.sections.contact.city}
            {'\n'}
            {data.sections.contact.country}
            {'\n\n'}
            Kontakt:
            {'\n'}
            E-Mail: {data.sections.contact.email}
          </p>
        </div>

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
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.liability.content.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.liability.content.text}
          </p>
        </div>

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
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.links.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.links.text}
          </p>
        </div>

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
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px',
              color: currentTheme.text.primary,
            }}
          >
            {data.sections.copyright.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: currentTheme.text.secondary,
            }}
          >
            {data.sections.copyright.text}
          </p>
        </div>
      </div>
    </div>
  );
};
