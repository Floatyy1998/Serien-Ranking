import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { FirebaseService, PrivacyData } from './usePrivacyData';

/* ─── Generic Section Card ─── */

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
}

export const PrivacySection = memo(({ title, children }: PrivacySectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <div className="priv-card">
      <h2 className="priv-card-title" style={{ color: currentTheme.text.primary }}>
        {title}
      </h2>
      {children}
    </div>
  );
});

PrivacySection.displayName = 'PrivacySection';

/* ─── Simple text section (deletion, security, changes) ─── */

interface TextSectionProps {
  title: string;
  text: string;
}

export const TextSection = memo(({ title, text }: TextSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={title}>
      <p className="priv-card-text" style={{ color: currentTheme.text.secondary }}>
        {text}
      </p>
    </PrivacySection>
  );
});

TextSection.displayName = 'TextSection';

/* ─── Responsible Section ─── */

interface ResponsibleSectionProps {
  data: PrivacyData['sections']['responsible'];
}

export const ResponsibleSection = memo(({ data }: ResponsibleSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={data.title}>
      <p
        className="priv-card-text priv-card-text--spaced"
        style={{ color: currentTheme.text.secondary }}
      >
        {data.text}
      </p>
      <p className="priv-card-text" style={{ color: currentTheme.text.secondary }}>
        {data.name}
        <br />
        {data.address}
        <br />
        {data.city}
        <br />
        E-Mail: {data.email}
      </p>
    </PrivacySection>
  );
});

ResponsibleSection.displayName = 'ResponsibleSection';

/* ─── Data Collection Section ─── */

interface DataCollectionSectionProps {
  data: PrivacyData['sections']['dataCollection'];
}

export const DataCollectionSection = memo(({ data }: DataCollectionSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={data.title}>
      <h3 className="priv-subtitle" style={{ color: currentTheme.text.primary }}>
        {data.subsections.localData.title}
      </h3>
      <p
        className="priv-card-text priv-card-text--spaced-lg"
        style={{ color: currentTheme.text.secondary }}
      >
        {data.subsections.localData.text}
      </p>

      {data.subsections.cookies && (
        <>
          <h3 className="priv-subtitle" style={{ color: currentTheme.text.primary }}>
            {data.subsections.cookies.title}
          </h3>
          <p className="priv-card-text" style={{ color: currentTheme.text.secondary }}>
            {data.subsections.cookies.text}
          </p>
        </>
      )}
      {data.subsections.noTracking && (
        <>
          <h3 className="priv-subtitle" style={{ color: currentTheme.text.primary }}>
            {data.subsections.noTracking.title}
          </h3>
          <p className="priv-card-text" style={{ color: currentTheme.text.secondary }}>
            {data.subsections.noTracking.text}
          </p>
        </>
      )}
    </PrivacySection>
  );
});

DataCollectionSection.displayName = 'DataCollectionSection';

/* ─── Single Firebase Service Block ─── */

interface FirebaseServiceBlockProps {
  service: FirebaseService;
}

export const FirebaseServiceBlock = memo(({ service }: FirebaseServiceBlockProps) => {
  const { currentTheme } = useTheme();

  return (
    <div className="priv-service-block">
      <h3 className="priv-service-title" style={{ color: currentTheme.text.primary }}>
        {service.title}
      </h3>
      <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
        Zweck: {service.purpose}
      </p>
      {service.legal && (
        <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
          {service.legal}
        </p>
      )}
      <p className="priv-service-label" style={{ color: currentTheme.text.secondary }}>
        Verarbeitete Daten:
      </p>
      <ul className="priv-service-list" style={{ color: currentTheme.text.secondary }}>
        {service.data.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      {service.cookies && (
        <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
          {service.cookies}
        </p>
      )}
      {service.thirdCountry && (
        <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
          {service.thirdCountry}
        </p>
      )}
      {service.consent && (
        <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
          {service.consent}
        </p>
      )}
      {service.optOut && (
        <p className="priv-service-purpose" style={{ color: currentTheme.text.secondary }}>
          {service.optOut}
        </p>
      )}
    </div>
  );
});

FirebaseServiceBlock.displayName = 'FirebaseServiceBlock';

/* ─── Firebase Section (composed from blocks) ─── */

interface FirebaseSectionProps {
  data: PrivacyData['sections']['firebase'];
}

export const FirebaseSection = memo(({ data }: FirebaseSectionProps) => {
  const { currentTheme } = useTheme();
  const serviceKeys = ['auth', 'database', 'storage', 'analytics', 'hosting'] as const;

  return (
    <PrivacySection title={data.title}>
      <p
        className="priv-card-text priv-card-text--spaced-lg"
        style={{ color: currentTheme.text.secondary }}
      >
        {data.intro}
      </p>

      {serviceKeys.map((key) => (
        <FirebaseServiceBlock key={key} service={data.services[key]} />
      ))}

      <p className="priv-privacy-footer" style={{ color: currentTheme.text.secondary }}>
        {data.privacyLink}{' '}
        <a
          href={data.privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="priv-link"
          style={{ color: currentTheme.primary }}
        >
          {data.privacyUrl}
        </a>
      </p>
    </PrivacySection>
  );
});

FirebaseSection.displayName = 'FirebaseSection';

/* ─── API Services Section ─── */

interface ApiServicesSectionProps {
  data: PrivacyData['sections']['apiServices'];
}

export const ApiServicesSection = memo(({ data }: ApiServicesSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={data.title}>
      <p
        className="priv-card-text priv-card-text--spaced"
        style={{ color: currentTheme.text.secondary }}
      >
        {data.intro}
      </p>
      <ul className="priv-api-list" style={{ color: currentTheme.text.secondary }}>
        {data.services.map((service, idx) => (
          <li key={idx}>
            <strong>{service.name}:</strong> {service.purpose}
          </li>
        ))}
      </ul>
      <p className="priv-note" style={{ color: currentTheme.text.secondary }}>
        {data.note}
      </p>
    </PrivacySection>
  );
});

ApiServicesSection.displayName = 'ApiServicesSection';

/* ─── Rights Section ─── */

interface RightsSectionProps {
  data: PrivacyData['sections']['rights'];
}

export const RightsSection = memo(({ data }: RightsSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={data.title}>
      <p
        className="priv-card-text priv-card-text--spaced"
        style={{ color: currentTheme.text.secondary }}
      >
        {data.intro}
      </p>
      <ul className="priv-rights-list" style={{ color: currentTheme.text.secondary }}>
        {data.list.map((right, idx) => (
          <li key={idx}>{right}</li>
        ))}
      </ul>
    </PrivacySection>
  );
});

RightsSection.displayName = 'RightsSection';

/* ─── Contact Section ─── */

interface ContactSectionProps {
  data: PrivacyData['sections']['contact'];
}

export const ContactSection = memo(({ data }: ContactSectionProps) => {
  const { currentTheme } = useTheme();

  return (
    <PrivacySection title={data.title}>
      <p className="priv-card-text" style={{ color: currentTheme.text.secondary }}>
        {data.text}
      </p>
      <p className="priv-contact-email" style={{ color: currentTheme.text.secondary }}>
        E-Mail: {data.email}
      </p>
    </PrivacySection>
  );
});

ContactSection.displayName = 'ContactSection';
