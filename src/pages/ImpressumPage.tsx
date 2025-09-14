import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { BackButton } from '../components/BackButton';

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
  const { getMobileHeaderStyle, currentTheme } = useTheme();
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Lädt...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: currentTheme.text.secondary }}>
        Rechtliche Informationen konnten nicht geladen werden.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {data.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto',
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